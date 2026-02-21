'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReviewWithRelations {
  id: string
  order_id: string
  customer_id: string
  runner_id: string | null
  tailor_id: string | null
  overall_rating: number
  runner_rating: number | null
  tailor_rating: number | null
  comment: string | null
  is_visible: boolean
  moderated_by: string | null
  moderated_at: string | null
  moderation_reason: string | null
  created_at: string
  customer: { full_name: string; email: string } | null
  order: { id: string; order_number: string } | null
  runner: { full_name: string } | null
  tailor: { full_name: string } | null
}

interface ReviewStats {
  totalCount: number
  avgRating: number
  visibleCount: number
  hiddenCount: number
}

interface ReviewsTableProps {
  reviews: ReviewWithRelations[]
  stats: ReviewStats
}

type SortField = 'created_at' | 'overall_rating' | 'is_visible'
type SortDirection = 'asc' | 'desc'

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-3 w-3'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewsTable({ reviews: initialReviews, stats }: ReviewsTableProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingReview, setViewingReview] = useState<ReviewWithRelations | null>(null)

  // Hide dialog (requires reason)
  const [hideDialogOpen, setHideDialogOpen] = useState(false)
  const [hidingReview, setHidingReview] = useState<ReviewWithRelations | null>(null)
  const [moderationReason, setModerationReason] = useState('')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingReview, setDeletingReview] = useState<ReviewWithRelations | null>(null)

  const [actionLoading, setActionLoading] = useState(false)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredReviews = useMemo(() => {
    let filtered = reviews

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(r =>
        r.customer?.full_name?.toLowerCase().includes(searchLower) ||
        r.order?.order_number?.toLowerCase().includes(searchLower) ||
        r.comment?.toLowerCase().includes(searchLower)
      )
    }

    if (ratingFilter !== 'all') {
      const rating = Number(ratingFilter)
      filtered = filtered.filter(r => r.overall_rating === rating)
    }

    if (visibilityFilter !== 'all') {
      if (visibilityFilter === 'visible') {
        filtered = filtered.filter(r => r.is_visible !== false)
      } else {
        filtered = filtered.filter(r => r.is_visible === false)
      }
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (sortField === 'is_visible') {
        aVal = aVal === false ? 0 : 1
        bVal = bVal === false ? 0 : 1
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [reviews, search, ratingFilter, visibilityFilter, sortField, sortDirection])

  const totalPages = Math.ceil(filteredReviews.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + perPage)

  const handleSearchChange = (value: string) => { setSearch(value); setCurrentPage(1) }
  const handleRatingFilterChange = (value: string) => { setRatingFilter(value); setCurrentPage(1) }
  const handleVisibilityFilterChange = (value: string) => { setVisibilityFilter(value); setCurrentPage(1) }
  const handlePerPageChange = (value: string) => { setPerPage(Number(value)); setCurrentPage(1) }

  function handleViewClick(review: ReviewWithRelations) {
    setViewingReview(review)
    setViewDialogOpen(true)
  }

  function handleHideClick(review: ReviewWithRelations) {
    setHidingReview(review)
    setModerationReason('')
    setHideDialogOpen(true)
  }

  async function handleToggleVisibility(review: ReviewWithRelations, makeVisible: boolean) {
    if (!makeVisible) {
      handleHideClick(review)
      return
    }

    // Making visible — no reason needed
    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          is_visible: true,
          moderation_reason: 'Restored by admin',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update review')

      setReviews(reviews.map(r => r.id === review.id ? { ...r, is_visible: true } : r))
      toast.success('Review made visible')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update review')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmHide() {
    if (!hidingReview || !moderationReason.trim()) {
      toast.error('Please provide a moderation reason')
      return
    }
    setActionLoading(true)

    try {
      const response = await fetch('/api/admin/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: hidingReview.id,
          is_visible: false,
          moderation_reason: moderationReason.trim(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to hide review')

      setReviews(reviews.map(r =>
        r.id === hidingReview.id
          ? { ...r, is_visible: false, moderation_reason: moderationReason.trim() }
          : r
      ))
      toast.success('Review hidden')
      setHideDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to hide review')
    } finally {
      setActionLoading(false)
    }
  }

  function handleDeleteClick(review: ReviewWithRelations) {
    setDeletingReview(review)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingReview) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/reviews/${deletingReview.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete review')
      }

      setReviews(reviews.filter(r => r.id !== deletingReview.id))
      toast.success('Review deleted')
      setDeleteDialogOpen(false)
      setViewDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
                  <p className="text-2xl font-bold">{stats.totalCount}</p>
                </div>
                <Star className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                    <StarDisplay rating={Math.round(stats.avgRating)} />
                  </div>
                </div>
                <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Visible</p>
                  <p className="text-2xl font-bold">{stats.visibleCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hidden</p>
                  <p className="text-2xl font-bold">{stats.hiddenCount}</p>
                </div>
                <EyeOff className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                    placeholder="Customer, order number, comment..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <Select value={visibilityFilter} onValueChange={handleVisibilityFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {paginatedReviews.length} of {filteredReviews.length} reviews
                {filteredReviews.length !== reviews.length && ` (filtered from ${reviews.length} total)`}
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
                    <TableHead className="w-[130px]">Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('overall_rating')}>
                        Overall
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Runner</TableHead>
                    <TableHead>Tailor</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('is_visible')}>
                        Visible
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('created_at')}>
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                        No reviews found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReviews.map((review) => (
                      <TableRow key={review.id} className={review.is_visible === false ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          {review.order ? (
                            <Link href={`/admin/orders/${review.order.id}`} className="text-primary hover:underline">
                              {review.order.order_number}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {review.customer?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StarDisplay rating={review.overall_rating} size="xs" />
                            <span className="text-sm font-medium">{review.overall_rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.runner_rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{review.runner_rating}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {review.tailor_rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{review.tailor_rating}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {review.comment ? (
                            <span className="text-sm text-muted-foreground truncate block" title={review.comment}>
                              {review.comment.length > 50 ? review.comment.slice(0, 50) + '...' : review.comment}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No comment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {review.is_visible !== false ? (
                            <Badge variant="success">Visible</Badge>
                          ) : (
                            <Badge variant="warning">Hidden</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(review.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewClick(review)} title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVisibility(review, review.is_visible === false)}
                              title={review.is_visible !== false ? 'Hide review' : 'Show review'}
                              disabled={actionLoading}
                            >
                              {review.is_visible !== false ? (
                                <EyeOff className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Eye className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(review)} title="Delete">
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

      {/* View Review Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Review Details
            </DialogTitle>
            <DialogDescription>
              {viewingReview?.order?.order_number && (
                <>Order {viewingReview.order.order_number} &bull; </>
              )}
              {viewingReview && formatDate(viewingReview.created_at)}
            </DialogDescription>
          </DialogHeader>

          {viewingReview && (
            <div className="space-y-5 py-4">
              {/* Visibility status */}
              <div className="flex items-center gap-2">
                {viewingReview.is_visible !== false ? (
                  <Badge variant="success">Visible</Badge>
                ) : (
                  <Badge variant="warning">Hidden</Badge>
                )}
                {viewingReview.is_visible === false && viewingReview.moderation_reason && (
                  <span className="text-sm text-muted-foreground">
                    — {viewingReview.moderation_reason}
                  </span>
                )}
              </div>

              {/* Customer */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                <p className="font-medium">{viewingReview.customer?.full_name || 'Unknown'}</p>
              </div>

              {/* Ratings */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={viewingReview.overall_rating} />
                    <span className="font-medium">{viewingReview.overall_rating}/5</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Runner</p>
                    {viewingReview.runner_rating ? (
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={viewingReview.runner_rating} size="xs" />
                        <span className="text-sm">{viewingReview.runner_rating}/5</span>
                        {viewingReview.runner && (
                          <span className="text-xs text-muted-foreground">({viewingReview.runner.full_name})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not rated</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tailor</p>
                    {viewingReview.tailor_rating ? (
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={viewingReview.tailor_rating} size="xs" />
                        <span className="text-sm">{viewingReview.tailor_rating}/5</span>
                        {viewingReview.tailor && (
                          <span className="text-xs text-muted-foreground">({viewingReview.tailor.full_name})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not rated</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment */}
              {viewingReview.comment && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Comment</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingReview.comment}</p>
                </div>
              )}

              {/* Moderation info */}
              {viewingReview.moderated_at && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">Moderation History</p>
                  <p className="text-muted-foreground">
                    Moderated on {formatDate(viewingReview.moderated_at)}
                  </p>
                  {viewingReview.moderation_reason && (
                    <p className="text-muted-foreground mt-1">
                      Reason: {viewingReview.moderation_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2 w-full sm:w-auto">
              {viewingReview && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleDeleteClick(viewingReview)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleToggleVisibility(viewingReview, viewingReview.is_visible === false)
                    }}
                    disabled={actionLoading}
                  >
                    {viewingReview.is_visible !== false ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Hide</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Show</>
                    )}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Review Dialog */}
      <Dialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide Review</DialogTitle>
            <DialogDescription>
              Hide the review from {hidingReview?.customer?.full_name || 'this customer'} for order{' '}
              {hidingReview?.order?.order_number}. The review will no longer be publicly visible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="moderation-reason">Moderation Reason *</Label>
              <Textarea
                id="moderation-reason"
                placeholder="Reason for hiding this review..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={3}
                disabled={actionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmHide}
              disabled={actionLoading || !moderationReason.trim()}
            >
              {actionLoading ? 'Hiding...' : 'Hide Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the review from{' '}
              <strong>{deletingReview?.customer?.full_name || 'this customer'}</strong>?
              This action cannot be undone.
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
