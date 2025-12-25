'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewFormProps {
  orderId: string
  orderNumber: string
  runnerId: string | null
  runnerName: string | null
  tailorId: string | null
  tailorName: string | null
}

function StarRating({
  value,
  onChange,
  label
}: {
  value: number
  onChange: (rating: number) => void
  label: string
}) {
  const [hoverValue, setHoverValue] = useState(0)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoverValue || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground self-center">
            {value} {value === 1 ? 'star' : 'stars'}
          </span>
        )}
      </div>
    </div>
  )
}

export function ReviewForm({
  orderId,
  orderNumber,
  runnerId,
  runnerName,
  tailorId,
  tailorName
}: ReviewFormProps) {
  const router = useRouter()
  const [runnerRating, setRunnerRating] = useState(0)
  const [tailorRating, setTailorRating] = useState(0)
  const [overallRating, setOverallRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    if (overallRating === 0) {
      toast.error('Please provide an overall rating')
      return
    }

    if (runnerId && runnerRating === 0) {
      toast.error('Please rate your runner')
      return
    }

    if (tailorId && tailorRating === 0) {
      toast.error('Please rate your tailor')
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

      const { error } = await supabase.from('reviews').insert({
        order_id: orderId,
        customer_id: user.id,
        runner_id: runnerId,
        tailor_id: tailorId,
        runner_rating: runnerId ? runnerRating : null,
        tailor_rating: tailorId ? tailorRating : null,
        overall_rating: overallRating,
        comment: comment.trim() || null
      })

      if (error) throw error

      toast.success('Thank you for your review!')
      router.refresh()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      if (error.message?.includes('duplicate')) {
        toast.error('You have already reviewed this order')
      } else {
        toast.error('Failed to submit review. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <CardDescription>
          Share your feedback for order {orderNumber}
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
          {runnerId && runnerName && (
            <StarRating
              value={runnerRating}
              onChange={setRunnerRating}
              label={`Rate ${runnerName} (Runner) *`}
            />
          )}

          {/* Tailor Rating */}
          {tailorId && tailorName && (
            <StarRating
              value={tailorRating}
              onChange={setTailorRating}
              label={`Rate ${tailorName} (Tailor) *`}
            />
          )}

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comments (optional)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting || overallRating === 0}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/orders')}
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            You can edit your review within 7 days of submission
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
