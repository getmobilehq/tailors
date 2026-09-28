import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/types'

type StaffContext = {
  userId: string
  role: UserRole
  admin: ReturnType<typeof createAdminClient>
}

/**
 * Check the caller holds one of the given roles, and hand back an admin client
 * for the write. Counter staff act on orders that aren't theirs by RLS, so the
 * role check has to happen here rather than relying on row policies.
 */
export async function requireStaff(
  roles: UserRole[]
): Promise<{ ok: true; ctx: StaffContext } | { ok: false; response: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !roles.includes(profile.role as UserRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not allowed' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    ctx: { userId: user.id, role: profile.role as UserRole, admin: createAdminClient() },
  }
}
