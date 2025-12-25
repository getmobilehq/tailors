'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatPrice } from '@/lib/utils'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  items?: Array<{ service: { name: string } }>
  runner_id?: string
  tailor_id?: string
}

interface AnalyticsChartsProps {
  orders: Order[]
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

export function AnalyticsCharts({ orders }: AnalyticsChartsProps) {
  // Revenue trend (last 30 days)
  const revenueTrend = getRevenueTrend(orders)

  // Status breakdown
  const statusBreakdown = getStatusBreakdown(orders)

  // Top services
  const topServices = getTopServices(orders)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Revenue Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}

function getRevenueTrend(orders: Order[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split('T')[0]
  })

  return last30Days.map(date => {
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0]
      return orderDate === date && ['completed', 'delivered'].includes(o.status)
    })

    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0)

    return {
      date: new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      revenue
    }
  })
}

function getStatusBreakdown(orders: Order[]) {
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count
  }))
}

function getTopServices(orders: Order[]) {
  const serviceStats = orders.reduce((acc, order) => {
    order.items?.forEach(item => {
      const serviceName = item.service.name
      if (!acc[serviceName]) {
        acc[serviceName] = { count: 0, revenue: 0 }
      }
      acc[serviceName].count += 1
      if (['completed', 'delivered'].includes(order.status)) {
        // Approximate revenue per item (total / item count)
        acc[serviceName].revenue += order.total / (order.items?.length || 1)
      }
    })
    return acc
  }, {} as Record<string, { count: number; revenue: number }>)

  return Object.entries(serviceStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count)
}
