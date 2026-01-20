import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/users-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/orders')
  }

  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              User Management
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{users?.length || 0}</span>
          <span className="text-muted-foreground">total</span>
        </div>
      </div>

      <UsersTable users={users || []} />
    </div>
  )
}
