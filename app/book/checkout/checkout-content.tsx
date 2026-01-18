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
import { ArrowLeft, CreditCard, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { PICKUP_SLOTS } from '@/lib/constants'
import type { SavedAddress } from '@/lib/types'

export default function CheckoutContent() {
  const router = useRouter()
  const { items } = useCart()
  const [loading, setLoading] = useState(false)
  const [pickupInfo, setPickupInfo] = useState({ date: '', slot: '' })
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [saveThisAddress, setSaveThisAddress] = useState(false)

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

    // Restore form data if user was redirected to login
    const savedFormData = localStorage.getItem('checkout_form_data')
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData)
        setFormData(parsedData)
        localStorage.removeItem('checkout_form_data') // Clear after restoring
      } catch (e) {
        console.error('Failed to restore form data:', e)
      }
    }

    if (!date || !slot) {
      router.push('/book/schedule')
      return
    }

    setPickupInfo({ date, slot })

    // Fetch saved addresses
    fetchSavedAddresses()
  }, [items, router])

  async function fetchSavedAddresses() {
    try {
      const response = await fetch('/api/addresses')
      const data = await response.json()

      if (response.ok && data.addresses) {
        setSavedAddresses(data.addresses)

        // Check if user has restored form data from login redirect
        const savedFormData = localStorage.getItem('checkout_form_data')

        if (!savedFormData && data.addresses.length > 0) {
          // Auto-select default address if exists, otherwise select first address
          const defaultAddress = data.addresses.find((addr: SavedAddress) => addr.is_default) || data.addresses[0]

          setSelectedAddressId(defaultAddress.id)
          setUseNewAddress(false)
          setFormData(prev => ({
            ...prev,
            line1: defaultAddress.line1,
            line2: defaultAddress.line2 || '',
            city: defaultAddress.city,
            postcode: defaultAddress.postcode,
          }))
        } else if (data.addresses.length === 0) {
          setUseNewAddress(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
      setUseNewAddress(true)
    }
  }

  function handleSelectAddress(addressId: string) {
    const address = savedAddresses.find(addr => addr.id === addressId)
    if (address) {
      setSelectedAddressId(addressId)
      setUseNewAddress(false)
      setFormData({
        ...formData,
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        postcode: address.postcode,
      })
    }
  }

  function handleUseNewAddress() {
    setSelectedAddressId(null)
    setUseNewAddress(true)
    setFormData({
      ...formData,
      line1: '',
      line2: '',
      city: 'Nottingham',
      postcode: '',
    })
  }

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
      // Step 1: Create order in database (with photos)
      const orderResponse = await fetch('/api/orders/create', {
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

      if (!orderResponse.ok) {
        const orderData = await orderResponse.json()

        // Redirect to login if not authenticated
        if (orderResponse.status === 401) {
          toast.error('Please log in to continue')
          // Save form data to restore after login
          localStorage.setItem('checkout_form_data', JSON.stringify(formData))
          router.push('/login?redirect=/cart')
          return
        }

        throw new Error(orderData.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()

      // Step 2: Create Stripe checkout session with order ID
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          total: orderData.total,
        }),
      })

      const checkoutData = await checkoutResponse.json()

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Checkout failed')
      }

      // Step 3: Save address if requested and postcode doesn't already exist
      if (useNewAddress && saveThisAddress) {
        // Check if this postcode already exists in saved addresses
        const postcodeExists = savedAddresses.some(
          addr => addr.postcode.toUpperCase() === formData.postcode.toUpperCase()
        )

        if (!postcodeExists) {
          try {
            // Wait for address to save before redirecting
            const saveResponse = await fetch('/api/addresses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                label: formData.line1.split(' ')[0] || 'Home', // Use first word of address as label
                line1: formData.line1,
                line2: formData.line2,
                city: formData.city,
                postcode: formData.postcode,
                is_default: savedAddresses.length === 0, // Make it default if it's the first address
              }),
            })

            if (saveResponse.ok) {
              console.log('Address saved successfully')
            } else {
              console.error('Failed to save address:', await saveResponse.text())
            }
          } catch (err) {
            console.error('Failed to save address:', err)
            // Don't block checkout if address save fails
          }
        } else {
          console.log('Address with this postcode already exists, skipping save')
        }
      }

      // Redirect to Stripe
      if (checkoutData.url) {
        window.location.href = checkoutData.url
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
              {/* Saved Addresses Selector */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <Label>Select an address</Label>
                  <div className="space-y-2">
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => handleSelectAddress(address.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            checked={selectedAddressId === address.id}
                            onChange={() => handleSelectAddress(address.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{address.label}</p>
                              {address.is_default && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {address.line1}
                              {address.line2 && `, ${address.line2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.postcode}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={handleUseNewAddress}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        useNewAddress
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={useNewAddress}
                          onChange={handleUseNewAddress}
                        />
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Use a different address</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Form Fields (shown when using new address or no saved addresses) */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <>
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
                </>
              )}

              {/* Save address checkbox (only for new addresses) */}
              {useNewAddress && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveThisAddress}
                    onChange={(e) => setSaveThisAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="saveAddress" className="cursor-pointer font-normal">
                    Save this address for future orders
                  </Label>
                </div>
              )}

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
