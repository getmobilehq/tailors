'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { formatDate } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Scissors,
  Truck,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  email: string
  full_name: string
  phone: string
  application_type: 'runner' | 'tailor'
  status: 'pending' | 'approved' | 'rejected'
  bio: string | null
  experience_years: number | null
  availability: string | null
  postcode_coverage: string[] | null
  has_vehicle: boolean | null
  license_number: string | null
  specializations: string[] | null
  portfolio_urls: string[] | null
  certifications: string[] | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

interface ApplicationsTableProps {
  applications: Application[]
}

type SortField = 'full_name' | 'email' | 'application_type' | 'created_at' | 'status'
type SortDirection = 'asc' | 'desc'

const STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
} as const

const TYPE_COLORS = {
  runner: 'runner',
  tailor: 'tailor',
} as const

const SPECIALIZATION_OPTIONS = [
  'Trousers & Jeans',
  'Shirts & Blouses',
  'Dresses & Skirts',
  'Suits & Formal Wear',
  'Coats & Jackets',
  'Wedding Dresses',
  'Leather Goods',
  'Denim Repair',
  'Tailoring',
  'Embroidery',
]

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends only' },
  { value: 'flexible', label: 'Flexible' },
]

interface EditFormData {
  full_name: string
  email: string
  phone: string
  bio: string
  experience_years: number | null
  availability: string
  postcode_coverage: string
  has_vehicle: boolean
  specializations: string[]
  certifications: string
  portfolio_urls: string
}

