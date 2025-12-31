'use client'

import { ImageGallery } from '@/components/ui/image-gallery'
import { ZoomableImage } from '@/components/ui/zoomable-image'

interface OrderItemPhotosProps {
  photos: string[]
  description: string
  variant?: 'thumbnail' | 'gallery'
}

/**
 * Display order item photos with zoom functionality
 * - variant="thumbnail": Shows single thumbnail (for list views)
 * - variant="gallery": Shows full gallery grid (for detail views)
 */
export function OrderItemPhotos({
  photos,
  description,
  variant = 'thumbnail'
}: OrderItemPhotosProps) {
  if (!photos || photos.length === 0) {
    return null
  }

  // Single thumbnail for list views
  if (variant === 'thumbnail') {
    return (
      <div className="w-20 h-20 flex-shrink-0">
        <ZoomableImage
          src={photos[0]}
          alt={description}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    )
  }

  // Full gallery for detail views
  return (
    <ImageGallery
      images={photos}
      alt={description}
      showThumbnailCount={true}
    />
  )
}
