import { describe, it, expect } from 'vitest'
import { tailorItemsSubtotal, tailorPayoutForOrder, myItems } from '@/lib/tailor-payout'
import { TAILOR_PAYOUT_RATE } from '@/lib/constants'

// Money note: after supabase/add-pending-payment-status.sql, order_items.price
// and orders.subtotal are DECIMAL pounds, which is what these helpers assume.
const TAILOR_A = 'tailor-a'
const TAILOR_B = 'tailor-b'

describe('tailorItemsSubtotal', () => {
  it("sums only this tailor's items, ignoring another tailor's", () => {
    const order = {
      tailor_id: TAILOR_A,
      subtotal: 100,
      items: [
        { tailor_id: TAILOR_A, price: 20, quantity: 1 },
        { tailor_id: TAILOR_A, price: 15, quantity: 2 },
        { tailor_id: TAILOR_B, price: 50, quantity: 1 },
      ],
    }
    expect(tailorItemsSubtotal(order, TAILOR_A)).toBe(50)
    expect(tailorItemsSubtotal(order, TAILOR_B)).toBe(50)
  })

  it('splits an order so the tailor slices sum to the order subtotal', () => {
    const order = {
      tailor_id: TAILOR_A,
      subtotal: 70,
      items: [
        { tailor_id: TAILOR_A, price: 20, quantity: 1 },
        { tailor_id: TAILOR_B, price: 25, quantity: 2 },
      ],
    }
    const combined = tailorItemsSubtotal(order, TAILOR_A) + tailorItemsSubtotal(order, TAILOR_B)
    expect(combined).toBe(order.subtotal)
  })

  it('defaults a missing quantity to 1', () => {
    const order = { items: [{ tailor_id: TAILOR_A, price: 30, quantity: null }] }
    expect(tailorItemsSubtotal(order, TAILOR_A)).toBe(30)
  })

  it('treats a null price as zero rather than NaN', () => {
    const order = { items: [{ tailor_id: TAILOR_A, price: null, quantity: 2 }] }
    expect(tailorItemsSubtotal(order, TAILOR_A)).toBe(0)
  })

  it('falls back to the full subtotal on the legacy single-tailor path', () => {
    const order = {
      tailor_id: TAILOR_A,
      subtotal: 80,
      items: [
        { tailor_id: null, price: 30, quantity: 1 },
        { tailor_id: null, price: 50, quantity: 1 },
      ],
    }
    expect(tailorItemsSubtotal(order, TAILOR_A)).toBe(80)
  })

  it('does not pay the legacy order tailor once any item is assigned', () => {
    const order = {
      tailor_id: TAILOR_A,
      subtotal: 80,
      items: [
        { tailor_id: TAILOR_B, price: 30, quantity: 1 },
        { tailor_id: null, price: 50, quantity: 1 },
      ],
    }
    expect(tailorItemsSubtotal(order, TAILOR_A)).toBe(0)
  })

  it('returns 0 for a tailor with no claim on the order', () => {
    const order = {
      tailor_id: TAILOR_A,
      subtotal: 80,
      items: [{ tailor_id: TAILOR_A, price: 80, quantity: 1 }],
    }
    expect(tailorItemsSubtotal(order, 'tailor-c')).toBe(0)
  })

  // Worth knowing: with no item rows the legacy fallback fires, so the order
  // tailor is credited the whole subtotal. A caller that selects an order
  // without joining order_items looks identical to a legacy unassigned order.
  it('credits the order tailor the full subtotal when no items are present', () => {
    expect(tailorItemsSubtotal({ tailor_id: TAILOR_A, subtotal: 80, items: [] }, TAILOR_A)).toBe(80)
    expect(tailorItemsSubtotal({ tailor_id: TAILOR_A, subtotal: 80, items: null }, TAILOR_A)).toBe(80)
  })

  it('still pays nothing to a non-order tailor when no items are present', () => {
    expect(tailorItemsSubtotal({ tailor_id: TAILOR_A, subtotal: 80, items: [] }, TAILOR_B)).toBe(0)
  })
})

describe('tailorPayoutForOrder', () => {
  it('applies the payout rate to the tailor slice, not the order total', () => {
    const order = {
      tailor_id: TAILOR_A,
      subtotal: 100,
      items: [
        { tailor_id: TAILOR_A, price: 40, quantity: 1 },
        { tailor_id: TAILOR_B, price: 60, quantity: 1 },
      ],
    }
    expect(tailorPayoutForOrder(order, TAILOR_A)).toBeCloseTo(40 * TAILOR_PAYOUT_RATE, 10)
    expect(tailorPayoutForOrder(order, TAILOR_A)).toBeCloseTo(24, 10)
  })

  it('pays nothing to a tailor with no items', () => {
    const order = { items: [{ tailor_id: TAILOR_B, price: 40, quantity: 1 }] }
    expect(tailorPayoutForOrder(order, TAILOR_A)).toBe(0)
  })
})

describe('myItems', () => {
  it('returns only the items belonging to the tailor', () => {
    const a1 = { id: '1', tailor_id: TAILOR_A }
    const b1 = { id: '2', tailor_id: TAILOR_B }
    expect(myItems({ tailor_id: TAILOR_A, items: [a1, b1] }, TAILOR_A)).toEqual([a1])
  })

  it('returns every item on the legacy single-tailor path', () => {
    const items = [{ id: '1', tailor_id: null }, { id: '2', tailor_id: null }]
    expect(myItems({ tailor_id: TAILOR_A, items }, TAILOR_A)).toEqual(items)
  })

  it('returns nothing for a tailor with no items once assignment has happened', () => {
    const items = [{ id: '1', tailor_id: TAILOR_B }]
    expect(myItems({ tailor_id: TAILOR_A, items }, TAILOR_A)).toEqual([])
  })
})
