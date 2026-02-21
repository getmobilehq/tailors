import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'

export default async function AdminAnalyticsPage() {
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

  // Fetch ALL orders with items and service names
  const { data: allOrders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      subtotal,
      delivery_fee,
      total,
      runner_id,
      tailor_id,
      created_at,
      items:order_items(
        id,
        price,
        quantity,
        service:service_id(name)
      )
    `)
    .order('created_at', { ascending: false })

  // Fetch runners with profiles
  const { data: runners } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      role,
      runner_profile:runner_profiles(rating, total_reviews)
    `)
    .eq('role', 'runner')

  // Fetch tailors with profiles
  const { data: tailors } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      role,
      tailor_profile:tailor_profiles(rating, total_reviews)
    `)
    .eq('role', 'tailor')

  // Customer count
  const { count: customerCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  // Flatten profiles
  const runnersData = runners?.map(r => {
    const rProfile = Array.isArray(r.runner_profile) ? r.runner_profile[0] : r.runner_profile
    return {
      id: r.id,
      full_name: r.full_name,
      role: r.role,
      rating: (rProfile as any)?.rating,
      total_reviews: (rProfile as any)?.total_reviews,
    }
  }) || []

  const tailorsData = tailors?.map(t => {
    const tProfile = Array.isArray(t.tailor_profile) ? t.tailor_profile[0] : t.tailor_profile
    return {
      id: t.id,
      full_name: t.full_name,
      role: t.role,
      rating: (tProfile as any)?.rating,
      total_reviews: (tProfile as any)?.total_reviews,
    }
  }) || []

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
              Analytics
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Business performance, revenue trends, and team metrics
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{allOrders?.length || 0}</span>
          <span className="text-muted-foreground">orders analysed</span>
        </div>
      </div>

      <AnalyticsDashboard
        orders={(allOrders || []) as any}
        runners={runnersData}
        tailors={tailorsData}
        customerCount={customerCount || 0}
      />
    </div>
  )
}
