import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, MapPin, Shield } from 'lucide-react'

export const metadata = {
  title: 'TailorSpace - Expert Alterations Delivered to Your Door | Nottingham',
  description: 'Book clothing alterations online in Nottingham. Expert collection, professional tailoring, and delivery to your door. Fixed prices from £2. Just £7 pickup & delivery.',
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'TailorSpace',
    image: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
    '@id': process.env.NEXT_PUBLIC_APP_URL,
    url: process.env.NEXT_PUBLIC_APP_URL,
    telephone: '+44-115-XXX-XXXX',
    priceRange: '££',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Nottingham',
      addressLocality: 'Nottingham',
      addressRegion: 'Nottinghamshire',
      postalCode: 'NG1',
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 52.9548,
      longitude: -1.1581,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '17:00',
      },
    ],
    sameAs: [
      'https://twitter.com/tailorspace',
      'https://facebook.com/tailorspace',
      'https://instagram.com/tailorspace',
    ],
    areaServed: {
      '@type': 'City',
      name: 'Nottingham',
    },
  }

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="container max-w-4xl">
          <h1 className="text-4xl md:text-6xl tracking-tight mb-6">
            Expert alterations,<br />delivered to your door
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book online. Our expert picks up your clothes, takes your measurements, 
            and delivers them back perfectly fitted. Just £7 for pickup & delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/book">Book Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Fixed Prices</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Serving Nottingham</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Insured Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl">
          <h2 className="text-3xl text-center mb-4">How it works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Professional alterations made easy with our unique 4-step process
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                icon: '📱',
                title: 'Book online',
                desc: 'Select services, schedule pickup, and pay securely online',
              },
              {
                step: '2',
                icon: '🚪',
                title: 'We collect',
                desc: 'Expert runner takes measurements and collects your items',
              },
              {
                step: '3',
                icon: '✂️',
                title: 'We alter',
                desc: 'Skilled tailors perfect your clothes with precision',
              },
              {
                step: '4',
                icon: '📦',
                title: 'We deliver',
                desc: 'Perfectly fitted garments returned to your door',
              },
            ].map((item) => (
              <Card key={item.step} className="text-center border-2">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl">
          <h2 className="text-3xl text-center mb-12">Why choose TailorSpace?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="h-8 w-8" />,
                title: 'Save Time',
                desc: 'No more trips to the tailor. We come to you for pickup and delivery.',
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: 'Expert Runners',
                desc: 'Our runners are trained consultants who take accurate measurements.',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Fixed Pricing',
                desc: 'Know exactly what you\'ll pay upfront. No surprises, no hidden fees.',
              },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="text-primary mb-4">{item.icon}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <h2 className="text-3xl text-center mb-4">Popular services</h2>
          <p className="text-center text-muted-foreground mb-12">
            From simple hems to complex alterations, we handle it all
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Trousers Shortened', price: '£14', icon: '👖' },
              { name: 'Jeans Hemmed', price: '£14', icon: '🩳' },
              { name: 'Dress Shortened', price: '£16', icon: '👗' },
              { name: 'Jacket Sleeves', price: '£22', icon: '🧥' },
              { name: 'Trousers Tapered', price: '£22', icon: '👖' },
              { name: 'Zip Replacement', price: '£18', icon: '🔧' },
              { name: 'Seam Repair', price: '£8', icon: '🧵' },
              { name: 'Button Sewn', price: '£2', icon: '⚫' },
            ].map((service) => (
              <Card key={service.name} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-3">{service.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{service.name}</h3>
                  <p className="text-primary">{service.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View All Services & Prices</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Join Our Team Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join our team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be part of Nottingham's premier alterations platform. Earn money on your schedule.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Concierge Card */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
              <CardContent className="pt-10 pb-8 px-8 relative">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    🚴
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-bold text-2xl mb-2 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    Join as Concierge
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Be the face of TailorSpace. Collect garments, take measurements, and deliver smiles.
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Flexible schedule</p>
                      <p className="text-xs text-muted-foreground">Work when you want, where you want</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Competitive earnings</p>
                      <p className="text-xs text-muted-foreground">Great pay per pickup & delivery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Full training provided</p>
                      <p className="text-xs text-muted-foreground">No experience needed to start</p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300" size="lg">
                  <Link href="/apply/runner">Apply as Concierge →</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Tailor Card */}
            <Card className="relative overflow-hidden border-2 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
              <CardContent className="pt-10 pb-8 px-8 relative">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    ✂️
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-bold text-2xl mb-2 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                    Sew For TailorSpace
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join our network of expert tailors. Showcase your craft and build your reputation.
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 hover:bg-purple-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Steady workflow</p>
                      <p className="text-xs text-muted-foreground">Consistent quality work delivered to you</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 hover:bg-purple-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Fair compensation</p>
                      <p className="text-xs text-muted-foreground">Competitive rates for your expertise</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 hover:bg-purple-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Work from anywhere</p>
                      <p className="text-xs text-muted-foreground">Use your own workshop or studio</p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300" size="lg">
                  <Link href="/apply/tailor">Start Sewing With Us →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              ⭐ Join over 50+ professionals already earning with TailorSpace
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white text-center">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl mb-4">Ready to get started?</h2>
          <p className="text-lg mb-2 opacity-90">
            Serving Nottingham • Fixed prices • No hidden fees
          </p>
          <p className="mb-8 opacity-75">
            Collection & delivery available in NG1, NG2, NG3, NG5, NG7, NG9
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/book">Book Your First Alteration</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
