import { describe, it, expect } from 'vitest'
import {
  eligibleTailorsForCategory,
  pickTailorForCategory,
  choosePrimaryTailor,
  type TailorCandidate,
} from '@/lib/tailor-assignment-core'

const tailor = (
  user_id: string,
  specializations: string[] | null,
  max_concurrent_orders = 5
): TailorCandidate => ({ user_id, specializations, max_concurrent_orders })

const load = (entries: Record<string, number>) => new Map(Object.entries(entries))

describe('pickTailorForCategory', () => {
  it('picks the lowest-loaded eligible tailor', () => {
    const tailors = [
      tailor('busy', ['hemming']),
      tailor('idle', ['hemming']),
      tailor('mid', ['hemming']),
    ]
    const picked = pickTailorForCategory('hemming', tailors, load({ busy: 4, idle: 0, mid: 2 }))
    expect(picked?.user_id).toBe('idle')
  })

  it('treats a tailor missing from the load map as having zero load', () => {
    const tailors = [tailor('known', ['hemming']), tailor('unseen', ['hemming'])]
    const picked = pickTailorForCategory('hemming', tailors, load({ known: 3 }))
    expect(picked?.user_id).toBe('unseen')
  })

  it('skips tailors who do not list the category', () => {
    const tailors = [tailor('zips', ['zip_replacement']), tailor('hems', ['hemming'], 5)]
    const picked = pickTailorForCategory('hemming', tailors, load({ zips: 0, hems: 4 }))
    expect(picked?.user_id).toBe('hems')
  })

  it('skips tailors already at max_concurrent_orders', () => {
    const tailors = [tailor('full', ['hemming'], 2), tailor('spare', ['hemming'], 5)]
    const picked = pickTailorForCategory('hemming', tailors, load({ full: 2, spare: 3 }))
    expect(picked?.user_id).toBe('spare')
  })

  it('returns null when every eligible tailor is at capacity', () => {
    const tailors = [tailor('a', ['hemming'], 1), tailor('b', ['hemming'], 1)]
    expect(pickTailorForCategory('hemming', tailors, load({ a: 1, b: 1 }))).toBeNull()
  })

  it('returns null when no tailor lists the category', () => {
    const tailors = [tailor('a', ['zip_replacement']), tailor('b', ['resizing'])]
    expect(pickTailorForCategory('hemming', tailors, load({}))).toBeNull()
  })

  it('returns null when a tailor has null specializations', () => {
    expect(pickTailorForCategory('hemming', [tailor('a', null)], load({}))).toBeNull()
  })

  it('returns null when there are no tailors', () => {
    expect(pickTailorForCategory('hemming', [], load({}))).toBeNull()
  })

  it('breaks ties by input order', () => {
    const tailors = [tailor('first', ['hemming']), tailor('second', ['hemming'])]
    const picked = pickTailorForCategory('hemming', tailors, load({ first: 1, second: 1 }))
    expect(picked?.user_id).toBe('first')
  })

  it('does not mutate the caller\'s tailor list', () => {
    const tailors = [tailor('b', ['hemming']), tailor('a', ['hemming'])]
    pickTailorForCategory('hemming', tailors, load({ b: 5, a: 0 }))
    expect(tailors.map((t) => t.user_id)).toEqual(['b', 'a'])
  })
})

describe('eligibleTailorsForCategory', () => {
  it('orders every eligible tailor least-loaded first', () => {
    const tailors = [tailor('c', ['hemming']), tailor('a', ['hemming']), tailor('b', ['hemming'])]
    const eligible = eligibleTailorsForCategory('hemming', tailors, load({ a: 1, b: 2, c: 0 }))
    expect(eligible.map((t) => t.user_id)).toEqual(['c', 'a', 'b'])
  })
})

describe('multi-tailor spread', () => {
  // Mirrors the loop in assignItemsToTailors: each pick increments the running
  // load, which is what pushes later items onto a second tailor.
  it('spreads items across tailors as load accumulates', () => {
    const tailors = [tailor('a', ['hemming']), tailor('b', ['hemming'])]
    const running = load({ a: 0, b: 0 })
    const picks: string[] = []

    for (let i = 0; i < 4; i++) {
      const pick = pickTailorForCategory('hemming', tailors, running)!
      picks.push(pick.user_id)
      running.set(pick.user_id, (running.get(pick.user_id) || 0) + 1)
    }

    expect(picks).toEqual(['a', 'b', 'a', 'b'])
  })

  it('routes items to different tailors by category', () => {
    const tailors = [tailor('hemmer', ['hemming']), tailor('zipper', ['zip_replacement'])]
    const running = load({ hemmer: 0, zipper: 0 })
    expect(pickTailorForCategory('hemming', tailors, running)?.user_id).toBe('hemmer')
    expect(pickTailorForCategory('zip_replacement', tailors, running)?.user_id).toBe('zipper')
  })
})

describe('choosePrimaryTailor', () => {
  it('picks the tailor holding the most items', () => {
    const assigned = [
      { tailorId: 'a' },
      { tailorId: 'b' },
      { tailorId: 'b' },
      { tailorId: 'c' },
    ]
    expect(choosePrimaryTailor(assigned)).toBe('b')
  })

  it('gives a tie to the first tailor to reach the winning count', () => {
    expect(choosePrimaryTailor([{ tailorId: 'a' }, { tailorId: 'b' }])).toBe('a')
  })

  it('returns the only tailor when a single one holds everything', () => {
    expect(choosePrimaryTailor([{ tailorId: 'a' }, { tailorId: 'a' }])).toBe('a')
  })

  it('returns null when nothing was assigned', () => {
    expect(choosePrimaryTailor([])).toBeNull()
  })
})
