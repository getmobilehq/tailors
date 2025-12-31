import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  try {
    // Verify admin user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { payment_id, amount, reason } = body

    if (!payment_id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only successful payments can be refunded' },
        { status: 400 }
      )
    }

    if (!payment.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this payment' },
        { status: 400 }
      )
    }

    // Determine refund amount (full or partial)
    const refundAmount = amount ? Math.round(amount * 100) : payment.amount

    if (refundAmount > payment.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed payment amount' },
        { status: 400 }
      )
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        admin_id: user.id,
        reason: reason || 'Admin refund',
      },
    })

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        metadata: {
          ...payment.metadata,
          refund_id: refund.id,
          refund_amount: refundAmount,
          refund_reason: reason,
          refunded_by: user.id,
          refunded_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      // Note: Refund was processed in Stripe, but DB update failed
      return NextResponse.json(
        {
          error: 'Refund processed but database update failed',
          refund_id: refund.id
        },
        { status: 500 }
      )
    }

    // Update order status if needed
    if (refundAmount === payment.amount) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', payment.order_id)
    }

    return NextResponse.json({
      success: true,
      refund_id: refund.id,
      amount: refundAmount,
      message: 'Refund processed successfully'
    })

  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
