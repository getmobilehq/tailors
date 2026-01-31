import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { TaskList } from '@/components/runner/task-list'
import { Package, Clock, CheckCircle, Star } from 'lucide-react'

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
      title: 'Available',
      value: availableOrders?.length || 0,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
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

      {/* Task List with Filters */}
      <TaskList tasks={allTasks} />
    </div>
  )
}
