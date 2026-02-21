import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ApplicationsTable } from '@/components/admin/applications-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage() {
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

  // Fetch all applications using admin client (bypasses RLS since we already verified admin)
  const adminClient = createAdminClient()
  const { data: applications, error } = await adminClient
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
  }

  const allApplications = applications || []
  const pendingCount = allApplications.filter(a => a.status === 'pending').length

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
              Applications
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Review and manage runner and tailor applications
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{allApplications.length}</span>
            <span className="text-muted-foreground">total</span>
          </div>
          {pendingCount > 0 && (
            <div className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
              {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      <ApplicationsTable applications={allApplications} />
    </div>
  )
}
