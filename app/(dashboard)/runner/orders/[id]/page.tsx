import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/orders/status-badge'
import { RunnerActions } from '@/components/runner/runner-actions'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { OrderMessages } from '@/components/orders/order-messages'
import { formatPrice, formatDate } from '@/lib/utils'
import { ArrowLeft, MapPin, Calendar, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { PICKUP_SLOTS } from '@/lib/constants'

export default async function RunnerOrderPage({ params }: { params: { id: string } }) {
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

  if (profile?.role !== 'runner') {
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
      customer:customer_id(full_name, phone, email)
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

  const pickupSlot = PICKUP_SLOTS.find(s => s.id === order.pickup_slot)
  const canAccept = order.status === 'booked' && !order.runner_id
  const isAssigned = order.runner_id === user.id

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/runner" className="gap-2">
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
            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items to Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="pb-4 border-b last:border-0">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold">{item.service?.name}</h4>
                      <span className="font-semibold">{formatPrice(item.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.garment_description}
                    </p>
                    {item.photos && item.photos.length > 0 && (
                      <div className="flex gap-2">
                        {item.photos.map((photo: string, i: number) => (
                          <img
                            key={i}
                            src={photo}
                            alt=""
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">
                        <span className="font-medium">Notes:</span> {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {order.customer_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.customer_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Measurements */}
            {order.measurements && (
              <Card>
                <CardHeader>
                  <CardTitle>Recorded Measurements</CardTitle>
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
                </CardContent>
              </Card>
            )}

            {/* Runner Actions */}
            {isAssigned && (
              <RunnerActions order={order} />
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
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{order.customer?.full_name}</p>
                  {order.customer?.phone && (
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <Phone className="h-3 w-3" />
                      {order.customer.phone}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

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
                <p className="text-sm mb-3">
                  {order.customer_address.city} {order.customer_address.postcode}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${order.customer_address.line1}, ${order.customer_address.city}, ${order.customer_address.postcode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Maps
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Messages */}
            <OrderMessages orderId={order.id} currentUserId={user!.id} />

            {/* Order Total */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Already paid</p>
                </div>
              </CardContent>
            </Card>

            {/* Accept Button */}
            {canAccept && (
              <form action={`/api/runner/accept`} method="POST">
                <input type="hidden" name="order_id" value={order.id} />
                <Button type="submit" className="w-full" size="lg">
                  Accept This Job
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
