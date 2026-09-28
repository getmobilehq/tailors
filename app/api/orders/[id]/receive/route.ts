import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff-auth'
import { assignItemsToTailors } from '@/lib/tailor-assignment'

/**
 * The customer has handed their items in at the counter. This is the drop-off
 * equivalent of a runner marking a pickup collected, so it moves the order to
 * the same 'collected' status and kicks off tailor assignment the same way.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff(['admin', 'tailor'])
  if (!auth.ok) return auth.response

  try {
    const { measurements, notes } = await request.json().catch(() => ({}))

    const { data: updated, error } = await auth.ctx.admin
      .from('orders')
      .update({
        status: 'collected',
        dropped_off_at: new Date().toISOString(),
        collected_at: new Date().toISOString(),
        ...(measurements ? { measurements } : {}),
        ...(notes ? { admin_notes: notes } : {}),
      })
      .eq('id', params.id)
      .eq('fulfilment_type', 'dropoff')
      .eq('status', 'booked')
      .select('id')

    if (error) throw error

    // Already received, or not a drop-off order awaiting one. Don't run
    // assignment off a no-op update.
    if (!updated || updated.length === 0) {
      return NextResponse.json({ ok: true, noop: true })
    }

    const result = await assignItemsToTailors(params.id)

    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error('Drop-off receive error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record the drop-off' },
      { status: 500 }
    )
  }
}
