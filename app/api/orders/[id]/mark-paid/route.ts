import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff-auth'

const METHODS = ['cash', 'card'] as const

/**
 * Record a payment taken at the counter. Stripe payments are recorded by the
 * webhook instead, so this only accepts cash and card-machine takings.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff(['admin', 'tailor'])
  if (!auth.ok) return auth.response

  try {
    const { method } = await request.json()

    if (!METHODS.includes(method)) {
      return NextResponse.json(
        { error: `Payment method must be one of: ${METHODS.join(', ')}` },
        { status: 400 }
      )
    }

    const { admin, userId } = auth.ctx
    const paidAt = new Date().toISOString()

    const { data: updated, error } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_method: method,
        paid_at: paidAt,
        paid_by: userId,
      })
      .eq('id', params.id)
      .eq('payment_method', 'in_person')
      .eq('payment_status', 'unpaid')
      .select('id, total')

    if (error) throw error

    // Already paid, or an online order whose payment belongs to Stripe
    if (!updated || updated.length === 0) {
      return NextResponse.json({ ok: true, noop: true })
    }

    const { error: ledgerError } = await admin.from('payments').insert({
      order_id: params.id,
      amount: updated[0].total,
      status: 'succeeded',
      method,
      recorded_by: userId,
    })

    // The order is paid either way; a missing ledger row shouldn't undo that
    if (ledgerError) {
      console.error('Failed to write counter payment to the ledger:', ledgerError)
    }

    return NextResponse.json({ ok: true, amount: updated[0].total })
  } catch (error: any) {
    console.error('Mark paid error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record the payment' },
      { status: 500 }
    )
  }
}
