// Pure selection logic for multi-tailor assignment, kept free of any Supabase
// import so it can be unit-tested without a database or env vars.
// lib/tailor-assignment.ts holds the IO and calls into these.

export type TailorCandidate = {
  user_id: string
  specializations?: string[] | null
  max_concurrent_orders: number
}

// Eligible tailors for a category, least-loaded first. Excludes tailors who do
// not list the category and those already at max_concurrent_orders. Ties keep
// the input order (Array.prototype.sort is stable).
export function eligibleTailorsForCategory<T extends TailorCandidate>(
  category: string,
  tailors: T[],
  loadByTailor: Map<string, number>
): T[] {
  return tailors
    .filter((t) => t.specializations?.includes(category))
    .filter((t) => (loadByTailor.get(t.user_id) || 0) < t.max_concurrent_orders)
    .sort((a, b) => (loadByTailor.get(a.user_id) || 0) - (loadByTailor.get(b.user_id) || 0))
}

// The single tailor to route an item to, or null when none is eligible.
export function pickTailorForCategory<T extends TailorCandidate>(
  category: string,
  tailors: T[],
  loadByTailor: Map<string, number>
): T | null {
  return eligibleTailorsForCategory(category, tailors, loadByTailor)[0] ?? null
}

// The tailor holding the most items, mirrored onto orders.tailor_id so legacy
// paths (reviews, messaging, admin views) keep working. Ties go to the first
// tailor to reach the winning count.
export function choosePrimaryTailor(assigned: { tailorId: string }[]): string | null {
  const counts = new Map<string, number>()
  for (const a of assigned) counts.set(a.tailorId, (counts.get(a.tailorId) || 0) + 1)

  let primaryTailorId: string | null = null
  let maxCount = 0
  for (const [id, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      primaryTailorId = id
    }
  }
  return primaryTailorId
}
