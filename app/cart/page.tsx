'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import { Loader2 } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { items } = useCart()

  useEffect(() => {
    // If cart is empty, go to booking start
    if (items.length === 0) {
      router.push('/book')
      return
    }

    // Check if all items have descriptions (completed items step)
    const allItemsHaveDescriptions = items.every(
      item => item.garment_description && item.garment_description.trim() !== ''
    )

    // Check if pickup details are set
    const pickupDate = localStorage.getItem('pickup_date')
    const pickupSlot = localStorage.getItem('pickup_slot')
    const hasPickupDetails = pickupDate && pickupSlot

    // Redirect to appropriate step based on cart state
    if (!allItemsHaveDescriptions) {
      // Items need descriptions
      router.push('/book/items')
    } else if (!hasPickupDetails) {
      // Need to schedule pickup
      router.push('/book/schedule')
    } else {
      // Ready for checkout
      router.push('/book/checkout')
    }
  }, [items, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading your cart...</p>
      </div>
    </div>
  )
}
