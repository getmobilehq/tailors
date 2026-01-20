import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrdersTable } from '@/components/admin/orders-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

export default async function AdminOrdersPage() {
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

  // Fetch all orders with related data
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name),
      runner:runner_id(full_name),
      tailor:tailor_id(full_name),
      items:order_items(
        id,
        service:service_id(name)
      )
    `)
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
              All Orders
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            View, search, and manage all orders in the system
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{orders?.length || 0}</span>
          <span className="text-muted-foreground">total</span>
        </div>
      </div>

      <OrdersTable orders={orders || []} />
    </div>
  )
}
