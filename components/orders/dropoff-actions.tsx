'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, CreditCard, PackageCheck, HandCoins, Mail } from 'lucide-react'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

/**
 * Counter actions for orders with no runner: take the items in (handed over or
 * posted), take the money, and get the finished items back to the customer -
 * over the counter for a drop-off, by Royal Mail for a postal order. Pickup
 * orders are driven by the runner screens instead, so this renders nothing for
 * them.
 */
export function DropoffActions({ order }: { order: Order }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')

  const isPostal = order.fulfilment_type === 'postal'

  if (order.fulfilment_type !== 'dropoff' && !isPostal) return null

  const awaitingItems = order.status === 'booked'
  const readyToReturn = order.status === 'ready'
  const owesMoney = order.payment_method === 'in_person' && order.payment_status === 'unpaid'

  async function call(action: string, label: string, body?: Record<string, unknown>) {
    setBusy(action)
    try {
      const res = await fetch(`/api/orders/${order.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || `Could not ${label}`)

      toast.success(label)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusy(null)
    }
  }

  if (!awaitingItems && !readyToReturn && !owesMoney) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPostal ? <Mail className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}
          {isPostal ? 'Postal order' : 'Counter'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {awaitingItems && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isPostal
                ? 'The customer is posting these items to you. Record it when the parcel arrives.'
                : 'The customer is bringing these items in. Record it when they arrive.'}
            </p>
            <Button
              className="w-full gap-2"
              disabled={busy !== null}
              onClick={() => call('receive', isPostal ? 'Parcel received' : 'Items received')}
            >
              <PackageCheck className="h-4 w-4" />
              {busy === 'receive'
                ? 'Saving...'
                : isPostal
                  ? 'Parcel received'
                  : 'Items received'}
            </Button>
          </div>
        )}

        {owesMoney && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <HandCoins className="h-4 w-4" />
                Unpaid
              </span>
              <span className="font-semibold">{formatPrice(order.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                disabled={busy !== null}
                onClick={() => call('mark-paid', 'Payment recorded', { method: 'cash' })}
              >
                <Banknote className="h-4 w-4" />
                Paid cash
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={busy !== null}
                onClick={() => call('mark-paid', 'Payment recorded', { method: 'card' })}
              >
                <CreditCard className="h-4 w-4" />
                Paid card
              </Button>
            </div>
          </div>
        )}

        {readyToReturn && isPostal && (
          <div className="space-y-2">
            <Label htmlFor="tracking">Royal Mail tracking number</Label>
            <Input
              id="tracking"
              placeholder="AB123456789GB"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Saving this completes the order and emails the customer a tracking link.
            </p>
            <Button
              className="w-full gap-2"
              disabled={busy !== null || !tracking.trim()}
              onClick={() => call('post-back', 'Marked posted', { trackingNumber: tracking })}
            >
              <Mail className="h-4 w-4" />
              {busy === 'post-back' ? 'Saving...' : 'Mark posted & notify'}
            </Button>
          </div>
        )}

        {readyToReturn && !isPostal && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {owesMoney
                ? 'Take payment before handing the items over.'
                : 'Finished and paid for - ready to hand back.'}
            </p>
            <Button
              className="w-full gap-2"
              disabled={busy !== null || owesMoney}
              onClick={() => call('handover', 'Order completed')}
            >
              <PackageCheck className="h-4 w-4" />
              {busy === 'handover' ? 'Saving...' : 'Customer collected'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
