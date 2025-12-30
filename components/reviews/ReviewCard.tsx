import { Star } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'

interface Review {
  id: string
  overall_rating: number
  runner_rating: number | null
  tailor_rating: number | null
  comment: string | null
  created_at: string
  customer: {
    full_name: string
  }
}

interface ReviewCardProps {
  review: Review
  showRunnerRating?: boolean
  showTailorRating?: boolean
}

export function ReviewCard({ review, showRunnerRating, showTailorRating }: ReviewCardProps) {
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Customer and Date */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{review.customer.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(review.created_at), 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {/* Ratings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall:</span>
              <StarDisplay rating={review.overall_rating} />
            </div>

            {showRunnerRating && review.runner_rating && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Runner:</span>
                <StarDisplay rating={review.runner_rating} />
              </div>
            )}

            {showTailorRating && review.tailor_rating && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tailor:</span>
                <StarDisplay rating={review.tailor_rating} />
              </div>
            )}
          </div>

          {/* Comment */}
          {review.comment && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-700">{review.comment}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
