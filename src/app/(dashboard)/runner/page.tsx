import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default async function RunnerDashboardPage() {
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

  if (profile?.role !== 'runner') {
    redirect('/orders')
  }

  // Get runner profile
  const { data: runnerProfile } = await supabase
    .from('runner_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get all orders assigned to this runner or available for pickup
  const { data: assignedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name, phone),
      items:order_items(id, garment_description)
    `)
    .eq('runner_id', user.id)
    .in('status', ['pickup_scheduled', 'collected', 'out_for_delivery'])
    .order('pickup_date', { ascending: true })

  // Get available orders (no runner assigned)
  const { data: availableOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name, phone),
      items:order_items(id, garment_description)
    `)
    .is('runner_id', null)
    .eq('status', 'booked')
    .order('pickup_date', { ascending: true })
    .limit(20)

  // Get completed stats
  const { data: completedOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('runner_id', user.id)
    .in('status', ['delivered', 'completed'])

  const stats = [
    {
      title: 'Active Jobs',
      value: assignedOrders?.length || 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: runnerProfile?.completed_jobs || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Rating',
      value: runnerProfile?.rating ? runnerProfile.rating.toFixed(1) : 'N/A',
      icon: TrendingUp,
      color: 'text-yellow-600',
    },
    {
      title: 'Available',
      value: availableOrders?.length || 0,
      icon: Clock,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Runner Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your pickups and deliveries
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
            My Jobs ({assignedOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availableOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          {!assignedOrders || assignedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active jobs. Check available orders to accept new pickups.</p>
              </CardContent>
            </Card>
          ) : (
            assignedOrders.map((order) => (
              <Link key={order.id} href={`/runner/orders/${order.id}`}>
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
                        <p className="text-sm text-muted-foreground mb-1">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        {order.pickup_date && (
                          <p className="text-sm font-medium">
                            {order.status === 'pickup_scheduled' ? 'Pickup: ' : 'Delivery: '}
                            {formatDate(order.pickup_date)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {order.customer_address.postcode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
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
              <Link key={order.id} href={`/runner/orders/${order.id}`}>
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
                        <p className="text-sm text-muted-foreground mb-1">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        {order.pickup_date && (
                          <p className="text-sm font-medium">
                            Pickup: {formatDate(order.pickup_date)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {order.customer_address.postcode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{formatPrice(order.total)}</p>
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
