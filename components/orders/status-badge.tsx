import { Badge } from '@/components/ui/badge'
import { ORDER_STATUSES, STATUS_COLORS } from '@/lib/constants'
import type { OrderStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: OrderStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = ORDER_STATUSES[status]
  
  if (!config) return null

  const colorClass = STATUS_COLORS[config.color] || STATUS_COLORS.gray

  return (
    <Badge variant="secondary" className={colorClass}>
      {config.label}
    </Badge>
  )
}
