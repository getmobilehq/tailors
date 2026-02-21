'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice, formatDateTime } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentWithOrder {
  id: string
  order_id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount: number
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  metadata: any
  created_at: string
  updated_at: string
  order: {
    id: string
    order_number: string
    total: number
    subtotal: number
    delivery_fee: number
    status: string
    customer: {
      full_name: string
      email: string
    } | null
  } | null
}

interface PaymentStats {
  totalCount: number
  totalRevenue: number
  refundCount: number
  pendingCount: number
  failedCount: number
}

interface PaymentsTableProps {
  payments: PaymentWithOrder[]
  stats: PaymentStats
}

type SortField = 'created_at' | 'amount' | 'status'
type SortDirection = 'asc' | 'desc'

const PAYMENT_STATUS_CONFIG = {
  pending: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
  succeeded: { variant: 'success' as const, icon: CheckCircle, label: 'Succeeded' },
  failed: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
  refunded: { variant: 'info' as const, icon: RotateCcw, label: 'Refunded' },
}

export function PaymentsTable({ payments: initialPayments, stats }: PaymentsTableProps) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Refund dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundingPayment, setRefundingPayment] = useState<PaymentWithOrder | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredPayments = useMemo(() => {
    let filtered = payments

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.order?.order_number?.toLowerCase().includes(searchLower) ||
        p.order?.customer?.full_name?.toLowerCase().includes(searchLower) ||
        p.order?.customer?.email?.toLowerCase().includes(searchLower) ||
        p.stripe_payment_intent_id?.toLowerCase().includes(searchLower)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [payments, search, statusFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredPayments.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + perPage)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value))
    setCurrentPage(1)
  }

  function handleRefundClick(payment: PaymentWithOrder) {
    setRefundingPayment(payment)
    setRefundAmount('')
    setRefundReason('')
    setRefundDialogOpen(true)
  }

  async function handleConfirmRefund() {
    if (!refundingPayment) return
    setActionLoading(true)

    try {
      const body: Record<string, any> = { payment_id: refundingPayment.id }
      if (refundAmount) {
        body.amount = parseFloat(refundAmount)
      }
      if (refundReason) {
        body.reason = refundReason
      }

      const response = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to process refund')

      setPayments(payments.map(p =>
        p.id === refundingPayment.id ? { ...p, status: 'refunded' as const } : p
      ))
      toast.success('Refund processed successfully')
      setRefundDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
                  <p className="text-2xl font-bold">{stats.totalCount}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
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
                  <p className="text-sm text-muted-foreground mb-1">Refunds</p>
                  <p className="text-2xl font-bold">{stats.refundCount}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Order number, customer, Stripe ID..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {paginatedPayments.length} of {filteredPayments.length} payments
                {filteredPayments.length !== payments.length && ` (filtered from ${payments.length} total)`}
              </span>
              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('amount')}>
                        Amount
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('status')}>
                        Status
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Stripe ID</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('created_at')}>
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPayments.map((payment) => {
                      const statusConfig = PAYMENT_STATUS_CONFIG[payment.status]
                      const StatusIcon = statusConfig.icon
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.order ? (
                              <Link
                                href={`/admin/orders/${payment.order.id}`}
                                className="text-primary hover:underline"
                              >
                                {payment.order.order_number}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.order?.customer?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {payment.stripe_payment_intent_id ? (
                              <span title={payment.stripe_payment_intent_id}>
                                {payment.stripe_payment_intent_id.slice(0, 20)}...
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(payment.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'succeeded' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefundClick(payment)}
                                title="Process refund"
                              >
                                <RotateCcw className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund payment for order <strong>{refundingPayment?.order?.order_number}</strong>.
              Original amount: <strong>{formatPrice(refundingPayment?.amount || 0)}</strong>.
              Leave the amount empty for a full refund.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount (optional, leave empty for full refund)</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={refundingPayment?.amount}
                placeholder={`Full refund: ${formatPrice(refundingPayment?.amount || 0)}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={actionLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason (optional)</Label>
              <Textarea
                id="refund-reason"
                placeholder="Reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                disabled={actionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRefund} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
