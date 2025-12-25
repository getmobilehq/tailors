'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils'
import { ShoppingBag } from 'lucide-react'
import { DELIVERY_FEE } from '@/lib/constants'

export function CartSummary() {
  const { items, subtotal, total } = useCart()

  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBag className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.service.name}</span>
                <span>{formatPrice(item.service.price * item.quantity)}</span>
              </div>
              {item.garment_description && (
                <p className="text-xs text-muted-foreground">
                  {item.garment_description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Pickup & Delivery</span>
            <span>{formatPrice(DELIVERY_FEE)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total())}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
