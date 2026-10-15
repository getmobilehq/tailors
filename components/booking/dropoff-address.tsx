import { MapPin, Clock } from 'lucide-react'
import type { DropoffLocation } from '@/lib/types'

export function DropoffAddress({
  location,
  mode = 'dropoff',
}: {
  location: DropoffLocation
  /** Picks which set of instructions to show - they differ by route */
  mode?: 'dropoff' | 'postal'
}) {
  const instructions =
    mode === 'postal' ? location.postalInstructions : location.instructions

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex gap-3">
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <div className="font-semibold">{location.name}</div>
          <div className="text-muted-foreground">
            {location.line1}
            {location.line2 && <>, {location.line2}</>}
            <br />
            {location.city} {location.postcode}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Clock className="h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm text-muted-foreground">{location.hours}</div>
      </div>

      {instructions && (
        <p className="text-sm text-muted-foreground border-t pt-3">{instructions}</p>
      )}
    </div>
  )
}
