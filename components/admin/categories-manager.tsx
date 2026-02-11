'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Edit, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sort_order: number
  active: boolean
  service_count: number
  created_at: string
  updated_at: string
}

interface Service {
  id: string
  name: string
  base_price: number
  active: boolean
}

interface CategoriesManagerProps {
  initialCategories: Category[]
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
    active: true
  })
  const [loading, setLoading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryServices, setCategoryServices] = useState<Record<string, Service[]>>({})

  // Open add dialog
  function handleAdd() {
    setSelectedCategory(null)
    setFormData({ name: '', icon: '✂️', description: '', active: true })
    setIsEditOpen(true)
  }

  // Open edit dialog
  function handleEdit(category: Category) {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      active: category.active
    })
    setIsEditOpen(true)
  }

  // Handle form submission
  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setLoading(true)

    try {
      const url = selectedCategory
        ? `/api/admin/categories/${selectedCategory.id}`
        : `/api/admin/categories`

      const response = await fetch(url, {
        method: selectedCategory ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category')
      }

      if (selectedCategory) {
        // Update existing category
        setCategories(categories.map(cat =>
          cat.id === selectedCategory.id ? { ...cat, ...data } : cat
        ))
        toast.success('Category updated successfully')
      } else {
        // Add new category
        setCategories([...categories, { ...data, service_count: 0 }])
        toast.success('Category created successfully')
      }

      setIsEditOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!selectedCategory) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category')
      }

      setCategories(categories.filter(cat => cat.id !== selectedCategory.id))
      toast.success('Category deleted successfully')
      setIsDeleteOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    } finally {
      setLoading(false)
    }
  }

  // Open delete dialog
  function handleDeleteClick(category: Category) {
    setSelectedCategory(category)
    setIsDeleteOpen(true)
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCategories = [...categories]
    const draggedItem = newCategories[draggedIndex]

    // Remove from old position
    newCategories.splice(draggedIndex, 1)

    // Insert at new position
    newCategories.splice(index, 0, draggedItem)

    setCategories(newCategories)
    setDraggedIndex(index)
  }

  async function handleDragEnd() {
    if (draggedIndex === null) return

    // Save new order to backend
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: categories.map((cat, index) => ({
            id: cat.id,
            sort_order: index
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update category order')
      }

      toast.success('Category order updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order')
      // Reload to get correct order
      window.location.reload()
    } finally {
      setDraggedIndex(null)
    }
  }

  async function toggleCategoryExpand(categoryId: string) {
    const isExpanded = expandedCategories.has(categoryId)

    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedCategories)
      newExpanded.delete(categoryId)
      setExpandedCategories(newExpanded)
    } else {
      // Expand - fetch services if not already loaded
      const newExpanded = new Set(expandedCategories)
      newExpanded.add(categoryId)
      setExpandedCategories(newExpanded)

      if (!categoryServices[categoryId]) {
        try {
          const response = await fetch(`/api/admin/services`)
          const data = await response.json()

          if (response.ok) {
            const filteredServices = data.services.filter((s: any) => s.category_id === categoryId)
            setCategoryServices({
              ...categoryServices,
              [categoryId]: filteredServices
            })
          }
        } catch (error) {
          console.error('Failed to fetch services:', error)
        }
      }
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((category, index) => {
              const isExpanded = expandedCategories.has(category.id)
              const services = categoryServices[category.id] || []

              return (
                <div
                  key={category.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 bg-card hover:bg-accent/50 transition-colors cursor-move ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategoryExpand(category.id)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="text-2xl flex-shrink-0">{category.icon || '✂️'}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{category.name}</h3>
                        {!category.active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {category.description || 'No description'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline">{category.service_count} services</Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(category)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(category)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 py-3 bg-muted/30 border-t">
                      {services.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No services in this category
                        </p>
                      ) : (
                        <div className="grid gap-2">
                          {services.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between text-sm p-2 rounded bg-card"
                            >
                              <span className="font-medium">{service.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {formatPrice(service.base_price / 100)}
                                </span>
                                {service.active ? (
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {categories.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No categories yet. Click "Add Category" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Update category information below'
                : 'Create a new service category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dresses & Skirts"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 👗"
                maxLength={10}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this category..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : selectedCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCategory && selectedCategory.service_count > 0 ? (
                <>
                  This category has <strong>{selectedCategory.service_count} service(s)</strong> assigned to it.
                  You cannot delete a category that has services.
                  <br /><br />
                  Please reassign or delete the services first.
                </>
              ) : (
                <>
                  Are you sure you want to delete "<strong>{selectedCategory?.name}</strong>"?
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            {selectedCategory && selectedCategory.service_count === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
