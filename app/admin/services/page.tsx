'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  base_price: number
  estimated_days: number
  popular: boolean
  active: boolean
  sort_order: number
}

const CATEGORIES = [
  { value: 'trousers', label: 'Trousers' },
  { value: 'shirts', label: 'Shirts' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'suits', label: 'Suits' },
  { value: 'coats', label: 'Coats' },
  { value: 'other', label: 'Other' },
]

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [processing, setProcessing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    base_price: '',
    estimated_days: '7',
    popular: false,
    active: true,
    sort_order: '0',
  })

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      toast.error('Failed to load services')
      console.error(error)
    } else {
      setServices(data || [])
    }
    setLoading(false)
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      category: 'other',
      base_price: '',
      estimated_days: '7',
      popular: false,
      active: true,
      sort_order: '0',
    })
  }

  function openEditDialog(service: Service) {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      base_price: (service.base_price / 100).toString(),
      estimated_days: service.estimated_days.toString(),
      popular: service.popular,
      active: service.active,
      sort_order: service.sort_order.toString(),
    })
    setShowEditDialog(true)
  }

  async function handleCreate() {
    if (!formData.name || !formData.base_price) {
      toast.error('Name and price are required')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          base_price: Math.round(parseFloat(formData.base_price) * 100),
          estimated_days: parseInt(formData.estimated_days),
          popular: formData.popular,
          active: formData.active,
          sort_order: parseInt(formData.sort_order),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create service')
      }

      toast.success('Service created successfully')
      setShowCreateDialog(false)
      resetForm()
      loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create service')
    } finally {
      setProcessing(false)
    }
  }

  async function handleUpdate() {
    if (!selectedService || !formData.name || !formData.base_price) {
      toast.error('Name and price are required')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/services/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          base_price: Math.round(parseFloat(formData.base_price) * 100),
          estimated_days: parseInt(formData.estimated_days),
          popular: formData.popular,
          active: formData.active,
          sort_order: parseInt(formData.sort_order),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service')
      }

      toast.success('Service updated successfully')
      setShowEditDialog(false)
      setSelectedService(null)
      resetForm()
      loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update service')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete() {
    if (!selectedService) return

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/services/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete service')
      }

      toast.success('Service deleted successfully')
      setShowDeleteDialog(false)
      setSelectedService(null)
      loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service')
    } finally {
      setProcessing(false)
    }
  }

  async function toggleServiceStatus(service: Service) {
    setProcessing(true)

    try {
      const response = await fetch('/api/admin/services/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          active: !service.active,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service')
      }

      toast.success(`Service ${service.active ? 'deactivated' : 'activated'}`)
      loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update service')
    } finally {
      setProcessing(false)
    }
  }

  const stats = {
    total: services.length,
    active: services.filter(s => s.active).length,
    popular: services.filter(s => s.popular).length,
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Services Management</h1>
          <p className="text-muted-foreground">Manage alteration services and pricing</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Active Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.popular}</div>
            <p className="text-sm text-muted-foreground">Popular Services</p>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>Manage prices and availability</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading services...</p>
          ) : services.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No services found</p>
          ) : (
            <div className="space-y-4">
              {services.map(service => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      <Badge variant="outline" className="capitalize">
                        {service.category}
                      </Badge>
                      {service.popular && (
                        <Badge variant="default" className="bg-yellow-500">Popular</Badge>
                      )}
                      {!service.active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">£{(service.base_price / 100).toFixed(2)}</span>
                      <span>•</span>
                      <span>{service.estimated_days} days</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleServiceStatus(service)}
                      disabled={processing}
                    >
                      {service.active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(service)}
                      disabled={processing}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedService(service)
                        setShowDeleteDialog(true)
                      }}
                      disabled={processing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>Add a new alteration service</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Trousers Shortened"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (£) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="14.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Est. Days *</Label>
                <Input
                  id="days"
                  type="number"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort">Sort Order</Label>
                <Input
                  id="sort"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="popular" className="font-normal">Mark as popular</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="active" className="font-normal">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={processing}>
              {processing ? 'Creating...' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Same structure as Create */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Service Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (£) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-days">Est. Days *</Label>
                <Input
                  id="edit-days"
                  type="number"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-sort">Sort Order</Label>
                <Input
                  id="edit-sort"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-popular"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-popular" className="font-normal">Mark as popular</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-active" className="font-normal">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedService(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={processing}>
              {processing ? 'Updating...' : 'Update Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedService?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Delete Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
