import type { SupabaseClient, User } from '@supabase/supabase-js'

const PAGE_SIZE = 1000
const MAX_PAGES = 50

/**
 * Look up an auth user by email address.
 *
 * `admin.listUsers()` returns only the first page - 50 users by default - so
 * scanning its result silently fails to find anyone outside that page. Resolve
 * the id through `public.users` instead, which has a unique index on email and
 * is kept in sync with `auth.users` by the `handle_new_user` trigger, then fetch
 * the auth record directly by id.
 *
 * The paged scan below is a fallback for the rare auth user with no profile row
 * (e.g. created before the trigger existed). It is also case-insensitive, which
 * covers any legacy profile rows that were not stored lowercased.
 */
export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = email.trim().toLowerCase()

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()

  if (profile?.id) {
    const { data, error } = await supabase.auth.admin.getUserById(profile.id)
    if (!error && data?.user) return data.user
  }

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    })

    if (error) throw error

    const match = data.users.find((u) => u.email?.toLowerCase() === normalized)
    if (match) return match

    if (data.users.length < PAGE_SIZE) break
  }

  return null
}
