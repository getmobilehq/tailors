import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoriesManager } from '@/components/admin/categories-manager'
import { ServicesManager } from '@/components/admin/services-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, FolderKanban, Scissors } from 'lucide-react'

export default async function AdminServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/orders')
  }

  // Fetch all categories with service count
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      *,
      services:services(count)
    `)
    .order('sort_order', { ascending: true })

  // Transform data to include service count
  const categoriesWithCount = categories?.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    description: cat.description,
    sort_order: cat.sort_order,
    active: cat.active,
    service_count: cat.services?.[0]?.count || 0,
    created_at: cat.created_at,
    updated_at: cat.updated_at
  })) || []

  // Fetch all services
  const { data: servicesData } = await supabase
    .from('services')
    .select(`
      *,
      category:categories!services_category_id_fkey(id, name, slug, icon)
    `)
    .order('sort_order', { ascending: true })

  const services = servicesData || []

  // Simple categories list for services manager
  const simpleCategories = categories?.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon
  })) || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Services & Categories
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Manage services and categories for the marketplace
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{categoriesWithCount.length}</span>
            <span className="text-muted-foreground text-sm">categories</span>
          </div>
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{services.length}</span>
            <span className="text-muted-foreground text-sm">services</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-900 border border-amber-500/20">
          <TabsTrigger value="categories" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
            <FolderKanban className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900">
            <Scissors className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesManager initialCategories={categoriesWithCount} />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ServicesManager initialServices={services} categories={simpleCategories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
