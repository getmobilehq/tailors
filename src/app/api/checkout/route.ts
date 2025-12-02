import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { DELIVERY_FEE } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, address, phone, notes, pickupDate, pickupSlot } = await req.json()

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.service.price * item.quantity), 0
    )
    const total = subtotal + DELIVERY_FEE

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        ...items.map((item: any) => ({
          price_data: {
            currency: 'gbp',
            product_data: {
              name: item.service.name,
              description: item.garment_description,
            },
            unit_amount: Math.round(item.service.price * 100),
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
            unit_amount: Math.round(DELIVERY_FEE * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/checkout`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        items: JSON.stringify(items.map((item: any) => ({
          service_id: item.service.id,
          garment_description: item.garment_description,
          quantity: item.quantity,
          price: item.service.price,
          photos: item.photos,
          notes: item.notes,
        }))),
        address: JSON.stringify(address),
        phone,
        notes: notes || '',
        pickup_date: pickupDate,
        pickup_slot: pickupSlot,
        subtotal: subtotal.toString(),
        delivery_fee: DELIVERY_FEE.toString(),
        total: total.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}
