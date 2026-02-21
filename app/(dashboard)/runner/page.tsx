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
import { StatusBadge } from '@/components/orders/status-badge'
import { TaskList } from '@/components/runner/task-list'
import { formatPrice, formatDate } from '@/lib/utils'
import { RUNNER_FEE_PER_JOB } from '@/lib/constants'
import Link from 'next/link'
import { Package, Clock, CheckCircle, Star, DollarSign, History } from 'lucide-react'

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

  // Get all orders assigned to this runner
  const { data: assignedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customer_id(full_name, phone),
      items:order_items(id, garment_description)
    `)
    .eq('runner_id', user.id)
    .in('status', ['pickup_scheduled', 'collected', 'out_for_delivery', 'delivered'])
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

  // Get completed orders for history
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
    .eq('runner_id', user.id)
    .in('status', ['completed'])
    .order('completed_at', { ascending: false })

  // Calculate earnings
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

  const weeklyEarnings = (completedOrders || [])
    .filter(order => order.completed_at && new Date(order.completed_at) >= weekAgo)
    .length * RUNNER_FEE_PER_JOB

  const monthlyEarnings = (completedOrders || [])
    .filter(order => order.completed_at && new Date(order.completed_at) >= monthAgo)
    .length * RUNNER_FEE_PER_JOB

  // Calculate priority based on time until pickup/delivery
  function calculatePriority(pickupDate: string, orderStatus: string): 'urgent' | 'high' | 'normal' {
    const now = new Date()
    const pickup = new Date(pickupDate)
    const hoursUntil = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntil < 2 || hoursUntil < 0) return 'urgent'
    if (hoursUntil < 24) return 'high'
    return 'normal'
  }

  // Transform orders to tasks
  const allTasks = [
    ...(assignedOrders || []).map(order => ({
      id: order.id,
      order_number: order.order_number,
      type: (order.status === 'pickup_scheduled' ? 'pickup' : 'delivery') as 'pickup' | 'delivery',
      customer_name: order.customer?.full_name || 'Unknown',
      address: `${order.customer_address.line1}${order.customer_address.line2 ? ', ' + order.customer_address.line2 : ''}`,
      postcode: order.customer_address.postcode,
      item_count: order.items?.length || 0,
      time_window: order.pickup_slot || 'Not scheduled',
      pickup_date: order.pickup_date,
      priority: calculatePriority(order.pickup_date, order.status),
      status: (order.status === 'delivered' ? 'completed' : 'in_progress') as 'pending' | 'in_progress' | 'completed',
      order_status: order.status,
    })),
    ...(availableOrders || []).map(order => ({
      id: order.id,
      order_number: order.order_number,
      type: 'pickup' as 'pickup' | 'delivery',
      customer_name: order.customer?.full_name || 'Unknown',
      address: `${order.customer_address.line1}${order.customer_address.line2 ? ', ' + order.customer_address.line2 : ''}`,
      postcode: order.customer_address.postcode,
      item_count: order.items?.length || 0,
      time_window: order.pickup_slot || 'Not scheduled',
      pickup_date: order.pickup_date,
      priority: calculatePriority(order.pickup_date, order.status),
      status: 'pending' as 'pending' | 'in_progress' | 'completed',
      order_status: order.status,
    })),
  ]

  const stats = [
    {
      title: 'Active Jobs',
      value: assignedOrders?.filter(o => !['delivered', 'completed'].includes(o.status)).length || 0,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'This Week',
      value: formatPrice(weeklyEarnings),
      description: 'Your earnings',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Completed',
      value: runnerProfile?.completed_jobs || 0,
      icon: CheckCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100 dark:bg-gray-900/20',
    },
    {
      title: 'Rating',
      value: runnerProfile?.rating ? runnerProfile.rating.toFixed(1) : 'N/A',
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
  ]

  const totalEarnings = (completedOrders?.length || 0) * RUNNER_FEE_PER_JOB

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Runner Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your pickups and deliveries
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.description && (
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    )}
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

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">
            Tasks ({allTasks.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({completedOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TaskList tasks={allTasks} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {!completedOrders || completedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed jobs yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Earnings Summary */}
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Jobs</p>
                      <p className="text-2xl font-bold">{completedOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatPrice(totalEarnings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Per Job</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(RUNNER_FEE_PER_JOB)}
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
                          <TableHead>Completed</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Earned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedOrders.map((order) => (
                          <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <Link href={`/runner/orders/${order.id}`} className="font-medium text-primary hover:underline">
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
                            <TableCell className="text-right font-semibold text-emerald-600">
                              {formatPrice(RUNNER_FEE_PER_JOB)}
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
