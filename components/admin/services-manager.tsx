'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  category_id: string
  base_price: number
  estimated_days: number
  active: boolean
  sort_order: number
  category?: Category
}

interface ServicesManagerProps {
  initialServices: Service[]
  categories: Category[]
}

export function ServicesManager({ initialServices, categories }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: categories[0]?.id || '',
    base_price: '',
    estimated_days: '7',
    active: true,
  })

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || service.category_id === categoryFilter
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? service.active : !service.active)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [services, searchQuery, categoryFilter, statusFilter])

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      base_price: '',
      estimated_days: '7',
      active: true,
    })
  }

  async function handleAddService() {
    if (!formData.name || !formData.category_id || !formData.base_price) {
      toast.error('Name, category, and price are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category_id: formData.category_id,
          base_price: parseFloat(formData.base_price),
          estimated_days: parseInt(formData.estimated_days) || 7,
          active: formData.active,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add service')
      }

      setServices([...services, data.service])
      toast.success('Service added successfully')
      setIsAddOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add service')
    } finally {
      setLoading(false)
    }
  }

  async function handleEditService() {
    if (!editingService || !formData.name || !formData.category_id || !formData.base_price) {
      toast.error('Name, category, and price are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category_id: formData.category_id,
          base_price: parseFloat(formData.base_price),
          estimated_days: parseInt(formData.estimated_days) || 7,
          active: formData.active,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service')
      }

      setServices(services.map(s => s.id === editingService.id ? data.service : s))
      toast.success('Service updated successfully')
      setIsEditOpen(false)
      setEditingService(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update service')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteService(service: Service) {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This cannot be undone.`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete service')
      }

      setServices(services.filter(s => s.id !== service.id))
      toast.success('Service deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service')
    } finally {
      setLoading(false)
    }
  }

  function openEditDialog(service: Service) {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      category_id: service.category_id,
      base_price: (service.base_price / 100).toFixed(2),
      estimated_days: service.estimated_days.toString(),
      active: service.active,
    })
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card className="border-amber-500/20 bg-slate-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-amber-500">Services Management</CardTitle>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-amber-500/20">
                <DialogHeader>
                  <DialogTitle className="text-amber-500">Add New Service</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Create a new service offering
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Trouser Hemming"
                      className="bg-slate-800 border-slate-700 text-slate-100"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-slate-200">Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-slate-100">
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-slate-200">Price (£) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                        placeholder="10.00"
                        className="bg-slate-800 border-slate-700 text-slate-100"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="days" className="text-slate-200">Est. Days</Label>
                      <Input
                        id="days"
                        type="number"
                        min="1"
                        value={formData.estimated_days}
                        onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-slate-100"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-200">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the service..."
                      className="bg-slate-800 border-slate-700 text-slate-100"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="active" className="text-slate-200">Active</Label>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      disabled={loading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={loading} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleAddService} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                    {loading ? 'Adding...' : 'Add Service'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-100">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id} className="text-slate-100">
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-100">All Status</SelectItem>
                <SelectItem value="active" className="text-slate-100">Active Only</SelectItem>
                <SelectItem value="inactive" className="text-slate-100">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="border-amber-500/20 bg-slate-900">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-amber-500">Service Name</TableHead>
                  <TableHead className="text-amber-500">Category</TableHead>
                  <TableHead className="text-amber-500">Price</TableHead>
                  <TableHead className="text-amber-500">Time</TableHead>
                  <TableHead className="text-amber-500">Status</TableHead>
                  <TableHead className="text-amber-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                      No services found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map(service => (
                    <TableRow key={service.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-100">
                        {service.name}
                        {service.description && (
                          <div className="text-xs text-slate-400 mt-1 max-w-md line-clamp-1">
                            {service.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                          {service.category?.icon} {service.category?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-100 font-medium">
                        {formatPrice(service.base_price / 100)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.estimated_days}d
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.active ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                            className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service)}
                            disabled={loading}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-slate-900 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-500">Edit Service</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update service details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-slate-200">Service Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-slate-200">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={loading}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-slate-100">
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-slate-200">Price (£) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-days" className="text-slate-200">Est. Days</Label>
                <Input
                  id="edit-days"
                  type="number"
                  min="1"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-slate-200">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
                rows={3}
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active" className="text-slate-200">Active</Label>
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={loading} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleEditService} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
