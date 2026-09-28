'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CartSummary } from '@/components/booking/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { PICKUP_SLOTS } from '@/lib/constants'
import { ArrowLeft, ArrowRight, Calendar, Clock, Car, Store } from 'lucide-react'
import { DropoffAddress } from '@/components/booking/dropoff-address'
import type { DropoffLocation, FulfilmentType } from '@/lib/types'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ScheduleContent() {
  const router = useRouter()
  const { items } = useCart()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [fulfilment, setFulfilment] = useState<FulfilmentType>('pickup')
  const [dropoff, setDropoff] = useState<DropoffLocation | null>(null)

  useEffect(() => {
    fetch('/api/dropoff-location')
      .then((res) => res.json())
      .then((data) => {
        if (data.available) setDropoff(data.location)
      })
      .catch(() => {
        // Drop-off simply isn't offered if we can't load the location
      })
  }, [])

  const isDropoff = fulfilment === 'dropoff'

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
    if (!selectedDate) {
      toast.error(isDropoff ? 'Please choose a drop-off day' : 'Please select a date and time slot')
      return
    }

    if (!isDropoff && !selectedSlot) {
      toast.error('Please select a date and time slot')
      return
    }

    // Store in localStorage for checkout page
    if (typeof window !== 'undefined') {
      localStorage.setItem('fulfilment_type', fulfilment)

      if (isDropoff) {
        localStorage.setItem('dropoff_date', selectedDate)
        localStorage.removeItem('pickup_date')
        localStorage.removeItem('pickup_slot')
      } else {
        localStorage.setItem('pickup_date', selectedDate)
        localStorage.setItem('pickup_slot', selectedSlot)
        localStorage.removeItem('dropoff_date')
      }
    }

    router.push('/book/checkout')
  }

  function handleFulfilmentChange(next: FulfilmentType) {
    setFulfilment(next)
    setSelectedDate('')
    setSelectedSlot('')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">{isDropoff ? 'Schedule Drop-off' : 'Schedule Pickup'}</h1>
          <p className="text-muted-foreground">
            {isDropoff
              ? 'When will you bring your items in?'
              : 'When should we collect your items?'}
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
          {/* Pickup or drop-off. Only shown once an admin has set up a location. */}
          {dropoff && (
            <Card>
              <CardHeader>
                <CardTitle>How would you like to get your items to us?</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleFulfilmentChange('pickup')}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                    !isDropoff ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Car className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1">We collect</div>
                  <div className="text-sm text-muted-foreground">
                    A runner picks up and delivers back
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFulfilmentChange('dropoff')}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                    isDropoff ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Store className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1">I'll drop off &amp; collect</div>
                  <div className="text-sm text-muted-foreground">
                    No delivery fee, and you can pay when you drop off
                  </div>
                </button>
              </CardContent>
            </Card>
          )}

          {isDropoff && dropoff && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Where to bring your items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DropoffAddress location={dropoff} />
              </CardContent>
            </Card>
          )}

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {isDropoff ? 'Which day will you come in?' : 'Select Date'}
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

          {/* Time slots are a runner's route plan - drop-off just needs a day */}
          {!isDropoff && (
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
          )}
        </div>

        <div className="lg:sticky lg:top-4 h-fit space-y-4">
          <CartSummary fulfilment={fulfilment} />
          <Button
            onClick={handleContinue}
            className="w-full gap-2"
            size="lg"
            disabled={!selectedDate || (!isDropoff && !selectedSlot)}
          >
            Continue to Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
