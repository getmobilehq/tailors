'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CartSummary } from '@/components/booking/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { PICKUP_SLOTS } from '@/lib/constants'
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SchedulePage() {
  const router = useRouter()
  const { items } = useCart()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')

  if (items.length === 0) {
    router.push('/book')
    return null
  }

  // Generate next 7 days (excluding Sundays)
  const availableDates = Array.from({ length: 10 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1) // Start from tomorrow
    return date
  }).filter(date => date.getDay() !== 0) // Exclude Sundays
    .slice(0, 7) // Take first 7 non-Sunday days

  function handleContinue() {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot')
      return
    }

    // Store in localStorage for checkout page
    localStorage.setItem('pickup_date', selectedDate)
    localStorage.setItem('pickup_slot', selectedSlot)
    
    router.push('/book/checkout')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Schedule Pickup</h1>
          <p className="text-muted-foreground">
            When should we collect your items?
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/book/items" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-8">
        <div className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableDates.map((date) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const isSelected = selectedDate === dateStr
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="text-sm text-muted-foreground">
                        {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                      </div>
                      <div className="font-semibold">
                        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select Time Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PICKUP_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot.id
                  
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="font-semibold mb-1">{slot.label}</div>
                      <div className="text-sm text-muted-foreground">{slot.time}</div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 h-fit space-y-4">
          <CartSummary />
          <Button
            onClick={handleContinue}
            className="w-full gap-2"
            size="lg"
            disabled={!selectedDate || !selectedSlot}
          >
            Continue to Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
