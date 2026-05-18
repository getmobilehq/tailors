import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import { assignItemsToTailors } from '@/lib/tailor-assignment'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(req)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, measurements, runnerNotes } = await req.json()

    const { data: updatedRows, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'collected',
        measurements: measurements || {},
        runner_notes: runnerNotes || null,
        collected_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('runner_id', user.id)
      .eq('status', 'pickup_scheduled')
      .select('id')

    if (orderError) throw orderError
    if (!updatedRows || updatedRows.length === 0) {
      // Already collected, wrong runner, or not in pickup_scheduled —
      // don't run assignment off a no-op update.
      return NextResponse.json({ ok: true, noop: true })
    }

    const result = await assignItemsToTailors(orderId)

    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error('Collect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark collected' },
      { status: 500 }
    )
  }
}
