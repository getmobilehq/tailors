'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'
import { useUser } from '@/hooks/use-user'
import type { SavedCartItem } from '@/lib/types'

function getBookingStep(pathname: string): string {
  if (pathname === '/book/checkout') return 'checkout'
  if (pathname === '/book/schedule') return 'schedule'
  if (pathname === '/book/items') return 'items'
  return 'services'
}

export function useCartSync() {
  const { user } = useUser()
  const pathname = usePathname()
  const items = useCart((s) => s.items)
  const addItem = useCart((s) => s.addItem)
  const clearCart = useCart((s) => s.clearCart)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const hasRestoredRef = useRef(false)
  const isSyncingRef = useRef(false)

  // Sync cart to server (debounced)
  const syncToServer = useCallback(async () => {
    if (!user || isSyncingRef.current) return
    isSyncingRef.current = true

    try {
      const savedItems: SavedCartItem[] = items.map((item) => ({
        service_id: item.service.id,
        service_name: item.service.name,
        service_price: item.service.price,
        garment_description: item.garment_description,
        quantity: item.quantity,
        notes: item.notes,
      }))

      const pickupDate = typeof window !== 'undefined'
        ? localStorage.getItem('pickup_date')
        : null
      const pickupSlot = typeof window !== 'undefined'
        ? localStorage.getItem('pickup_slot')
        : null

      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: savedItems,
          booking_step: getBookingStep(pathname),
          pickup_date: pickupDate,
          pickup_slot: pickupSlot,
        }),
      })
    } catch (error) {
      console.error('Cart sync failed:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [user, items, pathname])

  // Restore cart from server on mount if local cart is empty
  useEffect(() => {
    if (!user || hasRestoredRef.current) return
    hasRestoredRef.current = true

    if (items.length > 0) {
      // Local cart has items — push to server instead of pulling
      syncToServer()
      return
    }

    async function restoreFromServer() {
      try {
        const res = await fetch('/api/cart/sync')
        const { data } = await res.json()

        if (data && data.items && data.items.length > 0) {
          clearCart()
          for (const item of data.items) {
            addItem({
              id: item.service_id,
              name: item.service_name,
              price: item.service_price,
              // Fill remaining Service fields with defaults for display
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
          if (data.pickup_date) {
            localStorage.setItem('pickup_date', data.pickup_date)
          }
          if (data.pickup_slot) {
            localStorage.setItem('pickup_slot', data.pickup_slot)
          }
        }
      } catch (error) {
        console.error('Cart restore failed:', error)
      }
    }

    restoreFromServer()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced sync on cart changes
  useEffect(() => {
    if (!user || !hasRestoredRef.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (items.length > 0) {
        syncToServer()
      } else {
        // Cart was cleared — delete server cart
        fetch('/api/cart/sync', { method: 'DELETE' }).catch(console.error)
      }
    }, 2000)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [items, user, syncToServer])
}
