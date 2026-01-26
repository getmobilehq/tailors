import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, Users, Shield, Clock, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            About TailorSpace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're revolutionizing clothing alterations in Nottingham with our convenient,
            door-to-door service that connects you with expert tailors.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  TailorSpace was born from a simple observation: getting your clothes altered
                  shouldn't require taking time off work, finding parking, or carrying armfuls
                  of garments across town.
                </p>
                <p>
                  We created a three-sided marketplace that brings together customers, expert
                  runners who handle collections and deliveries, and skilled tailors who perform
                  the alterations. This unique model means you can book professional alterations
                  from the comfort of your home.
                </p>
                <p>
                  Starting in Nottingham, we're committed to making quality alterations accessible,
                  convenient, and transparent. Every booking includes upfront pricing, real-time
                  tracking, and a satisfaction guarantee.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Convenience</h3>
                <p className="text-sm text-muted-foreground">
                  We save you time with door-to-door service and flexible scheduling
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Quality</h3>
                <p className="text-sm text-muted-foreground">
                  All our tailors are vetted experts with years of professional experience
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  We support local tailors and create jobs for runners in Nottingham
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Care</h3>
                <p className="text-sm text-muted-foreground">
                  We treat every garment with the attention and care it deserves
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                How We're Different
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">No more drop-offs:</strong> Our runners
                  come to you, take measurements at your door, and collect your items.
                </p>
                <p>
                  <strong className="text-foreground">Transparent pricing:</strong> See exact
                  costs upfront before booking—no hidden fees or surprise charges.
                </p>
                <p>
                  <strong className="text-foreground">Quality guaranteed:</strong> Every alteration
                  is backed by our satisfaction guarantee and customer reviews.
                </p>
                <p>
                  <strong className="text-foreground">Supporting local:</strong> We partner with
                  skilled Nottingham tailors and provide flexible work for local runners.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Ready to try TailorSpace?
          </h2>
          <p className="text-muted-foreground mb-8">
            Book your first alteration in minutes. No commitment, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/book">
                Book Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
