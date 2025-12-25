import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/orders/status-badge'
import { AdminOrderActions } from '@/components/admin/admin-order-actions'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { OrderMessages } from '@/components/orders/order-messages'
import { formatPrice, formatDate, formatDateTime } from '@/lib/utils'
import { ArrowLeft, MapPin, Calendar, Package, User } from 'lucide-react'
import Link from 'next/link'
import { PICKUP_SLOTS } from '@/lib/constants'

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
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

  if (profile?.role !== 'admin') {
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
      runner:runner_id(full_name, phone, email),
      tailor:tailor_id(full_name, phone, email),
      payment:payments(*)
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

  // Get available runners and tailors
  const { data: runners } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'runner')
    .eq('active', true)

  const { data: tailors } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'tailor')
    .eq('active', true)

  const pickupSlot = PICKUP_SLOTS.find(s => s.id === order.pickup_slot)

  return (
    <div className="max-w-7xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/admin" className="gap-2">
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
              <CardContent className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    {item.photos?.[0] && (
                      <img
                        src={item.photos[0]}
                        alt={item.garment_description}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.service?.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.garment_description}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground">
                          Customer note: {item.notes}
                        </p>
                      )}
                      {item.tailor_notes && (
                        <p className="text-sm mt-2 p-2 bg-blue-50 rounded">
                          Tailor notes: {item.tailor_notes}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.status === 'done' ? 'bg-green-100 text-green-800' :
                          item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price)}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      )}
                    </div>
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
                        <p className="font-semibold">{value} cm</p>
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

            {/* Admin Actions */}
            <AdminOrderActions
              order={order}
              runners={runners || []}
              tailors={tailors || []}
            />
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

            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-1">{order.customer?.full_name}</p>
                <p className="text-sm text-muted-foreground mb-1">{order.customer?.email}</p>
                {order.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                )}
              </CardContent>
            </Card>

            {/* Runner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Runner</CardTitle>
              </CardHeader>
              <CardContent>
                {order.runner ? (
                  <>
                    <p className="font-medium mb-1">{order.runner.full_name}</p>
                    {order.runner.phone && (
                      <p className="text-sm text-muted-foreground">{order.runner.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Tailor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tailor</CardTitle>
              </CardHeader>
              <CardContent>
                {order.tailor ? (
                  <>
                    <p className="font-medium mb-1">{order.tailor.full_name}</p>
                    {order.tailor.phone && (
                      <p className="text-sm text-muted-foreground">{order.tailor.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned</p>
                )}
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
              </CardContent>
            </Card>

            {/* Messages */}
            <OrderMessages orderId={order.id} currentUserId={user!.id} />

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
                {order.payment && order.payment[0] && (
                  <p className="text-sm text-green-600">
                    ✓ Payment {order.payment[0].status}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
