'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Star, TrendingUp, Users, MessageSquare } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { subDays, format } from 'date-fns'

interface AnalyticsData {
  totalReviews: number
  averageOverallRating: number
  averageRunnerRating: number
  averageTailorRating: number
  ratingDistribution: { rating: number; count: number }[]
  topRatedRunners: { id: string; name: string; rating: number; reviews: number }[]
  topRatedTailors: { id: string; name: string; rating: number; reviews: number }[]
  recentTrend: { date: string; count: number; avgRating: number }[]
}

export default function ReviewAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalReviews: 0,
    averageOverallRating: 0,
    averageRunnerRating: 0,
    averageTailorRating: 0,
    ratingDistribution: [],
    topRatedRunners: [],
    topRatedTailors: [],
    recentTrend: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  async function loadAnalytics() {
    setLoading(true)
    const supabase = createClient()
    const days = parseInt(timeRange)
    const startDate = subDays(new Date(), days)

    try {
      // Fetch all reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_visible', true)
        .gte('created_at', startDate.toISOString())

      if (!reviews || reviews.length === 0) {
        setLoading(false)
        return
      }

      // Calculate averages
      const avgOverall = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
      const runnerReviews = reviews.filter(r => r.runner_rating !== null)
      const avgRunner = runnerReviews.length > 0
        ? runnerReviews.reduce((sum, r) => sum + (r.runner_rating || 0), 0) / runnerReviews.length
        : 0
      const tailorReviews = reviews.filter(r => r.tailor_rating !== null)
      const avgTailor = tailorReviews.length > 0
        ? tailorReviews.reduce((sum, r) => sum + (r.tailor_rating || 0), 0) / tailorReviews.length
        : 0

      // Rating distribution
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: reviews.filter(r => r.overall_rating === rating).length,
      }))

      // Get runner profiles with ratings
      const { data: runners } = await supabase
        .from('runner_profiles')
        .select('user_id, rating, total_reviews, users(full_name)')
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .limit(5)

      const topRunners = (runners || []).map((r: any) => ({
        id: r.user_id,
        name: r.users?.full_name || 'Unknown',
        rating: r.rating || 0,
        reviews: r.total_reviews,
      }))

      // Get tailor profiles with ratings
      const { data: tailors } = await supabase
        .from('tailor_profiles')
        .select('user_id, rating, total_reviews, users(full_name)')
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .limit(5)

      const topTailors = (tailors || []).map((t: any) => ({
        id: t.user_id,
        name: t.users?.full_name || 'Unknown',
        rating: t.rating || 0,
        reviews: t.total_reviews,
      }))

      // Calculate daily trend
      const dayGroups = new Map<string, { count: number; totalRating: number }>()
      reviews.forEach(review => {
        const date = format(new Date(review.created_at), 'MMM dd')
        const existing = dayGroups.get(date) || { count: 0, totalRating: 0 }
        dayGroups.set(date, {
          count: existing.count + 1,
          totalRating: existing.totalRating + review.overall_rating,
        })
      })

      const trend = Array.from(dayGroups.entries())
        .map(([date, stats]) => ({
          date,
          count: stats.count,
          avgRating: stats.totalRating / stats.count,
        }))
        .slice(-14) // Last 14 days

      setData({
        totalReviews: reviews.length,
        averageOverallRating: avgOverall,
        averageRunnerRating: avgRunner,
        averageTailorRating: avgTailor,
        ratingDistribution: distribution,
        topRatedRunners: topRunners,
        topRatedTailors: topTailors,
        recentTrend: trend,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
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
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Review Analytics</h1>
          <p className="text-muted-foreground">Customer feedback insights and trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalReviews}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.averageOverallRating > 0 ? data.averageOverallRating.toFixed(1) : 'N/A'}
                </div>
                <StarDisplay rating={data.averageOverallRating} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Runner Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.averageRunnerRating > 0 ? data.averageRunnerRating.toFixed(1) : 'N/A'}
                </div>
                <StarDisplay rating={data.averageRunnerRating} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tailor Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.averageTailorRating > 0 ? data.averageTailorRating.toFixed(1) : 'N/A'}
                </div>
                <StarDisplay rating={data.averageTailorRating} />
              </CardContent>
            </Card>
          </div>

          {/* Rating Distribution */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>Breakdown of customer ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.ratingDistribution.reverse().map((item) => {
                  const maxCount = Math.max(...data.ratingDistribution.map(d => d.count), 1)
                  const width = (item.count / maxCount) * 100

                  return (
                    <div key={item.rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-24">
                        <span className="text-sm font-medium">{item.rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-blue-500 h-6 rounded-full flex items-center justify-end px-2"
                            style={{ width: `${width}%` }}
                          >
                            {item.count > 0 && (
                              <span className="text-xs font-medium text-white">
                                {item.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Rated Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Runners</CardTitle>
                <CardDescription>Highest rated runners by average score</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topRatedRunners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No runners rated yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.topRatedRunners.map((runner, index) => (
                      <div key={runner.id} className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{runner.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StarDisplay rating={runner.rating} />
                            <span className="text-xs text-muted-foreground">
                              ({runner.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="text-lg font-bold">{runner.rating.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Rated Tailors</CardTitle>
                <CardDescription>Highest rated tailors by average score</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topRatedTailors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tailors rated yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.topRatedTailors.map((tailor, index) => (
                      <div key={tailor.id} className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tailor.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StarDisplay rating={tailor.rating} />
                            <span className="text-xs text-muted-foreground">
                              ({tailor.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="text-lg font-bold">{tailor.rating.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Trend */}
          {data.recentTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Review Activity</CardTitle>
                <CardDescription>Daily reviews and average ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-2">
                  {data.recentTrend.map((day, index) => {
                    const maxCount = Math.max(...data.recentTrend.map(d => d.count), 1)
                    const height = (day.count / maxCount) * 100

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '0' }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count} reviews ({day.avgRating.toFixed(1)} ⭐)
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          {day.date}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
