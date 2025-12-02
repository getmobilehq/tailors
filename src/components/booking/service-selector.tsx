'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import type { Service } from '@/lib/types'
import { Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

interface ServiceSelectorProps {
  services: Service[]
}

export function ServiceSelector({ services }: ServiceSelectorProps) {
  const router = useRouter()
  const { items, addItem, subtotal, total } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<string>(SERVICE_CATEGORIES[0].id)

  const filteredServices = services.filter((s) => s.category === selectedCategory)

  function handleAddService(service: Service) {
    addItem(service)
    toast.success(`${service.name} added to cart`)
  }

  function handleContinue() {
    if (items.length === 0) {
      toast.error('Please add at least one service')
      return
    }
    router.push('/book/items')
  }

  return (
    <div className="grid lg:grid-cols-[1fr,320px] gap-8">
      <div>
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SERVICE_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className="gap-2"
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </Button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  <span className="text-lg font-bold text-primary shrink-0">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {service.description}
                  </p>
                )}
                <Button
                  onClick={() => handleAddService(service)}
                  size="sm"
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="lg:sticky lg:top-4 h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items yet. Add services to get started.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.service.name}</span>
                      <span>{formatPrice(item.service.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pickup & Delivery</span>
                    <span>{formatPrice(7)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total())}</span>
                  </div>
                </div>

                <Button onClick={handleContinue} className="w-full" size="lg">
                  Continue
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
