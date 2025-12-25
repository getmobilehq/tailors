'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import type { Order } from '@/lib/types'

interface TailorActionsProps {
  order: Order
}

export function TailorActions({ order }: TailorActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>(() => {
    const statuses: Record<string, string> = {}
    order.items?.forEach((item: any) => {
      statuses[item.id] = item.status
    })
    return statuses
  })
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(() => {
    const notes: Record<string, string> = {}
    order.items?.forEach((item: any) => {
      notes[item.id] = item.tailor_notes || ''
    })
    return notes
  })

  async function handleUpdateItems() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Update each item
      const updates = order.items?.map((item: any) => {
        return supabase
          .from('order_items')
          .update({
            status: itemStatuses[item.id],
            tailor_notes: itemNotes[item.id] || null,
          })
          .eq('id', item.id)
      })

      if (updates) {
        await Promise.all(updates)
      }

      // Check if all items are done, then update order status to 'ready'
      const allDone = order.items?.every((item: any) => itemStatuses[item.id] === 'done')

      if (allDone && order.status !== 'ready') {
        await supabase
          .from('orders')
          .update({ status: 'ready' })
          .eq('id', order.id)
      }

      toast.success('Items updated successfully')
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
      const supabase = createClient()

      // Update all items to done
      const updates = order.items?.map((item: any) => {
        return supabase
          .from('order_items')
          .update({
            status: 'done',
            tailor_notes: itemNotes[item.id] || null,
          })
          .eq('id', item.id)
      })

      if (updates) {
        await Promise.all(updates)
      }

      // Update order status to ready
      await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', order.id)

      toast.success('All items marked as done! Order is ready for delivery.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update items')
    } finally {
      setLoading(false)
    }
  }

  const allDone = order.items?.every((item: any) => itemStatuses[item.id] === 'done')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {order.items?.map((item: any) => (
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
            variant={allDone ? "outline" : "default"}
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>

          {!allDone && (
            <Button
              onClick={handleMarkAllDone}
              disabled={loading}
              className="flex-1 gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {loading ? 'Updating...' : 'Mark All Done'}
            </Button>
          )}
        </div>

        {allDone && (
          <p className="text-sm text-green-600 text-center">
            ✓ All items completed! Order is ready for delivery.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
