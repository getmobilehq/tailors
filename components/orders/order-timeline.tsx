'use client'

import { formatDate } from '@/lib/utils'
import type { OrderStatus, TimelineEntry } from '@/lib/types'
import {
  CheckCircle2,
  Clock,
  Package,
  Scissors,
  Truck,
  Home,
  Circle
} from 'lucide-react'

interface OrderTimelineProps {
  currentStatus: OrderStatus
  timeline?: TimelineEntry[]
}

const statusConfig: Record<OrderStatus, {
  label: string
  icon: any
  description: string
}> = {
  booked: {
    label: 'Order Placed',
    icon: CheckCircle2,
    description: 'Your order has been confirmed and paid'
  },
  pickup_scheduled: {
    label: 'Pickup Scheduled',
    icon: Clock,
    description: 'A runner has been assigned to collect your items'
  },
  collected: {
    label: 'Items Collected',
    icon: Package,
    description: 'Your items have been collected and are being processed'
  },
  in_progress: {
    label: 'Work in Progress',
    icon: Scissors,
    description: 'Your tailor is working on your alterations'
  },
  ready: {
    label: 'Ready for Delivery',
    icon: CheckCircle2,
    description: 'All work is complete, ready to be delivered'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    description: 'Your items are on their way back to you'
  },
  delivered: {
    label: 'Delivered',
    icon: Home,
    description: 'Your items have been delivered'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    description: 'Order complete - thank you!'
  },
  cancelled: {
    label: 'Cancelled',
    icon: Circle,
    description: 'This order was cancelled'
  }
}

const statusOrder: OrderStatus[] = [
  'booked',
  'pickup_scheduled',
  'collected',
  'in_progress',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed'
]

export function OrderTimeline({ currentStatus, timeline = [] }: OrderTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus)

  // Get timeline entry for a status if it exists
  const getTimelineEntry = (status: OrderStatus) => {
    return timeline.find(entry => entry.status === status)
  }

  return (
    <div className="space-y-1">
      {statusOrder.map((status, index) => {
        const config = statusConfig[status]
        const Icon = config.icon
        const isCompleted = index <= currentIndex
        const isCurrent = status === currentStatus
        const timelineEntry = getTimelineEntry(status)

        // Don't show future steps
        if (index > currentIndex + 1 && !isCurrent) {
          return null
        }

        return (
          <div key={status} className="flex gap-4 relative">
            {/* Vertical line */}
            {index < statusOrder.length - 1 && index <= currentIndex && (
              <div className="absolute left-5 top-10 w-0.5 h-full bg-primary/30" />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isCompleted
                ? 'bg-primary text-primary-foreground'
                : isCurrent
                ? 'bg-primary/20 text-primary border-2 border-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-semibold ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {config.label}
                </h4>
                {timelineEntry && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(timelineEntry.created_at)}
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                isCurrent || isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
              }`}>
                {config.description}
              </p>
              {timelineEntry?.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {timelineEntry.notes}
                </p>
              )}
              {isCurrent && !isCompleted && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-primary font-medium">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Current Status
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
