'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Banknote, CreditCard, PackageCheck, HandCoins } from 'lucide-react'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

/**
 * Counter actions for a drop-off order: take the items in, take the money, and
 * hand the finished items back. Pickup orders are driven by the runner screens
 * instead, so this renders nothing for them.
 */
export function DropoffActions({ order }: { order: Order }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (order.fulfilment_type !== 'dropoff') return null

  const awaitingDropoff = order.status === 'booked'
  const readyForCollection = order.status === 'ready'
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

  if (!awaitingDropoff && !readyForCollection && !owesMoney) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5" />
          Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {awaitingDropoff && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The customer is bringing these items in. Record it when they arrive.
            </p>
            <Button
              className="w-full gap-2"
              disabled={busy !== null}
              onClick={() => call('receive', 'Items received')}
            >
              <PackageCheck className="h-4 w-4" />
              {busy === 'receive' ? 'Saving...' : 'Items received'}
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

        {readyForCollection && (
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
