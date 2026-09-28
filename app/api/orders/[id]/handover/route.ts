import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff-auth'

/**
 * The customer has collected their finished items from the counter. No runner
 * delivery leg, so the order goes straight from 'ready' to 'completed'.
 *
 * Refuses while the order is still unpaid: the counter is the only chance to
 * take the money on a pay-in-person order.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff(['admin', 'tailor'])
  if (!auth.ok) return auth.response

  try {
    const { data: order, error: loadError } = await auth.ctx.admin
      .from('orders')
      .select('id, status, payment_status, fulfilment_type')
      .eq('id', params.id)
      .single()

    if (loadError) throw loadError

    if (order.fulfilment_type !== 'dropoff') {
      return NextResponse.json(
        { error: 'This order is delivered by a runner, not collected in person' },
        { status: 400 }
      )
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Take payment before handing the items over' },
        { status: 409 }
      )
    }

    const { data: updated, error } = await auth.ctx.admin
      .from('orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('status', 'ready')
      .select('id')

    if (error) throw error

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'The items are not marked ready yet' },
        { status: 409 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Handover error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete the order' },
      { status: 500 }
    )
  }
}
