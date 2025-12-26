import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, User } from 'lucide-react'
import type { Review } from '@/lib/types'

interface ReviewDisplayProps {
  review: Review & {
    customer?: {
      full_name: string
    }
  }
  showCustomer?: boolean
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function ReviewDisplay({ review, showCustomer = true }: ReviewDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              {showCustomer && (
                <p className="font-medium">{review.customer?.full_name || 'Customer'}</p>
              )}
              <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StarDisplay rating={review.overall_rating} />
            <span className="text-sm font-medium">{review.overall_rating}.0</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Individual Ratings */}
        <div className="grid grid-cols-2 gap-4">
          {(review as any).runner_rating && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Runner</p>
              <StarDisplay rating={(review as any).runner_rating} />
            </div>
          )}
          {(review as any).tailor_rating && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tailor</p>
              <StarDisplay rating={(review as any).tailor_rating} />
            </div>
          )}
        </div>

        {/* Comment */}
        {review.comment && (
          <div>
            <p className="text-sm leading-relaxed">{review.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component to show average rating with stars
export function AverageRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-2">
      <StarDisplay rating={Math.round(rating)} />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  )
}
