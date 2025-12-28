'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CartSummary } from '@/components/booking/cart-summary'
import { PhotoUpload } from '@/components/booking/photo-upload'
import { useCart } from '@/hooks/use-cart'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ItemsContent() {
  const router = useRouter()
  const { items, updateItem, removeItem } = useCart()

  if (items.length === 0) {
    router.push('/book')
    return null
  }

  function handleContinue() {
    // Validate all items have descriptions
    const missingDescription = items.some(item => !item.garment_description.trim())
    if (missingDescription) {
      toast.error('Please describe all garments')
      return
    }

    router.push('/book/schedule')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Describe Your Items</h1>
          <p className="text-muted-foreground">
            Add photos and details for each garment
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/book" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-8">
        <div className="space-y-6">
          {items.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.service.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeItem(index)
                      toast.success('Item removed')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>
                    Garment Description <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`description-${index}`}
                    placeholder="e.g., Navy blue suit trousers, size 32"
                    value={item.garment_description}
                    onChange={(e) => updateItem(index, { garment_description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photos (Optional)</Label>
                  <PhotoUpload
                    photos={item.photos}
                    onPhotosChange={(photos) => updateItem(index, { photos })}
                    maxPhotos={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes-${index}`}>Additional Notes (Optional)</Label>
                  <Textarea
                    id={`notes-${index}`}
                    placeholder="Any specific instructions or concerns?"
                    value={item.notes}
                    onChange={(e) => updateItem(index, { notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-4 h-fit space-y-4">
          <CartSummary />
          <Button onClick={handleContinue} className="w-full gap-2" size="lg">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
