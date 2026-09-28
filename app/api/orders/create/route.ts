import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  deliveryFeeFor,
  formatDropoffAddress,
  initialStatusFor,
  isDropoffAvailable,
  orderTotal,
  validateOrderDetails,
} from '@/lib/fulfilment'
import { sendOrderConfirmation } from '@/lib/email'
import { formatPrice } from '@/lib/utils'
import type { DropoffLocation } from '@/lib/types'
import type { FulfilmentType, PaymentMethod } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    console.log('[ORDER CREATE] Starting order creation...')

    // Step 1: Verify user authentication with request-specific client
    const supabase = createClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[ORDER CREATE] Auth check - User ID:', user?.id, 'Error:', authError)

    if (!user) {
      console.error('[ORDER CREATE] No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Verify user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single()

    console.log('[ORDER CREATE] Profile check - Profile:', profile, 'Error:', profileError)

    if (!profile) {
      console.error('[ORDER CREATE] User profile not found for user:', user.id)
      return NextResponse.json({
        error: 'User profile not found. Please contact support.',
        details: 'Your account exists but profile is missing. This should not happen.'
      }, { status: 403 })
    }

    const body = await req.json()
    const { items, address, phone, notes, pickupDate, pickupSlot, dropoffDate } = body
    const fulfilment: FulfilmentType = body.fulfilment === 'dropoff' ? 'dropoff' : 'pickup'
    const paymentMethod: PaymentMethod = body.paymentMethod === 'in_person' ? 'in_person' : 'online'

    console.log('[ORDER CREATE] Request data:', {
      itemCount: items?.length,
      address,
      phone,
      pickupDate,
      pickupSlot
    })

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    const detailsError = validateOrderDetails({
      fulfilment,
      paymentMethod,
      address,
      phone,
      pickupDate,
      pickupSlot,
      dropoffDate,
    })

    if (detailsError) {
      return NextResponse.json({ error: detailsError }, { status: 400 })
    }

    // Calculate totals (prices are in pounds as DECIMAL after migration)
    const subtotal = items.reduce((sum: number, item: any) =>
      sum + (item.service.price * item.quantity), 0
    )
    const deliveryFee = deliveryFeeFor(fulfilment)
    const total = orderTotal(subtotal, fulfilment)

    console.log('[ORDER CREATE] Calculated totals - Subtotal:', subtotal, 'Total:', total)

    // Generate order number
    const orderNumber = `TS-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    console.log('[ORDER CREATE] Generated order number:', orderNumber)

    // Step 3: Use admin client to create order (bypasses RLS)
    const adminClient = createAdminClient()

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        status: initialStatusFor(paymentMethod),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        fulfilment_type: fulfilment,
        payment_method: paymentMethod,
        payment_status: 'unpaid',
        customer_address: fulfilment === 'dropoff' ? null : address,
        customer_phone: phone,
        customer_notes: notes || null,
        pickup_date: fulfilment === 'dropoff' ? null : pickupDate,
        pickup_slot: fulfilment === 'dropoff' ? null : pickupSlot,
        dropoff_date: fulfilment === 'dropoff' ? dropoffDate : null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('[ORDER CREATE] Order creation failed:', orderError)
      return NextResponse.json(
        {
          error: 'Failed to create order',
          details: orderError.message,
          code: orderError.code
        },
        { status: 500 }
      )
    }

    console.log('[ORDER CREATE] Order created successfully:', order.id)

    // Step 4: Create order items with admin client (bypasses RLS)
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      service_id: item.service.id,
      garment_description: item.garment_description,
      quantity: item.quantity,
      price: item.service.price, // Already in pounds
      photos: item.photos || [],
      notes: item.notes || null,
    }))

    console.log('[ORDER CREATE] Creating', orderItems.length, 'order items')

    const { error: itemsError } = await adminClient
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('[ORDER CREATE] Order items creation failed:', itemsError)

      // Try to clean up the order
      await adminClient.from('orders').delete().eq('id', order.id)

      return NextResponse.json(
        {
          error: 'Failed to create order items',
          details: itemsError.message,
          code: itemsError.code
        },
        { status: 500 }
      )
    }

    console.log('[ORDER CREATE] Order items created successfully')

    // Online orders are confirmed by the Stripe webhook, which sends the email.
    // A pay-at-the-counter order never goes near Stripe, so send it here.
    if (paymentMethod === 'in_person') {
      const { data: setting } = await adminClient
        .from('site_settings')
        .select('value')
        .eq('key', 'dropoff_location')
        .maybeSingle()

      const location = (setting?.value ?? null) as DropoffLocation | null

      const emailResult = await sendOrderConfirmation({
        to: profile.email,
        customerName: profile.full_name,
        orderNumber,
        orderTotal: formatPrice(total),
        itemCount: items.length,
        dropoff: isDropoffAvailable(location)
          ? {
              date: dropoffDate
                ? new Date(dropoffDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : undefined,
              address: formatDropoffAddress(location!),
              hours: location!.hours,
              amountDue: formatPrice(total),
            }
          : undefined,
      })

      // The order stands even if the email fails; the customer still sees the
      // confirmation screen and the order in their account.
      if (!emailResult.success) {
        console.error('[ORDER CREATE] Confirmation email failed:', emailResult.error)
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      total,
      // Pay-in-person orders are already confirmed; the client skips Stripe
      requiresPayment: paymentMethod === 'online',
    })
  } catch (error: any) {
    console.error('[ORDER CREATE] Unexpected error:', error)
    console.error('[ORDER CREATE] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Order creation failed',
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}
