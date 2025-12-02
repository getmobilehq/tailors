'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CartSummary } from '@/components/booking/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { PICKUP_SLOTS } from '@/lib/constants'

export default function CheckoutPage() {
  const router = useRouter()
  const { items } = useCart()
  const [loading, setLoading] = useState(false)
  const [pickupInfo, setPickupInfo] = useState({ date: '', slot: '' })
  
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    city: 'Nottingham',
    postcode: '',
    phone: '',
    notes: '',
  })

  useEffect(() => {
    if (items.length === 0) {
      router.push('/book')
      return
    }

    const date = localStorage.getItem('pickup_date')
    const slot = localStorage.getItem('pickup_slot')
    
    if (!date || !slot) {
      router.push('/book/schedule')
      return
    }

    setPickupInfo({ date, slot })
  }, [items, router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleCheckout() {
    // Validate required fields
    if (!formData.line1 || !formData.city || !formData.postcode || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate Nottingham postcode
    if (!formData.postcode.toUpperCase().startsWith('NG')) {
      toast.error('We currently only serve Nottingham postcodes (NG)')
      return
    }

    setLoading(true)

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            service: item.service,
            garment_description: item.garment_description,
            quantity: item.quantity,
            photos: item.photos,
            notes: item.notes,
          })),
          address: {
            line1: formData.line1,
            line2: formData.line2,
            city: formData.city,
            postcode: formData.postcode,
          },
          phone: formData.phone,
          notes: formData.notes,
          pickupDate: pickupInfo.date,
          pickupSlot: pickupInfo.slot,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Redirect to Stripe
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process checkout')
      setLoading(false)
    }
  }

  if (!pickupInfo.date) {
    return null
  }

  const slotDetails = PICKUP_SLOTS.find(s => s.id === pickupInfo.slot)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order details and payment
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/book/schedule" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-8">
        <div className="space-y-6">
          {/* Pickup Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pickup Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{formatDate(pickupInfo.date)}</p>
                  <p className="text-sm text-muted-foreground">{slotDetails?.label} ({slotDetails?.time})</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/book/schedule">Change</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Address Form */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="line1">
                  Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="line1"
                  name="line1"
                  placeholder="Street address"
                  value={formData.line1}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  name="line2"
                  placeholder="Apartment, suite, etc."
                  value={formData.line2}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postcode">
                    Postcode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    placeholder="NG1 1AA"
                    value={formData.postcode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="07123 456789"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Delivery Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="e.g., Ring doorbell, leave with neighbor, etc."
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 h-fit space-y-4">
          <CartSummary />
          <Button
            onClick={handleCheckout}
            className="w-full gap-2"
            size="lg"
            disabled={loading}
          >
            <CreditCard className="h-4 w-4" />
            {loading ? 'Processing...' : 'Pay Securely'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
