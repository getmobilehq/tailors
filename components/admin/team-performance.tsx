import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, Package, TrendingUp } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface TeamMember {
  id: string
  full_name: string
  role: string
  rating?: number
  total_reviews?: number
}

interface Order {
  id: string
  status: string
  total: number
  runner_id?: string
  tailor_id?: string
}

interface TeamPerformanceProps {
  runners: TeamMember[]
  tailors: TeamMember[]
  orders: Order[]
}

export function TeamPerformance({ runners, tailors, orders }: TeamPerformanceProps) {
  const runnerStats = runners.map(runner => {
    const runnerOrders = orders.filter(o => o.runner_id === runner.id)
    const completedOrders = runnerOrders.filter(o => ['completed', 'delivered'].includes(o.status))
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0)

    return {
      ...runner,
      totalOrders: runnerOrders.length,
      completedOrders: completedOrders.length,
      revenue,
    }
  }).sort((a, b) => b.completedOrders - a.completedOrders)

  const tailorStats = tailors.map(tailor => {
    const tailorOrders = orders.filter(o => o.tailor_id === tailor.id)
    const completedOrders = tailorOrders.filter(o => ['completed', 'delivered'].includes(o.status))
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0)

    return {
      ...tailor,
      totalOrders: tailorOrders.length,
      completedOrders: completedOrders.length,
      revenue,
    }
  }).sort((a, b) => b.completedOrders - a.completedOrders)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Runner Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Runner Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runnerStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No runners yet</p>
            ) : (
              runnerStats.map((runner, index) => (
                <div key={runner.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{runner.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{runner.full_name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{runner.completedOrders} completed</span>
                      {runner.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {runner.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatPrice(runner.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{runner.totalOrders} total</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tailor Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tailor Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tailorStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tailors yet</p>
            ) : (
              tailorStats.map((tailor, index) => (
                <div key={tailor.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{tailor.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{tailor.full_name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{tailor.completedOrders} completed</span>
                      {tailor.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {tailor.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatPrice(tailor.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{tailor.totalOrders} total</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
