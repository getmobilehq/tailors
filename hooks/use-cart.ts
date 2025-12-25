'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Service, CartItem } from '@/lib/types'
import { DELIVERY_FEE } from '@/lib/constants'

interface CartStore {
  items: CartItem[]
  addItem: (service: Service) => void
  updateItem: (index: number, updates: Partial<CartItem>) => void
  removeItem: (index: number) => void
  clearCart: () => void
  subtotal: () => number
  total: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (service) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              service,
              garment_description: '',
              quantity: 1,
              photos: [], // Photos won't be persisted to localStorage
              notes: '',
            },
          ],
        }))
      },

      updateItem: (index, updates) => {
        set((state) => {
          const newItems = state.items.map((item, i) => {
            if (i === index) {
              // Don't store photos in localStorage to avoid quota issues
              const { photos, ...safeUpdates } = updates
              return { ...item, ...safeUpdates, photos: photos || item.photos }
            }
            return item
          })
          return { items: newItems }
        })
      },

      removeItem: (index) => {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }))
      },

      clearCart: () => set({ items: [] }),

      subtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.service.price * item.quantity,
          0
        )
      },

      total: () => {
        const items = get().items
        if (items.length === 0) return 0
        return get().subtotal() + DELIVERY_FEE
      },
    }),
    {
      name: 'tailorspace-cart',
    }
  )
)
