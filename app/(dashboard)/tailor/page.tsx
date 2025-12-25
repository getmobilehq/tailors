import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Scissors, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default async function TailorDashboardPage() {
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

  if (profile?.role !== 'tailor') {
    redirect('/orders')
  }

  // Get tailor profile
  const { data: tailorProfile } = await supabase
    .from('tailor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get all orders assigned to this tailor
  const { data: assignedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name, phone),
      items:order_items(
        id,
        garment_description,
        status,
        service:services(name)
      )
    `)
    .eq('tailor_id', user.id)
    .in('status', ['collected', 'in_progress', 'ready'])
    .order('created_at', { ascending: false })

  // Get available orders (collected but no tailor assigned yet)
  const { data: availableOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name),
      items:order_items(
        id,
        garment_description,
        service:services(name)
      )
    `)
    .is('tailor_id', null)
    .eq('status', 'collected')
    .order('collected_at', { ascending: true })
    .limit(20)

  // Calculate active items count
  const activeItemsCount = assignedOrders?.reduce((total, order) => {
    const activeItems = order.items?.filter((item: any) =>
      item.status !== 'done'
    ).length || 0
    return total + activeItems
  }, 0) || 0

  const stats = [
    {
      title: 'Active Orders',
      value: assignedOrders?.length || 0,
      icon: Scissors,
      color: 'text-blue-600',
    },
    {
      title: 'Active Items',
      value: activeItemsCount,
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Completed Jobs',
      value: tailorProfile?.completed_jobs || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Rating',
      value: tailorProfile?.rating ? tailorProfile.rating.toFixed(1) : 'N/A',
      icon: TrendingUp,
      color: 'text-yellow-600',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Tailor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your alterations and repairs
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
      <Tabs defaultValue="assigned" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assigned">
            My Orders ({assignedOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availableOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          {!assignedOrders || assignedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active orders. Check available orders to start working.</p>
              </CardContent>
            </Card>
          ) : (
            assignedOrders.map((order) => {
              const pendingItems = order.items?.filter((item: any) => item.status === 'pending').length || 0
              const inProgressItems = order.items?.filter((item: any) => item.status === 'in_progress').length || 0
              const doneItems = order.items?.filter((item: any) => item.status === 'done').length || 0
              const totalItems = order.items?.length || 0

              return (
                <Link key={order.id} href={`/tailor/orders/${order.id}`}>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                          </p>
                          <div className="flex gap-4 text-xs">
                            {pendingItems > 0 && (
                              <span className="text-gray-600">
                                {pendingItems} pending
                              </span>
                            )}
                            {inProgressItems > 0 && (
                              <span className="text-orange-600">
                                {inProgressItems} in progress
                              </span>
                            )}
                            {doneItems > 0 && (
                              <span className="text-green-600">
                                {doneItems} done
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {!availableOrders || availableOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available orders at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            availableOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {order.items?.map((item: any, i: number) => (
                          <span key={item.id}>
                            {item.service?.name}
                            {i < order.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
