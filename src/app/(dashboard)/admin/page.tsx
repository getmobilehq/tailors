import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Package, DollarSign, Users, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
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

  // Get all orders
  const { data: allOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name),
      runner:runner_id(full_name),
      tailor:tailor_id(full_name),
      items:order_items(id)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get active orders
  const activeOrders = allOrders?.filter(o => 
    !['completed', 'cancelled'].includes(o.status)
  )

  // Get stats
  const { data: completedOrders } = await supabase
    .from('orders')
    .select('total')
    .in('status', ['completed', 'delivered'])

  const totalRevenue = completedOrders?.reduce((sum, o) => sum + o.total, 0) || 0

  const { count: customerCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  const { count: runnerCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'runner')

  const stats = [
    {
      title: 'Active Orders',
      value: activeOrders?.length || 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Customers',
      value: customerCount || 0,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Runners',
      value: runnerCount || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage orders, users, and business operations
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Orders ({allOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {!activeOrders || activeOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active orders</p>
              </CardContent>
            </Card>
          ) : (
            activeOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {order.order_number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {order.customer?.full_name}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Items</p>
                        <p className="font-medium">{order.items?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Runner</p>
                        <p className="font-medium">{order.runner?.full_name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Pickup</p>
                        <p className="font-medium">
                          {order.pickup_date ? formatDate(order.pickup_date) : 'TBD'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground mb-1">Total</p>
                        <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {!allOrders || allOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            allOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {order.order_number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {order.customer?.full_name} • {formatDate(order.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Items</p>
                        <p className="font-medium">{order.items?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Runner</p>
                        <p className="font-medium">{order.runner?.full_name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Tailor</p>
                        <p className="font-medium">{order.tailor?.full_name || 'Unassigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground mb-1">Total</p>
                        <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
