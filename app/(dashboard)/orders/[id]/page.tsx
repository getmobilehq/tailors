import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/orders/status-badge'
import { OrderMessages } from '@/components/orders/order-messages'
import { ReviewForm } from '@/components/orders/review-form'
import { ReviewDisplay } from '@/components/orders/review-display'
import { OrderItemPhotos } from '@/components/orders/order-item-photos'
import { formatPrice, formatDate, formatDateTime } from '@/lib/utils'
import { ArrowLeft, MapPin, Calendar, Package } from 'lucide-react'
import Link from 'next/link'
import { PICKUP_SLOTS } from '@/lib/constants'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        service:services(*)
      ),
      runner:runner_id(full_name, phone, avatar_url),
      tailor:tailor_id(full_name, phone)
    `)
    .eq('id', params.id)
    .single()

  if (!order) {
    notFound()
  }

  // Ensure user owns this order
  if (order.customer_id !== user?.id) {
    redirect('/orders')
  }

  // Fetch review if exists
  const { data: review } = await supabase
    .from('reviews')
    .select('*, customer:customer_id(full_name)')
    .eq('order_id', params.id)
    .single()

  const pickupSlot = PICKUP_SLOTS.find(s => s.id === order.pickup_slot)
  const canReview = (order.status === 'delivered' || order.status === 'completed') && !review

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/orders" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
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
                  Placed {formatDateTime(order.created_at)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="pb-6 border-b last:border-0 space-y-3">
                    {/* Item Info Row */}
                    <div className="flex gap-4">
                      {item.photos && item.photos.length > 0 && (
                        <OrderItemPhotos
                          photos={item.photos}
                          description={item.garment_description}
                          variant="thumbnail"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{item.service?.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.garment_description}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">
                            Note: {item.notes}
                          </p>
                        )}
                        {item.tailor_notes && (
                          <p className="text-sm mt-2 p-2 bg-blue-50 rounded">
                            <span className="font-medium">Tailor notes:</span> {item.tailor_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.price)}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        )}
                      </div>
                    </div>

                    {/* Photo Gallery (if multiple photos) */}
                    {item.photos && item.photos.length > 1 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">
                          All Photos ({item.photos.length})
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
                  <CardTitle>Measurements</CardTitle>
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

            {/* Review Form or Display */}
            {canReview && (
              <ReviewForm
                orderId={order.id}
                orderNumber={order.order_number}
                runnerId={order.runner_id}
                runnerName={order.runner?.full_name || null}
                tailorId={order.tailor_id}
                tailorName={order.tailor?.full_name || null}
              />
            )}

            {review && (
              <ReviewDisplay review={review} showCustomer={false} />
            )}
          </div>

          <div className="space-y-6">
            {/* Pickup Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Pickup
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.pickup_date ? (
                  <>
                    <p className="font-semibold mb-1">{formatDate(order.pickup_date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {pickupSlot?.label} ({pickupSlot?.time})
                    </p>
                    {order.collected_at && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Collected {formatDateTime(order.collected_at)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">To be scheduled</p>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.customer_address.line1}</p>
                {order.customer_address.line2 && (
                  <p className="text-sm">{order.customer_address.line2}</p>
                )}
                <p className="text-sm">
                  {order.customer_address.city} {order.customer_address.postcode}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {order.customer_phone}
                </p>
              </CardContent>
            </Card>

            {/* Runner Info */}
            {order.runner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Runner</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{order.runner.full_name}</p>
                  {order.runner.phone && (
                    <p className="text-sm text-muted-foreground">{order.runner.phone}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <OrderMessages orderId={order.id} currentUserId={user!.id} />

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pickup & Delivery</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
