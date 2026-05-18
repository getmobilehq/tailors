'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import type { Order } from '@/lib/types'

interface TailorActionsProps {
  order: Order
  myItems: any[]
}

export function TailorActions({ order, myItems }: TailorActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>(() => {
    const statuses: Record<string, string> = {}
    myItems.forEach((item: any) => {
      statuses[item.id] = item.status
    })
    return statuses
  })
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(() => {
    const notes: Record<string, string> = {}
    myItems.forEach((item: any) => {
      notes[item.id] = item.tailor_notes || ''
    })
    return notes
  })

  async function postItemUpdates(payloadItems: { id: string; status: string; tailor_notes: string | null }[]) {
    const res = await fetch('/api/tailor/update-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, items: payloadItems }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body.error || `Failed to update items (${res.status})`)
    }
    return body as { ok: boolean; orderStatus: string | null; allDone: boolean }
  }

  async function handleUpdateItems() {
    setLoading(true)
    try {
      await postItemUpdates(
        myItems.map((item: any) => ({
          id: item.id,
          status: itemStatuses[item.id],
          tailor_notes: itemNotes[item.id] || null,
        }))
      )
      toast.success('Items updated')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update items')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllDone() {
    setLoading(true)
    try {
      const body = await postItemUpdates(
        myItems.map((item: any) => ({
          id: item.id,
          status: 'done',
          tailor_notes: itemNotes[item.id] || null,
        }))
      )
      if (body.allDone) {
        toast.success('All items done — order is ready for delivery.')
      } else {
        toast.success('Your items are done. Waiting on other tailor(s) before order goes ready.')
      }
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update items')
    } finally {
      setLoading(false)
    }
  }

  const allMyItemsDone = myItems.every((item: any) => itemStatuses[item.id] === 'done')
  const orderHasOtherTailors = (order.items || []).some(
    (i: any) => i.tailor_id && !myItems.some((m: any) => m.id === i.id)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Your Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {myItems.map((item: any) => (
          <div key={item.id} className="pb-6 border-b last:border-0">
            <h4 className="font-semibold mb-3">{item.service?.name}</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`status-${item.id}`}>Status</Label>
                <Select
                  value={itemStatuses[item.id]}
                  onValueChange={(value) => setItemStatuses({ ...itemStatuses, [item.id]: value })}
                >
                  <SelectTrigger id={`status-${item.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${item.id}`}>Tailor Notes</Label>
                <Textarea
                  id={`notes-${item.id}`}
                  placeholder="Add notes about the work done..."
                  value={itemNotes[item.id]}
                  onChange={(e) => setItemNotes({ ...itemNotes, [item.id]: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <Button
            onClick={handleUpdateItems}
            disabled={loading}
            className="flex-1"
            variant={allMyItemsDone ? 'outline' : 'default'}
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>

          {!allMyItemsDone && (
            <Button onClick={handleMarkAllDone} disabled={loading} className="flex-1 gap-2">
              <CheckCircle className="h-4 w-4" />
              {loading ? 'Updating...' : 'Mark All My Items Done'}
            </Button>
          )}
        </div>

        {allMyItemsDone && orderHasOtherTailors && (
          <p className="text-sm text-amber-600 text-center">
            Your items are done. Waiting on other tailor(s) before the order is ready for delivery.
          </p>
        )}
        {allMyItemsDone && !orderHasOtherTailors && (
          <p className="text-sm text-green-600 text-center">
            ✓ All items completed. Order is ready for delivery.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
