export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/orders/status-badge'
import { RunnerActions } from '@/components/runner/runner-actions'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { OrderMessages } from '@/components/orders/order-messages'
import { OrderItemPhotos } from '@/components/orders/order-item-photos'
import { formatPrice, formatDate } from '@/lib/utils'
import { ArrowLeft, MapPin, Calendar, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { PICKUP_SLOTS, RUNNER_FEE_PER_JOB } from '@/lib/constants'

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
        service:services(*),
        tailor:tailor_id(full_name, phone)
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

  // Group items by tailor so the runner sees one stop per tailor.
  const tailorStops = (() => {
    const groups = new Map<string, { tailor: any; items: any[] }>()
    for (const item of order.items || []) {
      const key = item.tailor_id || '__unassigned__'
      if (!groups.has(key)) {
        groups.set(key, { tailor: item.tailor, items: [] })
      }
      groups.get(key)!.items.push(item)
    }
    return Array.from(groups.entries()).map(([id, g]) => ({ id, ...g }))
  })()

  const showDropOffStops = ['collected', 'in_progress'].includes(order.status)
  const showPickupStops = ['ready', 'out_for_delivery'].includes(order.status)

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
                  <div key={item.id} className="pb-6 border-b last:border-0 space-y-3">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold">{item.service?.name}</h4>
                      <span className="font-semibold">{formatPrice(item.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.garment_description}
                    </p>
                    {item.photos && item.photos.length > 0 && (
                      <div>
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

            {/* Drop-off / Pickup stops grouped by tailor */}
            {isAssigned && (showDropOffStops || showPickupStops) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {showDropOffStops ? 'Drop-off Stops' : 'Pickup Stops'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tailorStops.map((stop, idx) => {
                    const isUnassigned = stop.id === '__unassigned__'
                    return (
                      <div key={stop.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Stop {idx + 1}</p>
                            <p className="font-semibold">
                              {isUnassigned
                                ? 'Unassigned — admin to allocate'
                                : stop.tailor?.full_name || 'Tailor'}
                            </p>
                            {!isUnassigned && stop.tailor?.phone && (
                              <a
                                href={`tel:${stop.tailor.phone}`}
                                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                <Phone className="h-3 w-3" />
                                {stop.tailor.phone}
                              </a>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-muted">
                            {stop.items.length} item{stop.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                          {stop.items.map((it: any) => (
                            <li key={it.id} className="flex justify-between">
                              <span>
                                {it.service?.name} — {it.garment_description}
                              </span>
                              {showPickupStops && (
                                <span
                                  className={
                                    it.status === 'done'
                                      ? 'text-green-600'
                                      : 'text-amber-600'
                                  }
                                >
                                  {it.status === 'done' ? 'Ready' : 'Not ready'}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
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

            {/* Your Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order total (paid by customer)</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Runner fee per job</span>
                  <span className="font-medium text-emerald-600">{formatPrice(RUNNER_FEE_PER_JOB)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">You earn</span>
                    <span className="text-xl font-bold text-emerald-600">{formatPrice(RUNNER_FEE_PER_JOB)}</span>
                  </div>
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
