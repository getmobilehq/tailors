'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TeamPerformance } from '@/components/admin/team-performance'
import { formatPrice } from '@/lib/utils'
import { TAILOR_PAYOUT_RATE, RUNNER_FEE_PER_JOB } from '@/lib/constants'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Scissors,
  Truck,
} from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  subtotal: number
  delivery_fee: number
  total: number
  runner_id: string | null
  tailor_id: string | null
  created_at: string
  items?: Array<{ id: string; price: number; quantity: number; service: any }>
}

interface TeamMember {
  id: string
  full_name: string
  role: string
  rating?: number
  total_reviews?: number
}

interface AnalyticsDashboardProps {
  orders: Order[]
  runners: TeamMember[]
  tailors: TeamMember[]
  customerCount: number
}

const STATUS_COLORS: Record<string, string> = {
  booked: '#3b82f6',
  pickup_scheduled: '#8b5cf6',
  collected: '#06b6d4',
  in_progress: '#f59e0b',
  ready: '#10b981',
  out_for_delivery: '#6366f1',
  delivered: '#22c55e',
  completed: '#059669',
  cancelled: '#ef4444',
}

type Timeframe = '7d' | '30d' | '90d' | 'all'

export function AnalyticsDashboard({ orders, runners, tailors, customerCount }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d')

  // Core stats
  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status))
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

    // Revenue breakdown
    const totalSubtotal = completedOrders.reduce((sum, o) => sum + o.subtotal, 0)
    const tailorPayouts = totalSubtotal * TAILOR_PAYOUT_RATE
    const runnerPayouts = completedOrders.filter(o => o.runner_id).length * RUNNER_FEE_PER_JOB
    const platformEarnings = totalRevenue - tailorPayouts - runnerPayouts

    return {
      totalRevenue,
      totalOrders: orders.length,
      completedCount: completedOrders.length,
      cancelledCount: orders.filter(o => o.status === 'cancelled').length,
      avgOrderValue,
      tailorPayouts,
      runnerPayouts,
      platformEarnings,
    }
  }, [orders])

  // Revenue trend based on timeframe
  const revenueTrend = useMemo(() => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : null

    if (days === null) {
      // "all" — group by month
      const monthMap: Record<string, { revenue: number; orders: number }> = {}

      orders.forEach(o => {
        if (!['completed', 'delivered'].includes(o.status)) return
        const date = new Date(o.created_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 }
        monthMap[key].revenue += o.total
        monthMap[key].orders += 1
      })

      return Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          const [year, month] = key.split('-')
          const date = new Date(Number(year), Number(month) - 1)
          return {
            date: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
            revenue: data.revenue,
            orders: data.orders,
          }
        })
    }

    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      return date.toISOString().split('T')[0]
    })

    return dateRange.map(date => {
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at).toISOString().split('T')[0]
        return orderDate === date && ['completed', 'delivered'].includes(o.status)
      })
      return {
        date: new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      }
    })
  }, [orders, timeframe])

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }))
  }, [orders])

  // Top services
  const topServices = useMemo(() => {
    const serviceStats = orders.reduce((acc, order) => {
      order.items?.forEach(item => {
        const svc = Array.isArray(item.service) ? item.service[0] : item.service
        const serviceName = svc?.name
        if (!serviceName) return
        if (!acc[serviceName]) acc[serviceName] = { count: 0, revenue: 0 }
        acc[serviceName].count += 1
        if (['completed', 'delivered'].includes(order.status)) {
          acc[serviceName].revenue += order.total / (order.items?.length || 1)
        }
      })
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return Object.entries(serviceStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
  }, [orders])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatPrice(stats.avgOrderValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customers</p>
                <p className="text-2xl font-bold">{customerCount}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats.platformEarnings)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tailor Payouts</p>
                <p className="text-2xl font-bold">{formatPrice(stats.tailorPayouts)}</p>
                <p className="text-xs text-muted-foreground mt-1">60% of subtotals</p>
              </div>
              <Scissors className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Runner Payouts</p>
                <p className="text-2xl font-bold">{formatPrice(stats.runnerPayouts)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatPrice(RUNNER_FEE_PER_JOB)} per job</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {revenueTrend.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No revenue data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                  labelStyle={{ color: 'black' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution + Top Services */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No order data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No service data
              </div>
            ) : (
              <div className="space-y-4">
                {topServices.slice(0, 5).map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.count} orders</p>
                      </div>
                    </div>
                    <p className="font-bold">{formatPrice(service.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <TeamPerformance
        runners={runners}
        tailors={tailors}
        orders={orders as any}
      />
    </div>
  )
}
