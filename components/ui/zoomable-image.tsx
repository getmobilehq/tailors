'use client'

import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { cn } from '@/lib/utils'

interface ZoomableImageProps {
  src: string
  alt: string
  className?: string
  wrapperClassName?: string
  zoomMargin?: number
}

/**
 * A simple zoomable image component that opens in a modal when clicked
 * Uses react-medium-image-zoom for smooth zoom transitions
 */
export function ZoomableImage({
  src,
  alt,
  className,
  wrapperClassName,
  zoomMargin = 40
}: ZoomableImageProps) {
  return (
    <Zoom zoomMargin={zoomMargin}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'cursor-zoom-in',
          className
        )}
      />
    </Zoom>
  )
}
