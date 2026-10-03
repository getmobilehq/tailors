import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, MapPin, Scissors, Package, Clock, Shield, Star } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="py-16 px-4">
      <div className="container max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl mb-4">How TailorSpace Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional alterations without leaving your home. Here's our simple 4-step process.
          </p>
        </div>

        {/* Main Steps */}
        <div className="space-y-16 mb-20">
          {[
            {
              step: 1,
              icon: <Calendar className="h-12 w-12" />,
              title: 'Book Online',
              description: 'Choose your alterations from our fixed-price menu, pick how your items reach us, and pay securely online.',
              details: [
                'Browse our full service list',
                'Post them from anywhere in the UK',
                'Or, in Nottingham, book a collection or drop them in',
                'Add photos and notes for each garment',
              ],
            },
            {
              step: 2,
              icon: <MapPin className="h-12 w-12" />,
              title: 'Getting Them To Us',
              description: 'Post your items with any courier, or have a runner collect them from your door in Nottingham.',
              details: [
                'Post from anywhere in the UK - we recommend tracked',
                'Or a runner collects at your scheduled time',
                'Measurements taken on collection, or when your parcel arrives',
                'We confirm by email as soon as we have your items',
              ],
            },
            {
              step: 3,
              icon: <Scissors className="h-12 w-12" />,
              title: 'Professional Tailoring',
              description: 'Your garments are assigned to one of our skilled tailors who completes the alterations with care.',
              details: [
                'Work completed by experienced tailors',
                'Quality checks at multiple stages',
                'Typical turnaround: 2-7 working days',
                'Updates sent via SMS/email',
              ],
            },
            {
              step: 4,
              icon: <Package className="h-12 w-12" />,
              title: 'Back To You',
              description: 'Your altered garments come back by tracked Royal Mail post, or to your door in Nottingham.',
              details: [
                'Posted back tracked, with the number emailed to you',
                'Or delivered to your door, scheduled at your convenience',
                'Items protected in garment bags',
                'Leave a review to help others',
              ],
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl mb-4">
                  {item.step}
                </div>
                <div className="text-primary">{item.icon}</div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl mb-3">{item.title}</h2>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                <ul className="space-y-2">
                  {item.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Why Different */}
        <div className="mb-20">
          <h2 className="text-3xl text-center mb-12">What makes us different?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Star className="h-8 w-8" />,
                title: 'Expert Runners',
                desc: 'Not just delivery drivers—our runners are trained consultants who understand garment construction and can advise on the best alterations.',
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: 'Time-Saving',
                desc: 'No more scheduling trips to the tailor, waiting for fittings, or making return visits. We handle everything from your doorstep.',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Fully Insured',
                desc: 'All items are insured during collection, alteration, and delivery. Your garments are protected throughout the entire process.',
              },
            ].map((feature, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Area */}
        <div className="bg-muted rounded-lg p-8 mb-12">
          <h2 className="text-2xl mb-4 text-center">Where We Work</h2>
          <p className="text-center text-muted-foreground mb-8">
            Wherever you are in the UK, there is a way to get your items to us.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-2">Anywhere in the UK</h3>
              <p className="text-sm text-muted-foreground">
                Post your items to us with Royal Mail or any courier you like, and we
                post them back tracked once they are finished. You pay postage one way;
                the return trip is a flat fee at checkout.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-2">In Nottingham</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose doorstep collection and delivery by one of our runners, or drop
                your items in yourself and collect them when they are ready.
              </p>
              <div className="flex flex-wrap gap-2">
                {['NG1', 'NG2', 'NG3', 'NG5', 'NG7', 'NG9'].map((postcode) => (
                  <div key={postcode} className="px-3 py-1 bg-muted rounded-full text-sm font-semibold">
                    {postcode}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Outside those postcodes? Posting your items works from anywhere in the UK.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl mb-4">Ready to try TailorSpace?</h2>
          <p className="text-muted-foreground mb-8">
            Book your first alteration now and experience the difference
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/book">Book Now</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
