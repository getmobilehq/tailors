'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ZoomableImage } from './zoomable-image'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  thumbnailClassName?: string
  showThumbnailCount?: boolean
}

/**
 * Image gallery with lightbox and zoom functionality
 * - Click thumbnail to open lightbox
 * - Navigate between images with arrows or keyboard
 * - Click image in lightbox to zoom
 */
export function ImageGallery({
  images,
  alt = 'Image',
  thumbnailClassName,
  showThumbnailCount = false
}: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') setIsOpen(false)
  }

  return (
    <>
      {/* Thumbnails Grid */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              'relative group aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary transition-colors',
              thumbnailClassName
            )}
            onClick={() => {
              setCurrentIndex(index)
              setIsOpen(true)
            }}
          >
            <img
              src={image}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>
            {/* Count badge on first image */}
            {showThumbnailCount && index === 0 && images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{images.length - 1}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-7xl w-full h-[90vh] p-0"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation arrows (only show if multiple images) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Main image with zoom */}
            <div className="flex-1 flex items-center justify-center p-4 bg-black/95">
              <ZoomableImage
                src={images[currentIndex]}
                alt={`${alt} ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                zoomMargin={20}
              />
            </div>

            {/* Thumbnail strip (only show if multiple images) */}
            {images.length > 1 && (
              <div className="bg-black/90 p-4 border-t border-gray-700">
                <div className="flex gap-2 justify-center overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        'flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all',
                        index === currentIndex
                          ? 'border-primary scale-110'
                          : 'border-gray-600 hover:border-gray-400 opacity-60 hover:opacity-100'
                      )}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard hints */}
            {images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 text-white/60 text-xs">
                Use ← → arrow keys to navigate
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
