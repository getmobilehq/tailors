'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/orders/status-badge'
import { formatPrice } from '@/lib/utils'
import { TAILOR_PAYOUT_RATE } from '@/lib/constants'
import { Search, Scissors } from 'lucide-react'
import Link from 'next/link'

interface TailorOrderListProps {
  orders: any[]
}

export function TailorOrderList({ orders }: TailorOrderListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(order =>
        order.order_number?.toLowerCase().includes(q) ||
        order.customer?.full_name?.toLowerCase().includes(q) ||
        order.items?.some((item: any) =>
          item.service?.name?.toLowerCase().includes(q)
        )
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter)
    }

    // Sort
    switch (sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'payout_high':
        result.sort((a, b) => (b.subtotal * TAILOR_PAYOUT_RATE) - (a.subtotal * TAILOR_PAYOUT_RATE))
        break
      case 'payout_low':
        result.sort((a, b) => (a.subtotal * TAILOR_PAYOUT_RATE) - (b.subtotal * TAILOR_PAYOUT_RATE))
        break
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [orders, search, statusFilter, sort])

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active orders. Check available orders to start working.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="payout_high">Highest Payout</SelectItem>
            <SelectItem value="payout_low">Lowest Payout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No orders match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map((order) => {
          const totalItems = order.items?.length || 0
          const doneItems = order.items?.filter((item: any) => item.status === 'done').length || 0
          const progressPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
          const payout = order.subtotal * TAILOR_PAYOUT_RATE

          const collectedDate = order.collected_at ? new Date(order.collected_at) : null
          const daysAgo = collectedDate
            ? Math.floor((Date.now() - collectedDate.getTime()) / (1000 * 60 * 60 * 24))
            : null

          return (
            <Link key={order.id} href={`/tailor/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-1">
                        {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {order.customer?.full_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {daysAgo !== null && daysAgo > 3 && (
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {daysAgo}d ago
                        </span>
                      )}
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Services */}
                  <p className="text-xs text-muted-foreground mb-3">
                    {order.items?.map((item: any) => item.service?.name).filter(Boolean).join(', ')}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{doneItems}/{totalItems} items done</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Payout */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs">
                      {order.items?.filter((item: any) => item.status === 'pending').length > 0 && (
                        <span className="text-gray-600">
                          {order.items.filter((item: any) => item.status === 'pending').length} pending
                        </span>
                      )}
                      {order.items?.filter((item: any) => item.status === 'in_progress').length > 0 && (
                        <span className="text-orange-600">
                          {order.items.filter((item: any) => item.status === 'in_progress').length} in progress
                        </span>
                      )}
                      {doneItems > 0 && (
                        <span className="text-green-600">
                          {doneItems} done
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Payout</p>
                      <p className="text-lg font-bold text-violet-600">{formatPrice(payout)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })
      )}
    </div>
  )
}
