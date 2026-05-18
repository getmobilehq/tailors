import { TAILOR_PAYOUT_RATE } from '@/lib/constants'

type ItemLike = {
  tailor_id?: string | null
  price?: number | null
  quantity?: number | null
  status?: string
}
type OrderLike = { tailor_id?: string | null; subtotal?: number | null; items?: ItemLike[] | null }

// Returns the tailor's slice of an order in pounds (matches formatPrice expectations).
// New flow: sum of price * quantity across items assigned to this tailor.
// Legacy flow (no items have tailor_id yet): if the tailor is orders.tailor_id,
// they get the full subtotal share. Otherwise zero.
// Note: prices are stored in pence in the DB but displays use pounds; the existing
// codebase already treats `subtotal` as pounds in tailor views, so we mirror that.
export function tailorItemsSubtotal(order: OrderLike, tailorId: string): number {
  const items = order.items || []
  const myItems = items.filter((i) => i.tailor_id === tailorId)

  if (myItems.length > 0) {
    return myItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
  }

  const anyAssigned = items.some((i) => i.tailor_id)
  if (!anyAssigned && order.tailor_id === tailorId) {
    return Number(order.subtotal) || 0
  }

  return 0
}

export function tailorPayoutForOrder(order: OrderLike, tailorId: string): number {
  return tailorItemsSubtotal(order, tailorId) * TAILOR_PAYOUT_RATE
}

export function myItems<T extends ItemLike>(
  order: { tailor_id?: string | null; items?: T[] | null },
  tailorId: string
): T[] {
  const items: T[] = order.items || []
  const owned = items.filter((i) => i.tailor_id === tailorId)
  if (owned.length > 0) return owned

  const anyAssigned = items.some((i) => i.tailor_id)
  if (!anyAssigned && order.tailor_id === tailorId) return items
  return []
}
