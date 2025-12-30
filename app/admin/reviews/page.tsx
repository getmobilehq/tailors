'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Star,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Review {
  id: string
  order_id: string
  overall_rating: number
  runner_rating: number | null
  tailor_rating: number | null
  comment: string | null
  is_visible: boolean
  moderated_at: string | null
  moderation_reason: string | null
  created_at: string
  customer: {
    full_name: string
    email: string
  }
  runner: {
    full_name: string
  } | null
  tailor: {
    full_name: string
  } | null
}

interface ReviewStats {
  totalReviews: number
  visibleReviews: number
  hiddenReviews: number
  averageRating: number
}

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    visibleReviews: 0,
    hiddenReviews: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [moderationReason, setModerationReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [searchQuery, visibilityFilter, reviews])

  async function loadReviews() {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:customer_id(full_name, email),
          runner:runner_id(full_name),
          tailor:tailor_id(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(reviewData: Review[]) {
    const visible = reviewData.filter(r => r.is_visible).length
    const hidden = reviewData.filter(r => !r.is_visible).length
    const avgRating = reviewData.length > 0
      ? reviewData.reduce((sum, r) => sum + r.overall_rating, 0) / reviewData.length
      : 0

    setStats({
      totalReviews: reviewData.length,
      visibleReviews: visible,
      hiddenReviews: hidden,
      averageRating: avgRating,
    })
  }

  function filterReviews() {
    let filtered = reviews

    // Filter by visibility
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(r =>
        visibilityFilter === 'visible' ? r.is_visible : !r.is_visible
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => {
        const customerName = r.customer?.full_name?.toLowerCase() || ''
        const customerEmail = r.customer?.email?.toLowerCase() || ''
        const comment = r.comment?.toLowerCase() || ''

        return (
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          comment.includes(query)
        )
      })
    }

    setFilteredReviews(filtered)
  }

  function StarDisplay({ rating }: { rating: number }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  async function toggleVisibility(review: Review, hide: boolean) {
    if (hide && !moderationReason.trim()) {
      toast.error('Please provide a reason for hiding this review')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          is_visible: !hide,
          moderation_reason: hide ? moderationReason : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to moderate review')
      }

      toast.success(hide ? 'Review hidden' : 'Review made visible')
      setSelectedReview(null)
      setModerationReason('')
      loadReviews()
    } catch (error: any) {
      console.error('Moderate review error:', error)
      toast.error(error.message || 'Failed to moderate review')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Review Management</h1>
        <p className="text-muted-foreground">Monitor and moderate customer reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visible</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visibleReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hiddenReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>View and moderate customer feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or comment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="visible">Visible Only</SelectItem>
                <SelectItem value="hidden">Hidden Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadReviews} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.customer?.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {review.customer?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarDisplay rating={review.overall_rating} />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{review.comment || 'No comment'}</p>
                      </TableCell>
                      <TableCell>
                        {review.runner && <div className="text-sm">{review.runner.full_name}</div>}
                        {review.tailor && <div className="text-sm">{review.tailor.full_name}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge className={review.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {review.is_visible ? 'Visible' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(review.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {review.is_visible ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReview(review)}
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Hide Review</DialogTitle>
                                <DialogDescription>
                                  Provide a reason for hiding this review
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reason">Reason *</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Inappropriate content, spam, etc..."
                                    value={moderationReason}
                                    onChange={(e) => setModerationReason(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                <Button
                                  onClick={() => toggleVisibility(review, true)}
                                  disabled={processing}
                                  className="w-full"
                                >
                                  {processing ? 'Processing...' : 'Hide Review'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVisibility(review, false)}
                            disabled={processing}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Show
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredReviews.length} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
