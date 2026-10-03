import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmation } from '@/lib/email'
import { formatPrice } from '@/lib/utils'
import { PICKUP_SLOTS } from '@/lib/constants'
import { formatDropoffAddress, isPostalAvailable } from '@/lib/fulfilment'
import type { DropoffLocation } from '@/lib/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Use service role for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata!

    try {
      const orderId = metadata.order_id
      const orderNumber = metadata.order_number

      // Update order status from pending_payment to booked
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'booked',
          payment_status: 'paid',
          paid_method: 'stripe',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (orderError) {
        console.error('Order update failed:', orderError)
        return NextResponse.json(
          { error: 'Order update failed' },
          { status: 500 }
        )
      }

      // Create payment record
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id(full_name, email),
          items:order_items(id)
        `)
        .eq('id', orderId)
        .single()

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: order?.total || 0,
          status: 'succeeded',
        })

      if (paymentError) {
        console.error('Payment record creation failed:', paymentError)
      }

      // Send order confirmation email
      if (order && order.customer) {
        const pickupSlot = PICKUP_SLOTS.find(s => s.id === order.pickup_slot)

        // Postal customers need the address to send their items to; it is not
        // in the pickup fields, so load it the same way checkout does.
        let dropoff
        if (order.fulfilment_type === 'postal') {
          const { data: setting } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'dropoff_location')
            .maybeSingle()

          const location = setting?.value as DropoffLocation | null

          if (isPostalAvailable(location)) {
            dropoff = {
              mode: 'postal' as const,
              address: formatDropoffAddress(location!),
              hours: location!.hours,
            }
          }
        }

        await sendOrderConfirmation({
          to: order.customer.email,
          customerName: order.customer.full_name,
          orderNumber: order.order_number,
          orderTotal: formatPrice(order.total),
          pickupDate: order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : undefined,
          pickupTime: pickupSlot?.label,
          itemCount: order.items?.length || 0,
          dropoff,
        })
        console.log(`Order confirmation email sent to ${order.customer.email}`)
      }

      // Mark cart reminders as recovered (if this was an abandoned cart recovery)
      await supabase
        .from('cart_reminders')
        .update({ recovered_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .is('recovered_at', null)

      // Clean up saved cart for this user
      if (order?.customer_id) {
        await supabase
          .from('saved_carts')
          .delete()
          .eq('user_id', order.customer_id)
      }

      console.log(`Order confirmed successfully: ${orderNumber}`)
    } catch (error: any) {
      console.error('Webhook processing error:', error)
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
