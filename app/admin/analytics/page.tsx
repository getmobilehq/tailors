'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
}

interface Order {
  id: string
  total: number
  status: string
  created_at: string
}

interface AnalyticsData {
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  ordersGrowth: number
  averageOrderValue: number
  conversionRate: number
  dailyRevenue: { date: string; amount: number }[]
  topServices: { name: string; count: number; revenue: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    dailyRevenue: [],
    topServices: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  async function loadAnalytics() {
    setLoading(true)
    const supabase = createClient()
    const days = parseInt(timeRange)
    const startDate = startOfDay(subDays(new Date(), days))
    const previousStartDate = startOfDay(subDays(new Date(), days * 2))
    const previousEndDate = endOfDay(subDays(new Date(), days + 1))

    try {
      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'succeeded')
        .gte('created_at', startDate.toISOString())

      const { data: previousPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'succeeded')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', startDate.toISOString())

      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())

      // Calculate metrics
      const totalRevenue = (payments || []).reduce((sum, p) => sum + p.amount, 0) / 100
      const previousRevenue = (previousPayments || []).reduce((sum, p) => sum + p.amount, 0) / 100
      const revenueGrowth = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

      const totalOrders = (orders || []).length
      const previousTotalOrders = (previousOrders || []).length
      const ordersGrowth = previousTotalOrders > 0
        ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
        : 0

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate daily revenue
      const dateRange = eachDayOfInterval({
        start: startDate,
        end: new Date(),
      })

      const dailyRevenue = dateRange.map(date => {
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)

        const dayPayments = (payments || []).filter(p => {
          const paymentDate = new Date(p.created_at)
          return paymentDate >= dayStart && paymentDate <= dayEnd
        })

        const amount = dayPayments.reduce((sum, p) => sum + p.amount, 0) / 100

        return {
          date: format(date, 'MMM dd'),
          amount,
        }
      })

      // Calculate top services
      const serviceMap = new Map<string, { count: number; revenue: number }>()

      ;(orders || []).forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const serviceName = item.service_name || 'Unknown'
            const existing = serviceMap.get(serviceName) || { count: 0, revenue: 0 }
            serviceMap.set(serviceName, {
              count: existing.count + 1,
              revenue: existing.revenue + (item.price || 0) / 100,
            })
          })
        }
      })

      const topServices = Array.from(serviceMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setData({
        totalRevenue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        averageOrderValue,
        conversionRate: 0, // Can be calculated if we track visits
        dailyRevenue,
        topServices,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  function formatPercentage(value: number) {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Analytics</h1>
          <p className="text-muted-foreground">Revenue trends and payment insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.totalRevenue)}
                </div>
                <div className="flex items-center mt-1 text-xs">
                  {data.revenueGrowth >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(data.revenueGrowth)}
                  </span>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalOrders}</div>
                <div className="flex items-center mt-1 text-xs">
                  {data.ordersGrowth >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={data.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(data.ordersGrowth)}
                  </span>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Time Period</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeRange} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Analysis period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {data.dailyRevenue.map((day, index) => {
                  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.amount), 1)
                  const height = (day.amount / maxRevenue) * 100

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                        style={{ height: `${height}%`, minHeight: day.amount > 0 ? '4px' : '0' }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(day.amount)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {day.date}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
              <CardDescription>Most popular services by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topServices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No service data available</p>
              ) : (
                <div className="space-y-4">
                  {data.topServices.map((service, index) => {
                    const maxRevenue = Math.max(...data.topServices.map(s => s.revenue))
                    const width = (service.revenue / maxRevenue) * 100

                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{service.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-bold">{formatCurrency(service.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{service.count} orders</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
