import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    const { payout_id, payment_method, notes } = body

    if (!payout_id) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      )
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['bank_transfer', 'paypal', 'stripe', 'cash']
    if (!validMethods.includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', payout_id)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending payouts can be marked as paid' },
        { status: 400 }
      )
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        status: 'paid',
        payment_method,
        notes,
        paid_at: new Date().toISOString(),
        paid_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout_id)

    if (updateError) {
      console.error('Error updating payout:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payout' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payout marked as paid successfully'
    })

  } catch (error: any) {
    console.error('Mark payout paid error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
