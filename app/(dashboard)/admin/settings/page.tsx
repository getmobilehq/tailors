'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, DollarSign, MapPin, Clock, Phone, Store, Mail } from 'lucide-react'
import type { DropoffLocation } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface SiteSetting {
  key: string
  value: any
  description: string
  category: string
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Form states
  const [deliveryFee, setDeliveryFee] = useState('')
  const [servicePostcodes, setServicePostcodes] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [businessHours, setBusinessHours] = useState<Record<string, string>>({})
  const [returnPostageFee, setReturnPostageFee] = useState('')
  const [dropoff, setDropoff] = useState<DropoffLocation>({
    enabled: false,
    postalEnabled: false,
    name: 'TailorSpace',
    line1: '',
    line2: '',
    city: 'Nottingham',
    postcode: '',
    hours: 'Mon-Sat, 9:00am - 6:00pm',
    instructions: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data: SiteSetting[] = await res.json()
        setSettings(data)

        // Populate form fields
        data.forEach(setting => {
          if (setting.key === 'delivery_fee') {
            setDeliveryFee(setting.value.amount.toString())
          } else if (setting.key === 'service_area') {
            setServicePostcodes(setting.value.postcodes.join(', '))
          } else if (setting.key === 'contact_info') {
            setContactEmail(setting.value.email)
            setContactPhone(setting.value.phone)
          } else if (setting.key === 'business_hours') {
            setBusinessHours(setting.value)
          } else if (setting.key === 'return_postage_fee') {
            setReturnPostageFee(setting.value.amount?.toString() ?? '')
          } else if (setting.key === 'dropoff_location') {
            setDropoff((current) => ({ ...current, ...setting.value }))
          }
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSetting(key: string, value: any, description: string, category: string) {
    try {
      setSaving(key)
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, description, category })
      })

      if (res.ok) {
        await loadSettings()
        alert('Setting saved successfully')
      } else {
        alert('Failed to save setting')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save setting')
    } finally {
      setSaving(null)
    }
  }

  async function saveDeliveryFee() {
    await saveSetting(
      'delivery_fee',
      { amount: parseFloat(deliveryFee), currency: 'GBP' },
      'Delivery fee per order',
      'pricing'
    )
  }

  async function saveServiceArea() {
    const postcodes = servicePostcodes.split(',').map(p => p.trim().toUpperCase())
    await saveSetting(
      'service_area',
      { postcodes, city: 'Nottingham' },
      'Service coverage area',
      'business'
    )
  }

  async function saveContactInfo() {
    await saveSetting(
      'contact_info',
      { email: contactEmail, phone: contactPhone, address: 'Nottingham, UK' },
      'Contact information',
      'business'
    )
  }

  async function saveReturnPostageFee() {
    await saveSetting(
      'return_postage_fee',
      { amount: parseFloat(returnPostageFee), currency: 'GBP' },
      'Flat Royal Mail fee charged to post finished items back to postal customers',
      'pricing'
    )
  }

  async function saveDropoffLocation(next: DropoffLocation) {
    setDropoff(next)
    await saveSetting(
      'dropoff_location',
      next,
      'Where drop-off customers bring their items and postal customers send them',
      'business'
    )
  }

  async function saveBusinessHours() {
    await saveSetting(
      'business_hours',
      businessHours,
      'Operating hours',
      'business'
    )
  }

  const handleBusinessHourChange = (day: string, value: string) => {
    setBusinessHours(prev => ({ ...prev, [day]: value }))
  }

  const addressReady = Boolean(dropoff.line1.trim() && dropoff.postcode.trim())

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
        <p className="text-muted-foreground">Manage site-wide configuration and business settings</p>
      </div>

      <div className="space-y-6">
        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Pricing</CardTitle>
            </div>
            <CardDescription>Manage pricing and fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delivery_fee">Delivery Fee (£)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="7.00"
                  />
                  <Button
                    onClick={saveDeliveryFee}
                    disabled={saving === 'delivery_fee'}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving === 'delivery_fee' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Flat delivery fee applied to all orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Area */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>Service Area</CardTitle>
            </div>
            <CardDescription>Define where you provide services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="postcodes">Postcodes (comma-separated)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="postcodes"
                    value={servicePostcodes}
                    onChange={(e) => setServicePostcodes(e.target.value)}
                    placeholder="NG1, NG2, NG3, NG5, NG7, NG9"
                  />
                  <Button
                    onClick={saveServiceArea}
                    disabled={saving === 'service_area'}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving === 'service_area' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Nottingham postcodes where service is available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <CardTitle>Contact Information</CardTitle>
            </div>
            <CardDescription>Business contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="support@tailorspace.uk"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+44 115 123 4567"
                />
              </div>
              <Button
                onClick={saveContactInfo}
                disabled={saving === 'contact_info'}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving === 'contact_info' ? 'Saving...' : 'Save Contact Info'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drop-off Location */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <CardTitle>Drop-off &amp; Postal</CardTitle>
            </div>
            <CardDescription>
              One address for customers who bring items in and for those who post them.
              Each option is switched on separately, and neither appears at checkout
              until the address below is filled in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">
                  {dropoff.enabled ? 'Drop-off is offered at checkout' : 'Drop-off is switched off'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dropoff.line1 && dropoff.postcode
                    ? 'The address below is shown to customers.'
                    : 'Add a street address and postcode before switching it on.'}
                </p>
              </div>
              <Button
                variant={dropoff.enabled ? 'outline' : 'default'}
                disabled={saving === 'dropoff_location' || !addressReady}
                onClick={() => saveDropoffLocation({ ...dropoff, enabled: !dropoff.enabled })}
              >
                {dropoff.enabled ? 'Switch off' : 'Switch on'}
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {dropoff.postalEnabled
                    ? 'Postal orders accepted UK-wide'
                    : 'Postal orders are switched off'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Customers anywhere in the UK post items to this address and pay Royal
                  Mail return postage at checkout.
                </p>
              </div>
              <Button
                variant={dropoff.postalEnabled ? 'outline' : 'default'}
                disabled={saving === 'dropoff_location' || !addressReady}
                onClick={() =>
                  saveDropoffLocation({ ...dropoff, postalEnabled: !dropoff.postalEnabled })
                }
              >
                {dropoff.postalEnabled ? 'Switch off' : 'Switch on'}
              </Button>
            </div>

            <div>
              <Label htmlFor="return-postage">Return postage fee (GBP)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="return-postage"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="4.99"
                  value={returnPostageFee}
                  onChange={(e) => setReturnPostageFee(e.target.value)}
                />
                <Button
                  onClick={saveReturnPostageFee}
                  disabled={saving === 'return_postage_fee' || !returnPostageFee}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving === 'return_postage_fee' ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Charged on postal orders in place of the delivery fee. Drop-off stays free.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dropoff-name">Location name</Label>
                <Input
                  id="dropoff-name"
                  className="mt-2"
                  value={dropoff.name}
                  onChange={(e) => setDropoff({ ...dropoff, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dropoff-postcode">Postcode</Label>
                <Input
                  id="dropoff-postcode"
                  className="mt-2"
                  placeholder="NG1 1AA"
                  value={dropoff.postcode}
                  onChange={(e) => setDropoff({ ...dropoff, postcode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dropoff-line1">Address line 1</Label>
                <Input
                  id="dropoff-line1"
                  className="mt-2"
                  placeholder="12 Example Street"
                  value={dropoff.line1}
                  onChange={(e) => setDropoff({ ...dropoff, line1: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dropoff-line2">Address line 2 (optional)</Label>
                <Input
                  id="dropoff-line2"
                  className="mt-2"
                  value={dropoff.line2 || ''}
                  onChange={(e) => setDropoff({ ...dropoff, line2: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dropoff-city">City</Label>
                <Input
                  id="dropoff-city"
                  className="mt-2"
                  value={dropoff.city}
                  onChange={(e) => setDropoff({ ...dropoff, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dropoff-hours">Opening hours</Label>
                <Input
                  id="dropoff-hours"
                  className="mt-2"
                  value={dropoff.hours}
                  onChange={(e) => setDropoff({ ...dropoff, hours: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dropoff-instructions">Instructions for customers (optional)</Label>
              <Input
                id="dropoff-instructions"
                className="mt-2"
                placeholder="Ask for the TailorSpace counter when you arrive."
                value={dropoff.instructions || ''}
                onChange={(e) => setDropoff({ ...dropoff, instructions: e.target.value })}
              />
            </div>

            <Button
              onClick={() => saveDropoffLocation(dropoff)}
              disabled={saving === 'dropoff_location'}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving === 'dropoff_location' ? 'Saving...' : 'Save drop-off point'}
            </Button>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Business Hours</CardTitle>
            </div>
            <CardDescription>Operating hours for each day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day} className="flex items-center gap-4">
                  <Label className="w-28 capitalize">{day}</Label>
                  <Input
                    value={businessHours[day] || ''}
                    onChange={(e) => handleBusinessHourChange(day, e.target.value)}
                    placeholder="9:00-18:00 or 'closed'"
                    className="flex-1"
                  />
                </div>
              ))}
              <Button
                onClick={saveBusinessHours}
                disabled={saving === 'business_hours'}
                className="mt-4"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving === 'business_hours' ? 'Saving...' : 'Save Business Hours'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Settings (Read-only view) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>All Settings</CardTitle>
            </div>
            <CardDescription>Complete list of site settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settings.map(setting => (
                <div key={setting.key} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{setting.key}</span>
                        <Badge variant="secondary">{setting.category}</Badge>
                      </div>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {setting.description}
                        </p>
                      )}
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(setting.value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
