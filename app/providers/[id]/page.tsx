'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Star, User, Award } from 'lucide-react'
import { ReviewCard } from '@/components/reviews/ReviewCard'

interface Profile {
  user_id: string
  rating: number | null
  total_reviews: number
  users: {
    full_name: string
    email: string
    role: string
  }
}

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

export default function ProviderProfilePage() {
  const params = useParams()
  const providerId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [providerId])

  async function loadProfile() {
    setLoading(true)
    const supabase = createClient()

    try {
      // Try to load as runner first
      let { data: runnerProfile } = await supabase
        .from('runner_profiles')
        .select(`
          user_id,
          rating,
          total_reviews,
          users!inner(full_name, email, role)
        `)
        .eq('user_id', providerId)
        .single()

      // If not a runner, try tailor
      if (!runnerProfile) {
        const { data: tailorProfile } = await supabase
          .from('tailor_profiles')
          .select(`
            user_id,
            rating,
            total_reviews,
            users!inner(full_name, email, role)
          `)
          .eq('user_id', providerId)
          .single()

        runnerProfile = tailorProfile
      }

      setProfile(runnerProfile)

      if (runnerProfile) {
        // Load reviews for this provider
        const isRunner = runnerProfile.users.role === 'runner'
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            id,
            overall_rating,
            runner_rating,
            tailor_rating,
            comment,
            created_at,
            customer:customer_id(full_name)
          `)
          .eq(isRunner ? 'runner_id' : 'tailor_id', providerId)
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(20)

        setReviews(reviewsData || [])
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  function StarDisplay({ rating }: { rating: number }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-center text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Provider not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isRunner = profile.users.role === 'runner'
  const averageRating = profile.rating || 0

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.users.full_name}</CardTitle>
                <CardDescription className="text-lg">
                  {isRunner ? 'Runner' : 'Tailor'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold mb-2">
                {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              </div>
              <StarDisplay rating={averageRating} />
              <p className="text-sm text-muted-foreground mt-2">Average Rating</p>
            </div>

            {/* Total Reviews */}
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold mb-2">{profile.total_reviews}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>

            {/* Badge */}
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Award className="h-12 w-12 text-yellow-500 mb-2" />
              <p className="text-sm font-medium">
                {averageRating >= 4.5 ? 'Top Rated' : 'Verified Provider'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Customer Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No reviews yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showRunnerRating={isRunner}
                showTailorRating={!isRunner}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
