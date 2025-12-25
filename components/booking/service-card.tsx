'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/lib/types'
import { Plus, Check } from 'lucide-react'
import { useState } from 'react'

interface ServiceCardProps {
  service: Service
  onAdd: (service: Service) => void
}

export function ServiceCard({ service, onAdd }: ServiceCardProps) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd(service)
    setAdded(true)
    setTimeout(() => setAdded(false), 1000)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{service.name}</CardTitle>
          <span className="font-semibold text-primary whitespace-nowrap">
            {formatPrice(service.price)}
          </span>
        </div>
        {service.description && (
          <CardDescription className="text-sm">{service.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={handleAdd} 
          className="w-full" 
          size="sm"
          variant={added ? "secondary" : "default"}
        >
          {added ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Added
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
