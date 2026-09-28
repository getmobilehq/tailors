import { Badge } from '@/components/ui/badge'
import { ORDER_STATUSES } from '@/lib/constants'
import { statusLabelFor } from '@/lib/fulfilment'
import type { FulfilmentType, OrderStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: OrderStatus
  showIcon?: boolean
  /** Drop-off orders reuse 'collected'/'completed' with different wording */
  fulfilment?: FulfilmentType
}

// Phase icons based on branding guide
const PHASE_ICONS: Record<string, string> = {
  booking: '📱',
  pickup: '🚗',
  processing: '✂️',
  qc: '✅',
  delivery: '📦',
  complete: '⭐',
  cancelled: '❌',
}

export function StatusBadge({ status, showIcon = false, fulfilment = 'pickup' }: StatusBadgeProps) {
  const config = ORDER_STATUSES[status]

  if (!config) return null

  // Map phase to badge variant
  const variantMap: Record<string, any> = {
    booking: 'booking',
    pickup: 'pickup',
    processing: 'processing',
    qc: 'qc',
    delivery: 'delivery',
    complete: 'complete',
    cancelled: 'destructive',
  }

  const variant = variantMap[config.phase] || 'secondary'
  const icon = PHASE_ICONS[config.phase]

  return (
    <Badge variant={variant as any}>
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {statusLabelFor(status, fulfilment, config.label)}
    </Badge>
  )
}
