'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const session = searchParams.get('session_id')
    if (session) {
      setSessionId(session)
      clearCart()
      localStorage.removeItem('pickup_date')
      localStorage.removeItem('pickup_slot')
    } else {
      router.push('/book')
    }
  }, [searchParams, router, clearCart])

  if (!sessionId) {
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
          
          <p className="text-muted-foreground mb-8">
            Thank you for your order. We'll send you a confirmation email shortly with your order details.
            Our expert runner will arrive at your scheduled time to collect your items.
          </p>

          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/orders">View My Orders</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/">Return Home</Link>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold mb-2">What happens next?</p>
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>✓ You'll receive an order confirmation email</li>
              <li>✓ Our runner will arrive at your scheduled time</li>
              <li>✓ They'll take measurements and collect your items</li>
              <li>✓ Track your order progress in real-time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
