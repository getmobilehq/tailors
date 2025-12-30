'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  runner_id: string | null
  tailor_id: string | null
  users: {
    full_name: string
  }
  runner?: {
    full_name: string
  }
  tailor?: {
    full_name: string
  }
}

export default function ReviewOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [overallRating, setOverallRating] = useState(0)
  const [runnerRating, setRunnerRating] = useState(0)
  const [tailorRating, setTailorRating] = useState(0)
  const [comment, setComment] = useState('')
  const [canReview, setCanReview] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  async function loadOrder() {
    setLoading(true)
    const supabase = createClient()

    try {
      // Get order with runner and tailor info
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users:user_id(full_name),
          runner:runner_id(full_name),
          tailor:tailor_id(full_name)
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      setOrder(orderData)

      // Check if order can be reviewed
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setCanReview(false)
        return
      }

      // Check if order is completed/delivered
      const isCompleted = ['completed', 'delivered'].includes(orderData.status)

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .single()

      setCanReview(isCompleted && !existingReview && orderData.user_id === user.user.id)

    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (overallRating === 0) {
      toast.error('Please provide an overall rating')
      return
    }

    if (order?.runner_id && runnerRating === 0) {
      toast.error('Please rate the runner')
      return
    }

    if (order?.tailor_id && tailorRating === 0) {
      toast.error('Please rate the tailor')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to submit a review')
        return
      }

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          overall_rating: overallRating,
          runner_rating: order?.runner_id ? runnerRating : null,
          tailor_rating: order?.tailor_id ? tailorRating : null,
          comment: comment.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast.success('Review submitted successfully!')
      router.push(`/orders/${orderId}`)
    } catch (error: any) {
      console.error('Submit review error:', error)
      toast.error(error.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  function StarRating({ value, onChange, label }: { value: number; onChange: (rating: number) => void; label: string }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {value > 0 && (
          <p className="text-sm text-muted-foreground">
            {value === 1 && 'Poor'}
            {value === 2 && 'Fair'}
            {value === 3 && 'Good'}
            {value === 4 && 'Very Good'}
            {value === 5 && 'Excellent'}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-center text-muted-foreground">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">Order not found</p>
            <div className="text-center">
              <Link href="/orders">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canReview) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              {order.status !== 'completed' && order.status !== 'delivered'
                ? 'You can only review completed orders'
                : 'This order has already been reviewed'}
            </p>
            <div className="text-center">
              <Link href={`/orders/${orderId}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Order
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Your Experience</CardTitle>
          <CardDescription>
            Share your feedback about this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall Experience *"
            />

            {/* Runner Rating */}
            {order.runner_id && order.runner && (
              <div className="pt-4 border-t">
                <StarRating
                  value={runnerRating}
                  onChange={setRunnerRating}
                  label={`Rate the Runner (${order.runner.full_name}) *`}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Collection and delivery service
                </p>
              </div>
            )}

            {/* Tailor Rating */}
            {order.tailor_id && order.tailor && (
              <div className="pt-4 border-t">
                <StarRating
                  value={tailorRating}
                  onChange={setTailorRating}
                  label={`Rate the Tailor (${order.tailor.full_name}) *`}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Quality of alterations
                </p>
              </div>
            )}

            {/* Comment */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="comment">Additional Comments (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/1000 characters
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting || overallRating === 0}
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Link href={`/orders/${orderId}`}>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
