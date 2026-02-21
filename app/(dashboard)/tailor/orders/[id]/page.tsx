export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/orders/status-badge'
import { TailorActions } from '@/components/tailor/tailor-actions'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { OrderMessages } from '@/components/orders/order-messages'
import { OrderItemPhotos } from '@/components/orders/order-item-photos'
import { formatPrice, formatDate } from '@/lib/utils'
import { TAILOR_PAYOUT_RATE } from '@/lib/constants'
import { ArrowLeft, User, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function TailorOrderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'tailor') {
    redirect('/orders')
  }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        service:services(*)
      ),
      customer:customer_id(full_name, phone, email),
      runner:runner_id(full_name, phone)
    `)
    .eq('id', params.id)
    .single()

  if (!order) {
    notFound()
  }

  // Fetch timeline
  const { data: timeline } = await supabase
    .from('order_timeline')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: true })

  const isAssigned = order.tailor_id === user.id

  return (
    <div className="max-w-7xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/tailor" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="grid gap-6">
        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">
                  Order {order.order_number}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Placed {formatDate(order.created_at)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Items to Work On */}
            <Card>
              <CardHeader>
                <CardTitle>Items to Alter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="pb-4 border-b last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{item.service?.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.status === 'done' ? 'bg-green-100 text-green-800' :
                            item.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'in_progress' ? 'In Progress' :
                             item.status === 'done' ? 'Done' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.garment_description}
                        </p>
                        {item.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            <span className="font-medium">Customer notes:</span> {item.notes}
                          </p>
                        )}
                        {item.tailor_notes && (
                          <p className="text-sm mt-2 p-2 bg-blue-50 rounded">
                            <span className="font-medium">Your notes:</span> {item.tailor_notes}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold ml-4">{formatPrice(item.price)}</span>
                    </div>

                    {item.photos && item.photos.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2 text-muted-foreground">
                          Customer Photos ({item.photos.length})
                        </p>
                        <OrderItemPhotos
                          photos={item.photos}
                          description={item.garment_description}
                          variant="gallery"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Measurements */}
            {order.measurements && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Measurements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(order.measurements).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground capitalize">{key}</p>
                        <p className="font-semibold">{String(value)} cm</p>
                      </div>
                    ))}
                  </div>
                  {order.runner_notes && (
                    <p className="mt-4 text-sm p-3 bg-muted rounded-lg">
                      <span className="font-medium">Runner notes:</span> {order.runner_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tailor Actions */}
            {isAssigned && (
              <TailorActions order={order} />
            )}
          </div>

          <div className="space-y-6">
            {/* Order Journey Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline currentStatus={order.status} timeline={timeline || []} />
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-1">{order.customer?.full_name}</p>
                {order.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                )}
              </CardContent>
            </Card>

            {/* Runner Info */}
            {order.runner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Runner</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-1">{order.runner.full_name}</p>
                  {order.runner.phone && (
                    <p className="text-sm text-muted-foreground">{order.runner.phone}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Ordered</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
                {order.collected_at && (
                  <div>
                    <p className="text-muted-foreground">Collected</p>
                    <p className="font-medium">{formatDate(order.collected_at)}</p>
                  </div>
                )}
                {order.estimated_completion && (
                  <div>
                    <p className="text-muted-foreground">Est. Completion</p>
                    <p className="font-medium">{formatDate(order.estimated_completion)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <OrderMessages orderId={order.id} currentUserId={user!.id} />

            {/* Your Payout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Payout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your share ({Math.round(TAILOR_PAYOUT_RATE * 100)}%)</span>
                  <span className="font-medium text-violet-600">{formatPrice(order.subtotal * TAILOR_PAYOUT_RATE)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">You earn</span>
                    <span className="text-xl font-bold text-violet-600">{formatPrice(order.subtotal * TAILOR_PAYOUT_RATE)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
