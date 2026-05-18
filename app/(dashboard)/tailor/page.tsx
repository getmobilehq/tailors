export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/orders/status-badge'
import { TailorOrderList } from '@/components/tailor/tailor-order-list'
import { formatPrice, formatDate } from '@/lib/utils'
import { tailorPayoutForOrder, tailorItemsSubtotal, myItems } from '@/lib/tailor-payout'
import Link from 'next/link'
import { Scissors, DollarSign, Star, Calendar, History, Settings } from 'lucide-react'

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

  // Find every order where this tailor either owns at least one item OR is the
  // legacy primary tailor on the order.
  const { data: itemOwnedOrderRows } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('tailor_id', user.id)
  const itemOwnedOrderIds = Array.from(new Set((itemOwnedOrderRows || []).map((r) => r.order_id)))

  const orFilter =
    itemOwnedOrderIds.length > 0
      ? `tailor_id.eq.${user.id},id.in.(${itemOwnedOrderIds.join(',')})`
      : `tailor_id.eq.${user.id}`

  const { data: assignedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name, phone),
      items:order_items(
        id,
        tailor_id,
        price,
        quantity,
        garment_description,
        status,
        service:services(name)
      )
    `)
    .or(orFilter)
    .in('status', ['collected', 'in_progress', 'ready'])
    .order('created_at', { ascending: false })

  const { data: completedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name),
      items:order_items(
        id,
        tailor_id,
        price,
        quantity,
        service:services(name)
      )
    `)
    .or(orFilter)
    .in('status', ['out_for_delivery', 'delivered', 'completed'])
    .order('updated_at', { ascending: false })

  // Calculate earnings (60% of subtotal only, excludes delivery fee)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

  const ordersWithCompletion = (completedOrders || []).filter(order => order.completed_at)

  const weeklyEarnings = ordersWithCompletion
    .filter(order => new Date(order.completed_at) >= weekAgo)
    .reduce((sum, order) => sum + tailorPayoutForOrder(order, user.id), 0)

  const monthlyEarnings = ordersWithCompletion
    .filter(order => new Date(order.completed_at) >= monthAgo)
    .reduce((sum, order) => sum + tailorPayoutForOrder(order, user.id), 0)

  const activeItemsCount = assignedOrders?.reduce((total, order) => {
    const mine = myItems(order, user.id)
    return total + mine.filter((i) => i.status !== 'done').length
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Tailor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your alterations and track your earnings
          </p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href="/tailor/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
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
          <TabsTrigger value="history">
            History ({completedOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned">
          <TailorOrderList orders={assignedOrders || []} tailorId={user.id} />
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
            <>
              {/* Earnings Summary */}
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{completedOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold text-violet-600">
                        {formatPrice(completedOrders.reduce((sum, o) => sum + tailorPayoutForOrder(o, user.id), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg per Order</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(completedOrders.reduce((sum, o) => sum + tailorPayoutForOrder(o, user.id), 0) / completedOrders.length)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Earnings History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Services</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Your Earnings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedOrders.map((order) => (
                          <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <Link href={`/tailor/orders/${order.id}`} className="font-medium text-primary hover:underline">
                                {order.order_number}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {order.customer?.full_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {order.items?.map((item: any) => item.service?.name).join(', ')}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {order.completed_at ? formatDate(order.completed_at) : formatDate(order.updated_at)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatPrice(tailorItemsSubtotal(order, user.id))}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-violet-600">
                              {formatPrice(tailorPayoutForOrder(order, user.id))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
