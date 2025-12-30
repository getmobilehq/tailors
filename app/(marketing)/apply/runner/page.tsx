'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Bike } from 'lucide-react'

const NOTTINGHAM_POSTCODES = [
  'NG1', 'NG2', 'NG3', 'NG4', 'NG5',
  'NG6', 'NG7', 'NG8', 'NG9', 'NG10',
  'NG11', 'NG12', 'NG13', 'NG14', 'NG15',
  'NG16', 'NG17', 'NG18', 'NG19', 'NG20'
]

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time (40+ hours/week)' },
  { value: 'part-time', label: 'Part-time (20-40 hours/week)' },
  { value: 'weekends', label: 'Weekends only' },
]

export default function RunnerApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    bio: '',
    experience_years: '',
    availability: 'part-time',
    postcode_coverage: [] as string[],
    has_vehicle: false,
    license_number: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({ ...formData, [name]: checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  function togglePostcode(postcode: string) {
    setFormData(prev => ({
      ...prev,
      postcode_coverage: prev.postcode_coverage.includes(postcode)
        ? prev.postcode_coverage.filter(p => p !== postcode)
        : [...prev.postcode_coverage, postcode]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.postcode_coverage.length === 0) {
      toast.error('Please select at least one postcode area to cover')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          application_type: 'runner',
          experience_years: parseInt(formData.experience_years) || 0
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      toast.success('Application submitted successfully!')

      // Redirect to confirmation page
      setTimeout(() => {
        router.push('/apply/success')
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bike className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Become a Runner</CardTitle>
            <CardDescription className="text-base">
              Join our team and earn money by collecting and delivering garments around Nottingham
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Experience</h3>

                <div className="space-y-2">
                  <Label htmlFor="bio">Tell us about yourself *</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Why do you want to become a runner? Any relevant experience?"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of delivery/driving experience</Label>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Availability</h3>

                <div className="space-y-2">
                  <Label htmlFor="availability">When are you available? *</Label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    disabled={loading}
                  >
                    {AVAILABILITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Area */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Area</h3>
                <p className="text-sm text-muted-foreground">
                  Select the postcode areas where you can collect and deliver
                </p>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {NOTTINGHAM_POSTCODES.map(postcode => (
                    <button
                      key={postcode}
                      type="button"
                      onClick={() => togglePostcode(postcode)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.postcode_coverage.includes(postcode)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      disabled={loading}
                    >
                      {postcode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vehicle Information</h3>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_vehicle"
                    name="has_vehicle"
                    checked={formData.has_vehicle}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={loading}
                  />
                  <Label htmlFor="has_vehicle" className="font-normal">
                    I have my own vehicle (car, motorcycle, or bicycle)
                  </Label>
                </div>

                {formData.has_vehicle && (
                  <div className="space-y-2">
                    <Label htmlFor="license_number">Driving License Number (if applicable)</Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      placeholder="Optional"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We'll review your application and get back to you within 2-3 business days
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
