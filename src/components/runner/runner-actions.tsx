'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import type { Order } from '@/lib/types'

interface RunnerActionsProps {
  order: Order
}

export function RunnerActions({ order }: RunnerActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    chest: '',
    waist: '',
    hips: '',
    inseam: '',
    outseam: '',
  })
  const [notes, setNotes] = useState('')

  async function handleMarkCollected() {
    if (order.status !== 'pickup_scheduled') return

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Validate measurements
      const numericMeasurements: Record<string, number> = {}
      Object.entries(measurements).forEach(([key, value]) => {
        if (value) {
          const num = parseFloat(value)
          if (!isNaN(num) && num > 0) {
            numericMeasurements[key] = num
          }
        }
      })

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'collected',
          measurements: numericMeasurements,
          runner_notes: notes || null,
          collected_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (error) throw error

      toast.success('Order marked as collected')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkDelivered() {
    if (order.status !== 'out_for_delivery') return

    setLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          completed_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (error) throw error

      toast.success('Order marked as delivered')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  if (order.status === 'pickup_scheduled') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Record Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Take Measurements (cm)</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(measurements).map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">
                    {key}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    value={measurements[key]}
                    onChange={(e) =>
                      setMeasurements({ ...measurements, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Collection Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any observations or customer requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleMarkCollected}
            disabled={loading}
            className="w-full gap-2"
            size="lg"
          >
            <CheckCircle className="h-4 w-4" />
            {loading ? 'Marking as collected...' : 'Mark as Collected'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (order.status === 'out_for_delivery') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Confirm delivery once you've handed the items to the customer.
          </p>
          <Button
            onClick={handleMarkDelivered}
            disabled={loading}
            className="w-full gap-2"
            size="lg"
          >
            <CheckCircle className="h-4 w-4" />
            {loading ? 'Marking as delivered...' : 'Mark as Delivered'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