export function ApplicationsTable({ applications: initialApplications }: ApplicationsTableProps) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApplications)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // View detail dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null)

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingApplication, setRejectingApplication] = useState<Application | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Approve confirmation
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approvingApplication, setApprovingApplication] = useState<Application | null>(null)

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    full_name: '', email: '', phone: '', bio: '', experience_years: null,
    availability: '', postcode_coverage: '', has_vehicle: false,
    specializations: [], certifications: '', portfolio_urls: '',
  })

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingApplication, setDeletingApplication] = useState<Application | null>(null)

  // Loading states
  const [actionLoading, setActionLoading] = useState(false)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredApplications = useMemo(() => {
    let filtered = applications

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(app =>
        app.full_name.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.phone?.toLowerCase().includes(searchLower)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.application_type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [applications, search, typeFilter, statusFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredApplications.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + perPage)

  const pendingCount = applications.filter(a => a.status === 'pending').length

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value))
    setCurrentPage(1)
  }

  function handleViewClick(app: Application) {
    setViewingApplication(app)
    setViewDialogOpen(true)
  }

  function handleApproveClick(app: Application) {
    setApprovingApplication(app)
    setApproveDialogOpen(true)
  }

  function handleRejectClick(app: Application) {
    setRejectingApplication(app)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  function handleEditClick(app: Application) {
    setEditingApplication(app)
    setEditFormData({
      full_name: app.full_name,
      email: app.email,
      phone: app.phone || '',
      bio: app.bio || '',
      experience_years: app.experience_years,
      availability: app.availability || '',
      postcode_coverage: app.postcode_coverage?.join(', ') || '',
      has_vehicle: app.has_vehicle || false,
      specializations: app.specializations || [],
      certifications: app.certifications?.join('\n') || '',
      portfolio_urls: app.portfolio_urls?.join('\n') || '',
    })
    setEditDialogOpen(true)
  }

  function toggleSpecialization(spec: string) {
    setEditFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }))
  }

  async function handleSaveEdit() {
    if (!editingApplication) return
    setActionLoading(true)

    try {
      const payload: Record<string, any> = {
        full_name: editFormData.full_name,
        email: editFormData.email,
        phone: editFormData.phone,
        bio: editFormData.bio || null,
        experience_years: editFormData.experience_years,
        availability: editFormData.availability || null,
      }

      if (editingApplication.application_type === 'runner') {
        payload.postcode_coverage = editFormData.postcode_coverage
          ? editFormData.postcode_coverage.split(',').map(s => s.trim()).filter(Boolean)
          : []
        payload.has_vehicle = editFormData.has_vehicle
      } else {
        payload.specializations = editFormData.specializations
        payload.certifications = editFormData.certifications
          ? editFormData.certifications.split('\n').map(s => s.trim()).filter(Boolean)
          : []
        payload.portfolio_urls = editFormData.portfolio_urls
          ? editFormData.portfolio_urls.split('\n').map(s => s.trim()).filter(Boolean)
          : []
      }

      const response = await fetch(`/api/admin/applications/${editingApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update application')

      setApplications(applications.map(a =>
        a.id === editingApplication.id ? { ...a, ...data } : a
      ))
      toast.success('Application updated successfully')
      setEditDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update application')
    } finally {
      setActionLoading(false)
    }
  }

  function handleDeleteClick(app: Application) {
    setDeletingApplication(app)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingApplication) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/applications/${deletingApplication.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete application')
      }

      setApplications(applications.filter(a => a.id !== deletingApplication.id))
      toast.success(`${deletingApplication.full_name}'s application deleted.`)
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete application')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmApprove() {
    if (!approvingApplication) return
    setActionLoading(true)

    try {
      const response = await fetch('/api/admin/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: approvingApplication.id,
          action: 'approve',
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to approve application')

      setApplications(applications.map(a =>
        a.id === approvingApplication.id ? { ...a, status: 'approved' as const } : a
      ))
      toast.success(`${approvingApplication.full_name}'s application approved. User account created.`)
      setApproveDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmReject() {
    if (!rejectingApplication || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setActionLoading(true)

    try {
      const response = await fetch('/api/admin/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: rejectingApplication.id,
          action: 'reject',
          rejection_reason: rejectionReason.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to reject application')

      setApplications(applications.map(a =>
        a.id === rejectingApplication.id
          ? { ...a, status: 'rejected' as const, rejection_reason: rejectionReason.trim() }
          : a
      ))
      toast.success(`${rejectingApplication.full_name}'s application rejected.`)
      setRejectDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject application')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, email, phone..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="runner">Runner</SelectItem>
                    <SelectItem value="tailor">Tailor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {paginatedApplications.length} of {filteredApplications.length} applications
                {filteredApplications.length !== applications.length && ` (filtered from ${applications.length} total)`}
              </span>
              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('full_name')}>
                        Applicant
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('email')}>
                        Email
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('application_type')}>
                        Type
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('status')}>
                        Status
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('created_at')}>
                        Applied
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{app.email}</TableCell>
                        <TableCell>
                          <Badge variant={TYPE_COLORS[app.application_type]}>
                            {app.application_type === 'runner' ? (
                              <><Truck className="h-3 w-3" /> Runner</>
                            ) : (
                              <><Scissors className="h-3 w-3" /> Tailor</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_COLORS[app.status]}>
                            {app.status === 'pending' && <Clock className="h-3 w-3" />}
                            {app.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                            {app.status === 'rejected' && <XCircle className="h-3 w-3" />}
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(app.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewClick(app)} title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(app)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {app.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveClick(app)}
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectClick(app)}
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(app)} title="Delete">
                              <Trash2 className="h-4 w-4 text-red-600" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Application Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingApplication?.application_type === 'runner' ? (
                <Truck className="h-5 w-5" />
              ) : (
                <Scissors className="h-5 w-5" />
              )}
              {viewingApplication?.full_name}
            </DialogTitle>
            <DialogDescription>
              {viewingApplication?.application_type === 'runner' ? 'Runner' : 'Tailor'} application submitted {viewingApplication && formatDate(viewingApplication.created_at)}
            </DialogDescription>
          </DialogHeader>

          {viewingApplication && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_COLORS[viewingApplication.status]} className="text-sm px-3 py-1">
                  {viewingApplication.status.charAt(0).toUpperCase() + viewingApplication.status.slice(1)}
                </Badge>
                {viewingApplication.reviewed_at && (
                  <span className="text-sm text-muted-foreground">
                    Reviewed on {formatDate(viewingApplication.reviewed_at)}
                  </span>
                )}
              </div>

              {viewingApplication.rejection_reason && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm">
                  <strong>Rejection reason:</strong> {viewingApplication.rejection_reason}
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{viewingApplication.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{viewingApplication.phone}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {viewingApplication.bio && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Background</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingApplication.bio}</p>
                </div>
              )}

              {/* Experience & Availability */}
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {viewingApplication.experience_years != null && (
                  <div>
                    <span className="text-muted-foreground">Experience:</span>{' '}
                    <span className="font-medium">{viewingApplication.experience_years} year{viewingApplication.experience_years !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {viewingApplication.availability && (
                  <div>
                    <span className="text-muted-foreground">Availability:</span>{' '}
                    <span className="font-medium capitalize">{viewingApplication.availability.replace('-', ' ')}</span>
                  </div>
                )}
              </div>

              {/* Runner-specific */}
              {viewingApplication.application_type === 'runner' && (
                <>
                  {viewingApplication.postcode_coverage && viewingApplication.postcode_coverage.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Postcode Coverage</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingApplication.postcode_coverage.map(pc => (
                          <Badge key={pc} variant="outline">{pc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {viewingApplication.has_vehicle != null && (
                      <div>
                        <span className="text-muted-foreground">Has Vehicle:</span>{' '}
                        <span className="font-medium">{viewingApplication.has_vehicle ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {viewingApplication.license_number && (
                      <div>
                        <span className="text-muted-foreground">License:</span>{' '}
                        <span className="font-medium">{viewingApplication.license_number}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tailor-specific */}
              {viewingApplication.application_type === 'tailor' && (
                <>
                  {viewingApplication.specializations && viewingApplication.specializations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingApplication.specializations.map(spec => (
                          <Badge key={spec} variant="secondary">{spec}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingApplication.portfolio_urls && viewingApplication.portfolio_urls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Portfolio Links</h4>
                      <div className="space-y-1">
                        {viewingApplication.portfolio_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingApplication.certifications && viewingApplication.certifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Certifications</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {viewingApplication.certifications.map((cert, i) => (
                          <li key={i}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {viewingApplication?.status === 'pending' && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleRejectClick(viewingApplication)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleApproveClick(viewingApplication)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
            {viewingApplication?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{approvingApplication?.full_name}</strong>'s{' '}
              {approvingApplication?.application_type} application? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create a new user account with the {approvingApplication?.application_type} role</li>
                <li>Create a {approvingApplication?.application_type} profile</li>
                <li>Send an approval email with temporary login credentials</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApprove} disabled={actionLoading}>
              {actionLoading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Reject <strong>{rejectingApplication?.full_name}</strong>'s {rejectingApplication?.application_type} application.
              A rejection email will be sent with the reason provided.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejecting this application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={actionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update {editingApplication?.full_name}'s {editingApplication?.application_type} application details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">Full Name</Label>
                <Input
                  id="edit-full-name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Experience (years)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  min={0}
                  value={editFormData.experience_years ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, experience_years: e.target.value ? Number(e.target.value) : null })}
                  disabled={actionLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-availability">Availability</Label>
              <Select
                value={editFormData.availability}
                onValueChange={(value) => setEditFormData({ ...editFormData, availability: value })}
              >
                <SelectTrigger id="edit-availability">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editFormData.bio}
                onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                rows={3}
                disabled={actionLoading}
              />
            </div>

            {/* Runner-specific fields */}
            {editingApplication?.application_type === 'runner' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-postcode">Postcode Coverage (comma-separated)</Label>
                  <Input
                    id="edit-postcode"
                    placeholder="NG1, NG2, NG3..."
                    value={editFormData.postcode_coverage}
                    onChange={(e) => setEditFormData({ ...editFormData, postcode_coverage: e.target.value })}
                    disabled={actionLoading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-vehicle"
                    checked={editFormData.has_vehicle}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, has_vehicle: checked === true })}
                    disabled={actionLoading}
                  />
                  <Label htmlFor="edit-vehicle">Has Vehicle</Label>
                </div>
              </>
            )}

            {/* Tailor-specific fields */}
            {editingApplication?.application_type === 'tailor' && (
              <>
                <div className="space-y-2">
                  <Label>Specializations</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIALIZATION_OPTIONS.map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                          editFormData.specializations.includes(spec)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        disabled={actionLoading}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-certifications">Certifications (one per line)</Label>
                  <Textarea
                    id="edit-certifications"
                    placeholder="Enter certifications, one per line..."
                    value={editFormData.certifications}
                    onChange={(e) => setEditFormData({ ...editFormData, certifications: e.target.value })}
                    rows={3}
                    disabled={actionLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-portfolio">Portfolio URLs (one per line)</Label>
                  <Textarea
                    id="edit-portfolio"
                    placeholder="Enter portfolio URLs, one per line..."
                    value={editFormData.portfolio_urls}
                    onChange={(e) => setEditFormData({ ...editFormData, portfolio_urls: e.target.value })}
                    rows={3}
                    disabled={actionLoading}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Application Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingApplication?.full_name}</strong>'s{' '}
              {deletingApplication?.application_type} application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
