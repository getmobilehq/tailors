'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'

export default function SuccessContent({
  sessionId,
  orderNumber,
  orderId,
  payAtDropoff = false,
  isPostal = false,
}: {
  sessionId?: string
  orderNumber?: string
  orderId?: string
  payAtDropoff?: boolean
  isPostal?: boolean
}) {
  const router = useRouter()
  const { clearCart } = useCart()
  const [hasCleared, setHasCleared] = useState(false)

  // A Stripe session means the card went through; an order number with no
  // session is a drop-off order that will be paid at the counter.
  const confirmed = Boolean(sessionId || orderNumber)

  useEffect(() => {
    if (confirmed && !hasCleared) {
      clearCart()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pickup_date')
        localStorage.removeItem('pickup_slot')
        localStorage.removeItem('fulfilment_type')
        localStorage.removeItem('dropoff_date')
      }
      setHasCleared(true)
    } else if (!confirmed) {
      router.push('/book')
    }
  }, [confirmed, clearCart, router, hasCleared])

  if (!confirmed) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl mb-3">Order Confirmed!</h1>

          {orderNumber && (
            <p className="text-sm text-muted-foreground mb-2">Order {orderNumber}</p>
          )}

          <p className="text-muted-foreground mb-8">
            {isPostal
              ? "Thank you for your order. We've emailed you the address to post your items to. Pop a note with your order number in the parcel so we know whose items they are."
              : payAtDropoff
                ? "Thank you for your order. We'll email you the details and the drop-off address. Bring your items in on the day you chose and pay at the counter."
                : "Thank you for your order. We'll send you a confirmation email shortly with your order details. Our expert runner will arrive at your scheduled time to collect your items."}
          </p>

          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href={orderId ? `/orders/${orderId}` : '/orders'}>
                {orderId ? 'View Your Order' : 'View My Orders'}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/">Return Home</Link>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold mb-2">What happens next?</p>
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>✓ You'll receive an order confirmation email</li>
              {isPostal ? (
                <>
                  <li>✓ Post your items to the address in that email</li>
                  <li>✓ We'll let you know as soon as your parcel arrives</li>
                  <li>✓ Our expert tailors will work their magic</li>
                  <li>✓ We'll post them back by Royal Mail with a tracking number</li>
                </>
              ) : payAtDropoff ? (
                <>
                  <li>✓ Bring your items to us on the day you chose</li>
                  <li>✓ We'll take measurements and payment at the counter</li>
                  <li>✓ We'll let you know as soon as they're ready to collect</li>
                </>
              ) : (
                <>
                  <li>✓ Our runner will arrive at your scheduled time</li>
                  <li>✓ They'll take measurements and collect your items</li>
                  <li>✓ Track your order progress in real-time</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
