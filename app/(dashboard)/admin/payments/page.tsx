import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentsTable } from '@/components/admin/payments-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, DollarSign } from 'lucide-react'

export default async function AdminPaymentsPage() {
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

  // Fetch all payments with order and customer data
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      order:order_id(
        id,
        order_number,
        total,
        subtotal,
        delivery_fee,
        status,
        customer:customer_id(full_name, email)
      )
    `)
    .order('created_at', { ascending: false })

  const allPayments = payments || []

  // Compute summary stats
  const stats = {
    totalCount: allPayments.length,
    totalRevenue: allPayments
      .filter((p: any) => p.status === 'succeeded')
      .reduce((sum: number, p: any) => sum + p.amount, 0),
    refundCount: allPayments.filter((p: any) => p.status === 'refunded').length,
    pendingCount: allPayments.filter((p: any) => p.status === 'pending').length,
    failedCount: allPayments.filter((p: any) => p.status === 'failed').length,
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
              Payments
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            View, search, and manage all payments and refunds
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{allPayments.length}</span>
          <span className="text-muted-foreground">total</span>
        </div>
      </div>

      <PaymentsTable payments={allPayments} stats={stats} />
    </div>
  )
}
