import { createClient } from '@/lib/supabase/server'
import { ServiceSelector } from '@/components/booking/service-selector'

export default async function BookPage() {
  const supabase = await createClient()

  // Fetch categories from database (single source of truth)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // Fetch services from database
  const { data: servicesData, error } = await supabase
    .from('services')
    .select(`
      *,
      category:categories(id, slug, name, icon)
    `)
    .eq('active', true)
    .order('sort_order')

  // Map base_price (pence) to price (pounds) for compatibility
  const services = servicesData?.map(s => ({
    ...s,
    price: s.base_price / 100
  })) || []

  if (error) {
    console.error('Error fetching services:', error)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Book Alterations</h1>
        <p className="text-muted-foreground">
          Select the services you need. You can add multiple items in the next step.
        </p>
      </div>

      <ServiceSelector services={services || []} categories={categories || []} />
    </div>
  )
}
