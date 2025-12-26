import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/request'
import { DELIVERY_FEE } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: NextRequest) {
  try {
    console.log('[CHECKOUT] Starting Stripe checkout session creation...')

    const supabase = createClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[CHECKOUT] Auth check - User ID:', user?.id, 'Error:', authError)

    if (!user) {
      console.error('[CHECKOUT] No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, orderNumber, total } = await req.json()

    console.log('[CHECKOUT] Request data:', { orderId, orderNumber, total })

    if (!orderId || !orderNumber || !total) {
      console.error('[CHECKOUT] Missing required fields')
      return NextResponse.json(
        { error: 'Missing order details' },
        { status: 400 }
      )
    }

    // Fetch order details to display in Stripe
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          service:services (*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('[CHECKOUT] Order fetch failed:', orderError)
      return NextResponse.json(
        {
          error: 'Order not found',
          details: orderError.message
        },
        { status: 404 }
      )
    }

    if (!order) {
      console.error('[CHECKOUT] Order not found for ID:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('[CHECKOUT] Order found:', {
      id: order.id,
      orderNumber: order.order_number,
      itemCount: order.order_items?.length,
      total: order.total
    })

    // Verify order belongs to user
    if (order.customer_id !== user.id) {
      console.error('[CHECKOUT] Order ownership mismatch - Order customer:', order.customer_id, 'User:', user.id)
      return NextResponse.json(
        { error: 'Unauthorized - Order does not belong to you' },
        { status: 403 }
      )
    }

    // Create Stripe checkout session
    console.log('[CHECKOUT] Creating Stripe session...')

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        ...order.order_items.map((item: any) => ({
          price_data: {
            currency: 'gbp',
            product_data: {
              name: item.service.name,
              description: item.garment_description || 'Alteration service',
            },
            unit_amount: Math.round(item.price * 100), // Convert pounds to pence for Stripe
          },
          quantity: item.quantity,
        })),
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Pickup & Delivery',
              description: 'Expert collection and delivery to your door',
            },
            unit_amount: Math.round(DELIVERY_FEE * 100), // Convert pounds to pence for Stripe
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/checkout`,
      customer_email: user.email,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
      },
    })

    console.log('[CHECKOUT] Stripe session created successfully:', session.id)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('[CHECKOUT] Unexpected error:', error)
    console.error('[CHECKOUT] Error stack:', error.stack)

    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      return NextResponse.json(
        {
          error: 'Payment processing error',
          details: error.message,
          type: error.type
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Checkout failed',
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}
