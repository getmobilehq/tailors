import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { DELIVERY_FEE } from '@/lib/constants'

export default async function PricingPage() {
  const supabase = await createClient()

  // Fetch categories from database (single source of truth)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // Fetch services from database
  const { data: servicesData } = await supabase
    .from('services')
    .select(`
      *,
      category:categories!services_category_id_fkey(id, slug, name, icon)
    `)
    .eq('active', true)
    .order('sort_order')

  // Convert base_price (pence) to price (pounds)
  const services = servicesData?.map(s => ({
    ...s,
    price: s.base_price / 100
  })) || []

  // Group services by category ID
  const servicesByCategory = services.reduce((acc, service) => {
    const categoryId = service.category_id
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(service)
    return acc
  }, {} as Record<string, typeof services>)

  return (
    <div className="py-16 px-4">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-4">Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fixed prices for all alterations. No surprises, no hidden fees.
          </p>
          <div className="mt-6 inline-block p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Pickup & Delivery</p>
            <p className="text-2xl font-bold text-primary">{formatPrice(DELIVERY_FEE)} flat fee</p>
          </div>
        </div>

        <div className="space-y-12">
          {(categories || []).map((category) => {
            const categoryServices = servicesByCategory?.[category.id] || []

            if (categoryServices.length === 0) return null

            return (
              <div key={category.id} id={category.slug}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">{category.icon || '✂️'}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryServices.map((service: any) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{service.name}</CardTitle>
                          <span className="text-xl font-bold text-primary">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </CardHeader>
                      {service.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center p-8 bg-muted rounded-lg">
          <h3 className="text-xl mb-2">Don't see what you need?</h3>
          <p className="text-muted-foreground mb-6">
            Contact us for custom alterations and special requests
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/book">Book Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
