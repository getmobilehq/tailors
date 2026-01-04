'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Search, Plus, Pencil, Save, X, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SiteContent {
  id: string
  page: string
  section: string
  content_key: string
  content_value: string
  content_type: string
  display_order: number
  is_active: boolean
}

const PAGES = [
  { value: 'all', label: 'All Pages' },
  { value: 'home', label: 'Homepage' },
  { value: 'how-it-works', label: 'How It Works' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'apply-runner', label: 'Apply - Runner' },
  { value: 'apply-tailor', label: 'Apply - Tailor' },
]

export default function ContentManagementPage() {
  const [content, setContent] = useState<SiteContent[]>([])
  const [filteredContent, setFilteredContent] = useState<SiteContent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContent()
  }, [])

  useEffect(() => {
    filterContent()
  }, [content, selectedPage, searchQuery])

  async function loadContent() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/content')
      if (res.ok) {
        const data = await res.json()
        setContent(data)
      }
    } catch (error) {
      console.error('Failed to load content:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterContent() {
    let filtered = content

    if (selectedPage !== 'all') {
      filtered = filtered.filter(item => item.page === selectedPage)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.content_key.toLowerCase().includes(query) ||
        item.content_value.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query)
      )
    }

    setFilteredContent(filtered)
  }

  function startEdit(item: SiteContent) {
    setEditingId(item.id)
    setEditValue(item.content_value)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveEdit(id: string) {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content_value: editValue })
      })

      if (res.ok) {
        await loadContent()
        setEditingId(null)
        setEditValue('')
      } else {
        alert('Failed to save changes')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive })
      })

      if (res.ok) {
        await loadContent()
      }
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  async function deleteContent(id: string) {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const res = await fetch(`/api/admin/content?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadContent()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Group content by page and section
  const groupedContent = filteredContent.reduce((acc, item) => {
    const key = `${item.page}__${item.section}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<string, SiteContent[]>)

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Management</h1>
            <p className="text-muted-foreground">Manage website content across all pages</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {PAGES.map(page => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span>Total: {filteredContent.length} items</span>
          <span>•</span>
          <span>Active: {filteredContent.filter(i => i.is_active).length}</span>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading content...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedContent).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No content found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedContent).map(([key, items]) => {
            const [page, section] = key.split('__')
            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {page} / {section}
                      </CardTitle>
                      <CardDescription>{items.length} content items</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.content_key}</h4>
                              <Badge variant={item.content_type === 'text' ? 'secondary' : 'outline'}>
                                {item.content_type}
                              </Badge>
                              {!item.is_active && (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                            </div>

                            {editingId === item.id ? (
                              <div className="mt-2 space-y-2">
                                {item.content_type === 'text' && item.content_value.length > 100 ? (
                                  <Textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    rows={4}
                                    className="font-mono text-sm"
                                  />
                                ) : (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="font-mono text-sm"
                                  />
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEdit(item.id)}
                                    disabled={saving}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    disabled={saving}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {item.content_value}
                              </p>
                            )}
                          </div>

                          {editingId !== item.id && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleActive(item.id, item.is_active)}
                              >
                                {item.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(item)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteContent(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
