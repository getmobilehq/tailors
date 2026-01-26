import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Get in touch with us through any of these channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a
                    href="mailto:support@tailorspace.uk"
                    className="text-muted-foreground hover:text-primary"
                  >
                    support@tailorspace.uk
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <a
                    href="tel:+441159999999"
                    className="text-muted-foreground hover:text-primary"
                  >
                    0115 999 9999
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mon-Fri: 9am-6pm, Sat: 10am-4pm
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Service Area</h3>
                  <p className="text-muted-foreground">
                    Nottingham & Surrounding Areas<br />
                    Postcodes: NG1, NG2, NG3, NG5, NG7, NG9
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Help</CardTitle>
              <CardDescription>
                Find answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Existing Customers</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Track your order, view history, or get support:
                </p>
                <Link
                  href="/orders"
                  className="text-sm text-primary hover:underline"
                >
                  Go to My Orders →
                </Link>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">New to TailorSpace?</h3>
                <div className="space-y-2">
                  <Link
                    href="/how-it-works"
                    className="text-sm text-primary hover:underline block"
                  >
                    How It Works →
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm text-primary hover:underline block"
                  >
                    View Services & Pricing →
                  </Link>
                  <Link
                    href="/book"
                    className="text-sm text-primary hover:underline block"
                  >
                    Book Your First Alteration →
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Join Our Team</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Interested in becoming a runner or tailor?
                </p>
                <div className="space-y-2">
                  <Link
                    href="/apply/runner"
                    className="text-sm text-primary hover:underline block"
                  >
                    Apply as a Runner →
                  </Link>
                  <Link
                    href="/apply/tailor"
                    className="text-sm text-primary hover:underline block"
                  >
                    Apply as a Tailor →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Inquiries */}
        <Card className="mt-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Business & Partnership Inquiries
            </h2>
            <p className="text-muted-foreground mb-4">
              Interested in partnering with TailorSpace or exploring business opportunities?
              We'd love to hear from you.
            </p>
            <a
              href="mailto:support@tailorspace.uk"
              className="text-primary hover:underline font-medium"
            >
              support@tailorspace.uk
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
