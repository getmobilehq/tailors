'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import Link from 'next/link'

interface Payment {
  id: string
  order_id: string
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  amount: number
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  metadata: any
  created_at: string
  updated_at: string
  order: {
    id: string
    user_id: string
    users: {
      full_name: string
      email: string
    }
  }
}

interface PaymentStats {
  totalRevenue: number
  successfulPayments: number
  failedPayments: number
  refundedAmount: number
  pendingPayments: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedAmount: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [searchQuery, statusFilter, payments])

  async function loadPayments() {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders!inner(
            id,
            user_id,
            users!inner(
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPayments(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(paymentData: Payment[]) {
    const stats = paymentData.reduce(
      (acc, payment) => {
        if (payment.status === 'succeeded') {
          acc.totalRevenue += payment.amount
          acc.successfulPayments++
        } else if (payment.status === 'failed') {
          acc.failedPayments++
        } else if (payment.status === 'refunded') {
          acc.refundedAmount += payment.amount
        } else if (payment.status === 'pending') {
          acc.pendingPayments++
        }
        return acc
      },
      {
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedAmount: 0,
        pendingPayments: 0,
      }
    )

    setStats(stats)
  }

  function filterPayments() {
    let filtered = payments

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => {
        const customerName = p.order?.users?.full_name?.toLowerCase() || ''
        const customerEmail = p.order?.users?.email?.toLowerCase() || ''
        const orderId = p.order_id.toLowerCase()
        const paymentId = p.id.toLowerCase()

        return (
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          orderId.includes(query) ||
          paymentId.includes(query)
        )
      })
    }

    setFilteredPayments(filtered)
  }

  function getStatusBadge(status: Payment['status']) {
    const variants: Record<Payment['status'], { label: string; className: string }> = {
      succeeded: { label: 'Succeeded', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' },
    }

    const config = variants[status]
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  function exportToCSV() {
    const headers = ['Payment ID', 'Order ID', 'Customer', 'Email', 'Amount', 'Status', 'Date']
    const rows = filteredPayments.map(p => [
      p.id,
      p.order_id,
      p.order?.users?.full_name || 'N/A',
      p.order?.users?.email || 'N/A',
      `£${(p.amount / 100).toFixed(2)}`,
      p.status,
      format(new Date(p.created_at), 'dd/MM/yyyy HH:mm'),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className="text-muted-foreground">Monitor and manage all platform payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(stats.totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulPayments} successful payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(stats.refundedAmount / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total refunded amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>View and manage all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, email, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={loadPayments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.order?.users?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.order?.users?.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.order_id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        £{(payment.amount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/orders?id=${payment.order_id}`}>
                            <Button variant="ghost" size="sm">
                              View Order
                            </Button>
                          </Link>
                          {payment.status === 'succeeded' && (
                            <Link href={`/admin/payments/refund?id=${payment.id}`}>
                              <Button variant="ghost" size="sm">
                                Refund
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredPayments.length} of {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
