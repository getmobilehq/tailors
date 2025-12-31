import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  try {
    // Verify user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if payment failed
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order_id)
      .single()

    if (payment && payment.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed payments can be retried' },
        { status: 400 }
      )
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single()

    // Create new Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'TailorSpace Order',
              description: `Order #${order.id.slice(0, 8)}`,
            },
            unit_amount: order.total,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}?payment_failed=true`,
      customer_email: profile?.email,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        retry: 'true',
      },
    })

    // Create new payment record for retry
    const { error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        stripe_session_id: session.id,
        amount: order.total,
        status: 'pending',
        metadata: {
          retry: true,
          previous_payment_id: payment?.id,
        },
      })

    if (paymentInsertError) {
      console.error('Error creating payment record:', paymentInsertError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
    })

  } catch (error: any) {
    console.error('Payment retry error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
