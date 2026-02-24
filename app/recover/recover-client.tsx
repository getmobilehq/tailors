'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import type { SavedCartItem } from '@/lib/types'

interface RecoverClientProps {
  cartItems: SavedCartItem[]
  bookingStep: string
  pickupDate: string | null
  pickupSlot: string | null
}

const stepRoutes: Record<string, string> = {
  services: '/book',
  items: '/book/items',
  schedule: '/book/schedule',
  checkout: '/book/checkout',
}

export default function RecoverClient({
  cartItems,
  bookingStep,
  pickupDate,
  pickupSlot,
}: RecoverClientProps) {
  const router = useRouter()
  const { clearCart, addItem } = useCart()
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    async function restore() {
      // Clear existing cart first
      clearCart()

      // Re-add each item from saved cart
      for (const item of cartItems) {
        addItem({
          id: item.service_id,
          name: item.service_name,
          price: item.service_price,
          category: '',
          base_price: item.service_price * 100,
          description: null,
          estimated_days: 0,
          active: true,
          popular: false,
          sort_order: 0,
          created_at: '',
          updated_at: '',
        })
      }

      // Restore pickup info
      if (pickupDate) {
        localStorage.setItem('pickup_date', pickupDate)
      }
      if (pickupSlot) {
        localStorage.setItem('pickup_slot', pickupSlot)
      }

      // Small delay to let Zustand persist
      await new Promise((resolve) => setTimeout(resolve, 500))

      setRestoring(false)

      // Navigate to the step the user was on
      const route = stepRoutes[bookingStep] || '/book'
      router.push(route)
    }

    restore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Restoring Your Cart</h1>
          <p className="text-muted-foreground">
            Hold on, we're getting your items back...
          </p>
        </div>
      </div>
    )
  }

  return null
}
