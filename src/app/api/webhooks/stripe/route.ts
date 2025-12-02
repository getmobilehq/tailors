import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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
      // Generate order number
      const orderNumber = `TS-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: metadata.user_id,
          status: 'booked',
          subtotal: parseFloat(metadata.subtotal),
          delivery_fee: parseFloat(metadata.delivery_fee),
          total: parseFloat(metadata.total),
          customer_address: JSON.parse(metadata.address),
          customer_phone: metadata.phone,
          customer_notes: metadata.notes || null,
          pickup_date: metadata.pickup_date,
          pickup_slot: metadata.pickup_slot,
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation failed:', orderError)
        return NextResponse.json(
          { error: 'Order creation failed' },
          { status: 500 }
        )
      }

      // Create order items
      const items = JSON.parse(metadata.items)
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        service_id: item.service_id,
        garment_description: item.garment_description,
        quantity: item.quantity,
        price: item.price,
        photos: item.photos || [],
        notes: item.notes || null,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items creation failed:', itemsError)
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: parseFloat(metadata.total),
          status: 'succeeded',
        })

      if (paymentError) {
        console.error('Payment record creation failed:', paymentError)
      }

      console.log(`Order created successfully: ${orderNumber}`)
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
