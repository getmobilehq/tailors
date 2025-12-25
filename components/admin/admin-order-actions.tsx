'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

interface AdminOrderActionsProps {
  order: Order
  runners: Array<{ id: string; full_name: string }>
  tailors: Array<{ id: string; full_name: string }>
}

export function AdminOrderActions({ order, runners, tailors }: AdminOrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedRunner, setSelectedRunner] = useState(order.runner_id || 'unassigned')
  const [selectedTailor, setSelectedTailor] = useState(order.tailor_id || 'unassigned')
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '')
  const [newStatus, setNewStatus] = useState(order.status)

  async function handleUpdate() {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const updates: any = {
        status: newStatus,
        admin_notes: adminNotes || null,
      }

      if (selectedRunner && selectedRunner !== 'unassigned') {
        updates.runner_id = selectedRunner
      } else if (selectedRunner === 'unassigned') {
        updates.runner_id = null
      }

      if (selectedTailor && selectedTailor !== 'unassigned') {
        updates.tailor_id = selectedTailor
      } else if (selectedTailor === 'unassigned') {
        updates.tailor_id = null
      }

      // Set completion date if marking as completed
      if (newStatus === 'completed' && order.status !== 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id)

      if (error) throw error

      toast.success('Order updated successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'booked', label: 'Booked' },
    { value: 'pickup_scheduled', label: 'Pickup Scheduled' },
    { value: 'collected', label: 'Collected' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assign Runner</Label>
          <Select value={selectedRunner} onValueChange={setSelectedRunner}>
            <SelectTrigger>
              <SelectValue placeholder="Select runner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {runners.map((runner) => (
                <SelectItem key={runner.id} value={runner.id}>
                  {runner.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assign Tailor</Label>
          <Select value={selectedTailor} onValueChange={setSelectedTailor}>
            <SelectTrigger>
              <SelectValue placeholder="Select tailor..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {tailors.map((tailor) => (
                <SelectItem key={tailor.id} value={tailor.id}>
                  {tailor.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-notes">Admin Notes</Label>
          <Textarea
            id="admin-notes"
            placeholder="Internal notes..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Updating...' : 'Update Order'}
        </Button>
      </CardContent>
    </Card>
  )
}
