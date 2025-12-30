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
import { ArrowLeft, Scissors } from 'lucide-react'

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

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time (40+ hours/week)' },
  { value: 'part-time', label: 'Part-time (20-40 hours/week)' },
  { value: 'weekends', label: 'Weekends only' },
]

export default function TailorApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    bio: '',
    experience_years: '',
    availability: 'part-time',
    specializations: [] as string[],
    portfolio_urls: '',
    certifications: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  function toggleSpecialization(spec: string) {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.specializations.length === 0) {
      toast.error('Please select at least one specialization')
      return
    }

    setLoading(true)

    try {
      // Parse portfolio URLs and certifications
      const portfolio_urls = formData.portfolio_urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      const certifications = formData.certifications
        .split('\n')
        .map(cert => cert.trim())
        .filter(cert => cert.length > 0)

      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          experience_years: parseInt(formData.experience_years) || 0,
          availability: formData.availability,
          specializations: formData.specializations,
          portfolio_urls,
          certifications,
          application_type: 'tailor',
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
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Become a Tailor</CardTitle>
            <CardDescription className="text-base">
              Join our network of skilled tailors and help customers across Nottingham
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
                <h3 className="text-lg font-semibold">Experience & Skills</h3>

                <div className="space-y-2">
                  <Label htmlFor="bio">Tell us about your tailoring background *</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Describe your experience, training, and why you want to join TailorSpace..."
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of professional tailoring experience *</Label>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Specializations</h3>
                <p className="text-sm text-muted-foreground">
                  Select all types of alterations you're skilled in
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SPECIALIZATION_OPTIONS.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className={`px-4 py-3 rounded-md text-sm font-medium transition-colors text-left ${
                        formData.specializations.includes(spec)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      disabled={loading}
                    >
                      {spec}
                    </button>
                  ))}
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

              {/* Portfolio & Certifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Portfolio & Credentials</h3>

                <div className="space-y-2">
                  <Label htmlFor="portfolio_urls">Portfolio Links</Label>
                  <Textarea
                    id="portfolio_urls"
                    name="portfolio_urls"
                    placeholder="Instagram, website, or photo links (one per line)&#10;https://instagram.com/yourwork&#10;https://yourwebsite.com"
                    value={formData.portfolio_urls}
                    onChange={handleChange}
                    rows={3}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional but recommended - helps us review your work
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications & Qualifications</Label>
                  <Textarea
                    id="certifications"
                    name="certifications"
                    placeholder="List any relevant certifications or training (one per line)&#10;City & Guilds Level 3 Fashion & Textiles&#10;Bespoke Tailoring Diploma"
                    value={formData.certifications}
                    onChange={handleChange}
                    rows={3}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional - includes formal qualifications or apprenticeships
                  </p>
                </div>
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
