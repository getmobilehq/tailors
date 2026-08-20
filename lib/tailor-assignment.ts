import { createAdminClient } from '@/lib/supabase/admin'
import { pickTailorForCategory, choosePrimaryTailor } from '@/lib/tailor-assignment-core'

export type AssignmentResult = {
  assigned: { itemId: string; tailorId: string }[]
  unassigned: { itemId: string; reason: string }[]
  primaryTailorId: string | null
}

// Auto-assigns each unassigned item in an order to a tailor whose
// specializations include the item's service category. Picks the active
// tailor with the lowest pending workload, respecting max_concurrent_orders.
// Items with no eligible tailor are left NULL for admin to handle.
export async function assignItemsToTailors(orderId: string): Promise<AssignmentResult> {
  const admin = createAdminClient()

  const { data: items, error: itemsError } = await admin
    .from('order_items')
    .select('id, service:services(category)')
    .eq('order_id', orderId)
    .is('tailor_id', null)

  if (itemsError) throw itemsError
  if (!items || items.length === 0) {
    return { assigned: [], unassigned: [], primaryTailorId: null }
  }

  const { data: tailors, error: tailorsError } = await admin
    .from('tailor_profiles')
    .select('user_id, specializations, max_concurrent_orders')
    .eq('active', true)

  if (tailorsError) throw tailorsError
  if (!tailors || tailors.length === 0) {
    return {
      assigned: [],
      unassigned: items.map((i) => ({ itemId: i.id, reason: 'no active tailors' })),
      primaryTailorId: null,
    }
  }

  const tailorIds = tailors.map((t) => t.user_id)
  const { data: pendingItems, error: loadError } = await admin
    .from('order_items')
    .select('tailor_id')
    .in('tailor_id', tailorIds)
    .neq('status', 'done')

  if (loadError) throw loadError

  const loadByTailor = new Map<string, number>()
  for (const id of tailorIds) loadByTailor.set(id, 0)
  for (const row of pendingItems || []) {
    if (row.tailor_id) loadByTailor.set(row.tailor_id, (loadByTailor.get(row.tailor_id) || 0) + 1)
  }

  const assigned: { itemId: string; tailorId: string }[] = []
  const unassigned: { itemId: string; reason: string }[] = []

  for (const item of items) {
    const category = (item.service as any)?.category as string | undefined
    if (!category) {
      unassigned.push({ itemId: item.id, reason: 'item has no service category' })
      continue
    }

    const pick = pickTailorForCategory(category, tailors, loadByTailor)

    if (!pick) {
      unassigned.push({ itemId: item.id, reason: `no eligible tailor for category '${category}'` })
      continue
    }

    const { error: updateError } = await admin
      .from('order_items')
      .update({ tailor_id: pick.user_id })
      .eq('id', item.id)

    if (updateError) {
      unassigned.push({ itemId: item.id, reason: updateError.message })
      continue
    }

    assigned.push({ itemId: item.id, tailorId: pick.user_id })
    loadByTailor.set(pick.user_id, (loadByTailor.get(pick.user_id) || 0) + 1)
  }

  // Pick a primary tailor (most items) to mirror onto orders.tailor_id so
  // legacy code paths (reviews, messaging, admin views) keep working.
  const primaryTailorId = choosePrimaryTailor(assigned)

  if (primaryTailorId) {
    await admin.from('orders').update({ tailor_id: primaryTailorId }).eq('id', orderId)
  }

  return { assigned, unassigned, primaryTailorId }
}
