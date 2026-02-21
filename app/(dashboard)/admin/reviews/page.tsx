import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ReviewsTable } from '@/components/admin/reviews-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
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

  // Use admin client to bypass RLS (see all reviews including hidden)
  const adminClient = createAdminClient()

  const { data: reviews } = await adminClient
    .from('reviews')
    .select(`
      *,
      customer:customer_id(full_name, email),
      order:order_id(id, order_number),
      runner:runner_id(full_name),
      tailor:tailor_id(full_name)
    `)
    .order('created_at', { ascending: false })

  const allReviews = reviews || []

  // Compute stats
  const totalCount = allReviews.length
  const avgRating = totalCount > 0
    ? allReviews.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / totalCount
    : 0
  const visibleCount = allReviews.filter((r: any) => r.is_visible !== false).length
  const hiddenCount = allReviews.filter((r: any) => r.is_visible === false).length

  const stats = {
    totalCount,
    avgRating,
    visibleCount,
    hiddenCount,
  }

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
              Reviews
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            View, moderate, and manage customer reviews
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Star className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{totalCount}</span>
          <span className="text-muted-foreground">total</span>
        </div>
      </div>

      <ReviewsTable reviews={allReviews} stats={stats} />
    </div>
  )
}
