'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CartSummary } from '@/components/booking/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { ArrowLeft, ArrowRight, X, Upload } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ItemsPage() {
  const router = useRouter()
  const { items, updateItem, removeItem } = useCart()
  const [uploading, setUploading] = useState<number | null>(null)

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

  async function handlePhotoUpload(index: number, files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(index)
    
    // In a real app, upload to Supabase Storage
    // For now, create data URLs
    try {
      const photoPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      })

      const photos = await Promise.all(photoPromises)
      const currentPhotos = items[index].photos
      
      updateItem(index, {
        photos: [...currentPhotos, ...photos]
      })
      
      toast.success('Photos added')
    } catch (error) {
      toast.error('Failed to add photos')
    } finally {
      setUploading(null)
    }
  }

  function removePhoto(itemIndex: number, photoIndex: number) {
    const item = items[itemIndex]
    const updatedPhotos = item.photos.filter((_, i) => i !== photoIndex)
    updateItem(itemIndex, { photos: updatedPhotos })
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
                  <div className="grid grid-cols-3 gap-2">
                    {item.photos.map((photo, photoIndex) => (
                      <div key={photoIndex} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                        <img src={photo} alt="" className="object-cover w-full h-full" />
                        <button
                          onClick={() => removePhoto(index, photoIndex)}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {item.photos.length < 3 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(index, e.target.files)}
                          disabled={uploading === index}
                        />
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </label>
                    )}
                  </div>
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
