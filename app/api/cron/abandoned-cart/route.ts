import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCartReminder } from '@/lib/email'
import { generateRecoveryToken, buildRecoveryUrl, buildUnsubscribeUrl } from '@/lib/recovery'
import { DELIVERY_FEE } from '@/lib/constants'

const MAX_EMAILS_PER_RUN = 50

// Time thresholds in milliseconds
const ONE_HOUR = 60 * 60 * 1000
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

function getSequenceNumber(elapsedMs: number): 1 | 2 | 3 | null {
  if (elapsedMs >= SEVENTY_TWO_HOURS) return 3
  if (elapsedMs >= TWENTY_FOUR_HOURS) return 2
  if (elapsedMs >= ONE_HOUR) return 1
  return null
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  let emailsSent = 0
  const results = { payment: 0, cart: 0, cleaned: 0, errors: [] as string[] }

  try {
    // ====================================
    // 1. PAYMENT ABANDONMENT
    // ====================================
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select(`
        id, order_number, customer_id, created_at, subtotal, delivery_fee, total,
        customer:users!orders_customer_id_fkey(id, email, full_name, email_preferences)
      `)
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: true })

    if (pendingOrders) {
      for (const order of pendingOrders) {
        if (emailsSent >= MAX_EMAILS_PER_RUN) break

        const customer = order.customer as any
        if (!customer?.email) continue

        // Check email preferences
        const prefs = customer.email_preferences || { cart_reminders: true }
        if (!prefs.cart_reminders) continue

        const elapsed = Date.now() - new Date(order.created_at).getTime()
        const targetSequence = getSequenceNumber(elapsed)
        if (!targetSequence) continue

        // Check what reminders have already been sent
        const { data: existingReminders } = await supabase
          .from('cart_reminders')
          .select('sequence_number')
          .eq('order_id', order.id)
          .eq('reminder_type', 'payment_abandonment')

        const sentSequences = new Set(existingReminders?.map(r => r.sequence_number) || [])

        // Send the highest applicable sequence that hasn't been sent yet
        for (let seq = 1; seq <= targetSequence; seq++) {
          if (sentSequences.has(seq) || emailsSent >= MAX_EMAILS_PER_RUN) continue

          // Re-check order status before sending (race condition safety)
          const { data: freshOrder } = await supabase
            .from('orders')
            .select('status')
            .eq('id', order.id)
            .single()

          if (freshOrder?.status !== 'pending_payment') break

          // Get order items for the email
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('quantity, price, service:services(name)')
            .eq('order_id', order.id)

          const items = (orderItems || []).map((item: any) => ({
            serviceName: item.service?.name || 'Alteration Service',
            quantity: item.quantity,
            price: item.price / 100,
          }))

          const token = generateRecoveryToken()
          const recoveryUrl = buildRecoveryUrl(token)
          const unsubscribeUrl = buildUnsubscribeUrl(customer.id)

          const emailResult = await sendCartReminder({
            to: customer.email,
            customerName: customer.full_name,
            items,
            subtotal: formatPrice(order.subtotal),
            total: formatPrice(order.total),
            recoveryUrl,
            unsubscribeUrl,
            sequenceNumber: seq as 1 | 2 | 3,
            reminderType: 'payment_abandonment',
            orderNumber: order.order_number,
          })

          if (emailResult.success) {
            await supabase.from('cart_reminders').insert({
              user_id: customer.id,
              order_id: order.id,
              reminder_type: 'payment_abandonment',
              sequence_number: seq,
              recovery_token: token,
            })
            emailsSent++
            results.payment++
          } else {
            results.errors.push(`Payment reminder #${seq} failed for order ${order.order_number}`)
          }
        }
      }
    }

    // ====================================
    // 2. CART ABANDONMENT
    // ====================================
    const { data: savedCarts } = await supabase
      .from('saved_carts')
      .select(`
        id, user_id, items, last_active_at,
        user:users!saved_carts_user_id_fkey(id, email, full_name, email_preferences)
      `)
      .neq('items', '[]')
      .order('last_active_at', { ascending: true })

    if (savedCarts) {
      for (const cart of savedCarts) {
        if (emailsSent >= MAX_EMAILS_PER_RUN) break

        const user = cart.user as any
        if (!user?.email) continue

        const prefs = user.email_preferences || { cart_reminders: true }
        if (!prefs.cart_reminders) continue

        // Skip if user has a pending_payment order (avoid double emails)
        const { data: pendingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', cart.user_id)
          .eq('status', 'pending_payment')
          .limit(1)

        if (pendingOrder && pendingOrder.length > 0) continue

        const elapsed = Date.now() - new Date(cart.last_active_at).getTime()
        const targetSequence = getSequenceNumber(elapsed)
        if (!targetSequence) continue

        const { data: existingReminders } = await supabase
          .from('cart_reminders')
          .select('sequence_number')
          .eq('saved_cart_id', cart.id)
          .eq('reminder_type', 'cart_abandonment')

        const sentSequences = new Set(existingReminders?.map(r => r.sequence_number) || [])

        const cartItems = (cart.items as any[]) || []

        for (let seq = 1; seq <= targetSequence; seq++) {
          if (sentSequences.has(seq) || emailsSent >= MAX_EMAILS_PER_RUN) continue

          const items = cartItems.map((item: any) => ({
            serviceName: item.service_name || 'Alteration Service',
            quantity: item.quantity || 1,
            price: item.service_price || 0,
          }))

          const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
          const total = subtotal + DELIVERY_FEE

          const token = generateRecoveryToken()
          const recoveryUrl = buildRecoveryUrl(token)
          const unsubscribeUrl = buildUnsubscribeUrl(user.id)

          const emailResult = await sendCartReminder({
            to: user.email,
            customerName: user.full_name,
            items,
            subtotal: `£${subtotal.toFixed(2)}`,
            total: `£${total.toFixed(2)}`,
            recoveryUrl,
            unsubscribeUrl,
            sequenceNumber: seq as 1 | 2 | 3,
            reminderType: 'cart_abandonment',
          })

          if (emailResult.success) {
            await supabase.from('cart_reminders').insert({
              user_id: user.id,
              saved_cart_id: cart.id,
              reminder_type: 'cart_abandonment',
              sequence_number: seq,
              recovery_token: token,
            })
            emailsSent++
            results.cart++
          } else {
            results.errors.push(`Cart reminder #${seq} failed for user ${user.email}`)
          }
        }
      }
    }

    // ====================================
    // 3. CLEANUP
    // ====================================
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS).toISOString()

    // Cancel stale pending_payment orders
    const { data: staleOrders } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('status', 'pending_payment')
      .lt('created_at', sevenDaysAgo)
      .select('id')

    // Delete stale saved carts
    const { data: staleCarts } = await supabase
      .from('saved_carts')
      .delete()
      .lt('last_active_at', thirtyDaysAgo)
      .select('id')

    results.cleaned = (staleOrders?.length || 0) + (staleCarts?.length || 0)

    console.log('Abandoned cart cron completed:', results)

    return NextResponse.json({
      success: true,
      emailsSent,
      ...results,
    })
  } catch (error) {
    console.error('Abandoned cart cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}
