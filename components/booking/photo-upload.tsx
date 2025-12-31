'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ZoomableImage } from '@/components/ui/zoomable-image'

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 3 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (photos.length + files.length > maxPhotos) {
      toast.error(`You can upload a maximum of ${maxPhotos} photos`)
      return
    }

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

        // Get user ID or create a session-based folder for anonymous users
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id || `anon-${Date.now()}-${Math.random().toString(36).substring(2)}`
        const filePath = `${userId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('order-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('order-photos')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...photos, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} photo(s) uploaded successfully`)
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  function handleRemove(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
    toast.success('Photo removed')
  }

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square">
              <ZoomableImage
                src={photo}
                alt={`Uploaded garment photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              disabled={uploading}
              asChild
            >
              <div className="flex items-center justify-center gap-2">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    {photos.length === 0 ? <ImageIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    <span>
                      {photos.length === 0 ? 'Add Photos' : `Add More (${photos.length}/${maxPhotos})`}
                    </span>
                  </>
                )}
              </div>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Max {maxPhotos} photos, 5MB each. JPG, PNG, or WebP.
          </p>
        </div>
      )}
    </div>
  )
}
