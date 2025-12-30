'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Search,
  RefreshCw
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Payout {
  id: string
  user_id: string
  order_id: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  payment_method: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  users: {
    full_name: string
    email: string
    role: string
  }
}

interface PayoutStats {
  totalPending: number
  totalPaid: number
  pendingCount: number
  paidCount: number
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<PayoutStats>({
    totalPending: 0,
    totalPaid: 0,
    pendingCount: 0,
    paidCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadPayouts()
  }, [])

  useEffect(() => {
    filterPayouts()
  }, [searchQuery, statusFilter, roleFilter, payouts])

  async function loadPayouts() {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          users!inner(
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPayouts(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading payouts:', error)
      toast.error('Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(payoutData: Payout[]) {
    const stats = payoutData.reduce(
      (acc, payout) => {
        if (payout.status === 'pending') {
          acc.totalPending += payout.amount
          acc.pendingCount++
        } else if (payout.status === 'paid') {
          acc.totalPaid += payout.amount
          acc.paidCount++
        }
        return acc
      },
      {
        totalPending: 0,
        totalPaid: 0,
        pendingCount: 0,
        paidCount: 0,
      }
    )

    setStats(stats)
  }

  function filterPayouts() {
    let filtered = payouts

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(p => p.users.role === roleFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => {
        const name = p.users.full_name?.toLowerCase() || ''
        const email = p.users.email?.toLowerCase() || ''
        return name.includes(query) || email.includes(query)
      })
    }

    setFilteredPayouts(filtered)
  }

  function getStatusBadge(status: Payout['status']) {
    const variants: Record<Payout['status'], { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    }

    const config = variants[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  function getRoleBadge(role: string) {
    const colors: Record<string, string> = {
      runner: 'bg-blue-100 text-blue-800',
      tailor: 'bg-purple-100 text-purple-800',
    }

    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  async function markAsPaid() {
    if (!selectedPayout) return

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/payouts/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_id: selectedPayout.id,
          payment_method: paymentMethod,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark payout as paid')
      }

      toast.success('Payout marked as paid')
      setSelectedPayout(null)
      setPaymentMethod('bank_transfer')
      setNotes('')
      loadPayouts()
    } catch (error: any) {
      console.error('Mark paid error:', error)
      toast.error(error.message || 'Failed to update payout')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payout Management</h1>
        <p className="text-muted-foreground">Track and manage payments to runners and tailors</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(stats.totalPending / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingCount} pending payment{stats.pendingCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(stats.totalPaid / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paidCount} completed payment{stats.paidCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{((stats.totalPending + stats.totalPaid) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(payouts.map(p => p.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receiving payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Records</CardTitle>
          <CardDescription>View and process payouts for service providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="runner">Runners</SelectItem>
                <SelectItem value="tailor">Tailors</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadPayouts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading payouts...</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payouts found</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.users.full_name}</div>
                          <div className="text-sm text-muted-foreground">{payout.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(payout.users.role)}</TableCell>
                      <TableCell className="font-medium">
                        £{(payout.amount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(payout.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {payout.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayout(payout)}
                              >
                                Mark as Paid
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mark Payout as Paid</DialogTitle>
                                <DialogDescription>
                                  Record payment details for {payout.users.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Amount:</span>
                                      <span className="font-bold">
                                        £{(payout.amount / 100).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">User:</span>
                                      <span>{payout.users.full_name}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="payment_method">Payment Method</Label>
                                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger id="payment_method">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                      <SelectItem value="paypal">PayPal</SelectItem>
                                      <SelectItem value="stripe">Stripe</SelectItem>
                                      <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="notes">Notes (Optional)</Label>
                                  <Textarea
                                    id="notes"
                                    placeholder="Add any notes about this payment..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>

                                <Button
                                  onClick={markAsPaid}
                                  disabled={processing}
                                  className="w-full"
                                >
                                  {processing ? 'Processing...' : 'Confirm Payment'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {payout.status === 'paid' && payout.paid_at && (
                          <div className="text-sm text-muted-foreground">
                            Paid on {format(new Date(payout.paid_at), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredPayouts.length} of {payouts.length} payout{payouts.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
