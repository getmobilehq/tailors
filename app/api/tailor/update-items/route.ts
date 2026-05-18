import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import { createAdminClient } from '@/lib/supabase/admin'

type ItemUpdate = { id: string; status: string; tailor_notes?: string | null }
const VALID_STATUS = new Set(['pending', 'in_progress', 'done'])

// Tailors update only the items assigned to them, then the order is
// transitioned server-side with the admin client. This avoids the orders
// RLS policy (which only recognises the single mirrored primary tailor),
// so a secondary tailor finishing the last items still moves the order
// forward instead of being silently denied.
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, items } = (await req.json()) as {
      orderId?: string
      items?: ItemUpdate[]
    }
    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'orderId and items are required' },
        { status: 400 }
      )
    }
    for (const it of items) {
      if (!it?.id || !VALID_STATUS.has(it.status)) {
        return NextResponse.json({ error: 'Invalid item payload' }, { status: 400 })
      }
    }

    const admin = createAdminClient()

    const { data: orderItems, error: loadErr } = await admin
      .from('order_items')
      .select('id, tailor_id, status')
      .eq('order_id', orderId)
    if (loadErr) throw loadErr
    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Authorize: only act on items in this order owned by the caller.
    const ownedIds = new Set(
      orderItems.filter((i) => i.tailor_id === user.id).map((i) => i.id)
    )
    const toUpdate = items.filter((it) => ownedIds.has(it.id))
    if (toUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No items assigned to you in this order' },
        { status: 403 }
      )
    }

    for (const it of toUpdate) {
      const { error: upErr } = await admin
        .from('order_items')
        .update({ status: it.status, tailor_notes: it.tailor_notes || null })
        .eq('id', it.id)
        .eq('tailor_id', user.id)
      if (upErr) throw upErr
    }

    // Decide the order transition from the authoritative post-update set.
    const updatedById = new Map(toUpdate.map((it) => [it.id, it.status]))
    const finalStatuses = orderItems.map((i) => updatedById.get(i.id) ?? i.status)
    const allDone = finalStatuses.every((s) => s === 'done')
    const anyActive = finalStatuses.some((s) => s === 'in_progress' || s === 'done')

    const { data: ord } = await admin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    let orderStatus: string | null = ord?.status ?? null
    if (ord) {
      if (allDone && ['collected', 'in_progress'].includes(ord.status)) {
        await admin.from('orders').update({ status: 'ready' }).eq('id', orderId)
        orderStatus = 'ready'
      } else if (!allDone && anyActive && ord.status === 'collected') {
        await admin.from('orders').update({ status: 'in_progress' }).eq('id', orderId)
        orderStatus = 'in_progress'
      }
    }

    return NextResponse.json({ ok: true, orderStatus, allDone })
  } catch (error: any) {
    console.error('Update items error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update items' },
      { status: 500 }
    )
  }
}
