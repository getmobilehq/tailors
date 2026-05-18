import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import { createAdminClient } from '@/lib/supabase/admin'
import { TAILOR_PAYOUT_RATE, RUNNER_FEE_PER_JOB } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(req)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await req.json()

    const { data: updatedRows, error: deliverError } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        completed_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('runner_id', user.id)
      .eq('status', 'out_for_delivery')
      .select('id')

    if (deliverError) throw deliverError
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ ok: true, noop: true })
    }

    const admin = createAdminClient()

    const { data: items } = await admin
      .from('order_items')
      .select('tailor_id, price, quantity')
      .eq('order_id', orderId)

    const { data: order } = await admin
      .from('orders')
      .select('tailor_id, subtotal, runner_id')
      .eq('id', orderId)
      .single()

    if (order) {
      const subtotalsByTailor = new Map<string, number>()
      const itemRows = items || []
      const anyAssigned = itemRows.some((i) => i.tailor_id)

      if (anyAssigned) {
        for (const item of itemRows) {
          if (!item.tailor_id) continue
          const slice = (Number(item.price) || 0) * (Number(item.quantity) || 1)
          subtotalsByTailor.set(item.tailor_id, (subtotalsByTailor.get(item.tailor_id) || 0) + slice)
        }
      } else if (order.tailor_id) {
        subtotalsByTailor.set(order.tailor_id, Number(order.subtotal) || 0)
      }

      const payoutRows: any[] = []
      for (const [tailorId, subtotal] of subtotalsByTailor) {
        payoutRows.push({
          user_id: tailorId,
          order_id: orderId,
          amount: Math.round(subtotal * TAILOR_PAYOUT_RATE * 100), // pence
          status: 'pending',
        })
      }
      if (order.runner_id) {
        payoutRows.push({
          user_id: order.runner_id,
          order_id: orderId,
          amount: Math.round(RUNNER_FEE_PER_JOB * 100),
          status: 'pending',
        })
      }

      if (payoutRows.length > 0) {
        await admin.from('payouts').insert(payoutRows)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Deliver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark delivered' },
      { status: 500 }
    )
  }
}
