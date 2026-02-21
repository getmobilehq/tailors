'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Mail, Phone, Star, CheckCircle, Scissors } from 'lucide-react'

const SPECIALIZATION_OPTIONS = [
  'Trousers & Jeans',
  'Shirts & Blouses',
  'Dresses & Skirts',
  'Suits & Formal Wear',
  'Coats & Jackets',
  'Wedding Dresses',
  'Leather Goods',
  'Denim Repair',
  'Tailoring',
  'Embroidery',
]

interface TailorSettingsProps {
  user: any
  tailorProfile: any
}

export function TailorSettings({ user, tailorProfile }: TailorSettingsProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })

  const [tailorData, setTailorData] = useState({
    specializations: tailorProfile?.specializations || [],
    max_concurrent_orders: tailorProfile?.max_concurrent_orders || 20,
    active: tailorProfile?.active ?? true,
  })

  function toggleSpecialization(spec: string) {
    setTailorData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s: string) => s !== spec)
        : [...prev.specializations, spec],
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()

      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Update tailor profile
      if (tailorProfile) {
        const { error: tailorError } = await supabase
          .from('tailor_profiles')
          .update({
            specializations: tailorData.specializations,
            max_concurrent_orders: tailorData.max_concurrent_orders,
            active: tailorData.active,
          })
          .eq('user_id', user.id)

        if (tailorError) throw tailorError
      }

      toast.success('Settings saved successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="pl-10 bg-muted cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="07123 456789"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tailor Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Tailor Profile</CardTitle>
          <CardDescription>Manage your specializations and capacity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Specializations */}
          <div className="space-y-3">
            <Label>Specializations</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATION_OPTIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                    tailorData.specializations.includes(spec)
                      ? 'bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Max Concurrent Orders */}
          <div className="space-y-2">
            <Label htmlFor="max_orders">Max Concurrent Orders</Label>
            <Input
              id="max_orders"
              type="number"
              min={1}
              max={100}
              value={tailorData.max_concurrent_orders}
              onChange={(e) => setTailorData({ ...tailorData, max_concurrent_orders: parseInt(e.target.value) || 1 })}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of orders you can handle at the same time
            </p>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Available for Orders</Label>
              <p className="text-xs text-muted-foreground">
                Toggle off to stop receiving new order assignments
              </p>
            </div>
            <Switch
              checked={tailorData.active}
              onCheckedChange={(checked) => setTailorData({ ...tailorData, active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats (read-only) */}
      {tailorProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
            <CardDescription>Performance metrics (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    {tailorProfile.rating ? Number(tailorProfile.rating).toFixed(1) : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">{tailorProfile.completed_jobs || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Scissors className="h-4 w-4 text-violet-500" />
                  <span className="text-2xl font-bold">{tailorProfile.total_reviews || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
