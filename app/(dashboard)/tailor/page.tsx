export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { TAILOR_PAYOUT_RATE } from '@/lib/constants'
import Link from 'next/link'
import { Scissors, DollarSign, Clock, CheckCircle, Star, Calendar, History } from 'lucide-react'

function calculateTailorPayout(subtotal: number): number {
  return subtotal * TAILOR_PAYOUT_RATE
}

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

  // Get completed orders for earnings calculation and history
  const { data: completedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name),
      items:order_items(
        id,
        service:services(name)
      )
    `)
    .eq('tailor_id', user.id)
    .in('status', ['out_for_delivery', 'delivered', 'completed'])
    .order('updated_at', { ascending: false })

  // Calculate earnings (60% of subtotal only, excludes delivery fee)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

  const ordersWithCompletion = (completedOrders || []).filter(order => order.completed_at)

  const weeklyEarnings = ordersWithCompletion
    .filter(order => new Date(order.completed_at) >= weekAgo)
    .reduce((sum, order) => sum + calculateTailorPayout(order.subtotal), 0)

  const monthlyEarnings = ordersWithCompletion
    .filter(order => new Date(order.completed_at) >= monthAgo)
    .reduce((sum, order) => sum + calculateTailorPayout(order.subtotal), 0)

  // Calculate active items count
  const activeItemsCount = assignedOrders?.reduce((total, order) => {
    const activeItems = order.items?.filter((item: any) =>
      item.status !== 'done'
    ).length || 0
    return total + activeItems
  }, 0) || 0

  const stats = [
    {
      title: 'This Week',
      value: formatPrice(weeklyEarnings),
      description: 'Your earnings',
      icon: Calendar,
      color: 'text-violet-600',
      bg: 'bg-violet-100 dark:bg-violet-900/20',
    },
    {
      title: 'This Month',
      value: formatPrice(monthlyEarnings),
      description: 'Your earnings',
      icon: DollarSign,
      color: 'text-violet-600',
      bg: 'bg-violet-100 dark:bg-violet-900/20',
    },
    {
      title: 'Active Orders',
      value: assignedOrders?.length || 0,
      description: `${activeItemsCount} items`,
      icon: Scissors,
      color: 'text-violet-600',
      bg: 'bg-violet-100 dark:bg-violet-900/20',
    },
    {
      title: 'Rating',
      value: tailorProfile?.rating ? tailorProfile.rating.toFixed(1) : 'N/A',
      description: `${tailorProfile?.completed_jobs || 0} jobs`,
      icon: Star,
      color: 'text-violet-600',
      bg: 'bg-violet-100 dark:bg-violet-900/20',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Tailor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your alterations and track your earnings
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-l-4 border-l-violet-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
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
          <TabsTrigger value="history">
            History ({completedOrders?.length || 0})
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
                          <p className="text-sm text-muted-foreground">Your Payout</p>
                          <p className="text-lg font-bold text-violet-600">{formatPrice(calculateTailorPayout(order.subtotal))}</p>
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
                      <p className="text-sm text-muted-foreground">Your Payout</p>
                      <p className="text-lg font-bold text-violet-600">{formatPrice(calculateTailorPayout(order.subtotal))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {!completedOrders || completedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed orders yet.</p>
              </CardContent>
            </Card>
          ) : (
            completedOrders.map((order) => (
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
                        <p className="text-xs text-muted-foreground mt-2">
                          {order.completed_at ? `Completed ${formatDate(order.completed_at)}` : `Updated ${formatDate(order.updated_at)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Earned</p>
                        <p className="text-lg font-bold text-violet-600">{formatPrice(calculateTailorPayout(order.subtotal))}</p>
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
