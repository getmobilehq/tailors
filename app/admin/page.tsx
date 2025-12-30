'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Users, Package, DollarSign, TrendingUp, CheckCircle, Clock, Bike, Scissors } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  activeRunners: number
  activeTailors: number
  pendingApplications: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeRunners: 0,
    activeTailors: 0,
    pendingApplications: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    const supabase = createClient()

    try {
      // Load all stats in parallel
      const [
        usersResult,
        ordersResult,
        paymentsResult,
        applicationsResult,
      ] = await Promise.all([
        supabase.from('users').select('id, role, active'),
        supabase.from('orders').select('id, status, total'),
        supabase.from('payments').select('amount, status').eq('status', 'succeeded'),
        supabase.from('applications').select('id, status').eq('status', 'pending'),
      ])

      const users = usersResult.data || []
      const orders = ordersResult.data || []
      const payments = paymentsResult.data || []
      const applications = applicationsResult.data || []

      // Calculate stats
      const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      const pendingOrders = orders.filter(o =>
        ['booked', 'pickup_scheduled', 'collected', 'in_progress'].includes(o.status)
      ).length
      const completedOrders = orders.filter(o => o.status === 'completed').length

      setStats({
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue / 100, // Convert from pence to pounds
        pendingOrders,
        completedOrders,
        activeRunners: users.filter(u => u.role === 'runner' && u.active).length,
        activeTailors: users.filter(u => u.role === 'tailor' && u.active).length,
        pendingApplications: applications.length,
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard...</p>
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
                <div className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.completedOrders} completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customers, runners & tailors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApplications}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Provider Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5" />
                  Runners
                </CardTitle>
                <CardDescription>Active runners on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.activeRunners}</div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/users?role=runner">View All Runners</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Tailors
                </CardTitle>
                <CardDescription>Active tailors on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.activeTailors}</div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/users?role=tailor">View All Tailors</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Applications
                </CardTitle>
                <CardDescription>Pending applications to review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.pendingApplications}</div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/applications">Review Applications</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild variant="default" className="w-full">
                  <Link href="/admin/orders">View All Orders</Link>
                </Button>
                <Button asChild variant="default" className="w-full">
                  <Link href="/admin/users">Manage Users</Link>
                </Button>
                <Button asChild variant="default" className="w-full">
                  <Link href="/admin/applications">Review Applications</Link>
                </Button>
                <Button asChild variant="default" className="w-full">
                  <Link href="/admin/services">Manage Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
