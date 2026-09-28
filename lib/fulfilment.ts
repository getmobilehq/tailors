import { DELIVERY_FEE } from '@/lib/constants'
import type { FulfilmentType, PaymentMethod, OrderStatus, DropoffLocation } from '@/lib/types'

/**
 * Drop-off orders have no runner on either leg - the customer brings the items
 * in and takes them home again - so they carry no delivery fee.
 */
export function deliveryFeeFor(fulfilment: FulfilmentType): number {
  return fulfilment === 'dropoff' ? 0 : DELIVERY_FEE
}

export function orderTotal(subtotal: number, fulfilment: FulfilmentType): number {
  return subtotal + deliveryFeeFor(fulfilment)
}

/** A location is only offerable once someone has filled in the address. */
export function isDropoffAvailable(location: DropoffLocation | null | undefined): boolean {
  return Boolean(location?.enabled && location.line1?.trim() && location.postcode?.trim())
}

export function formatDropoffAddress(location: DropoffLocation): string {
  return [location.name, location.line1, location.line2, location.city, location.postcode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

export type OrderDetailsInput = {
  fulfilment: FulfilmentType
  paymentMethod: PaymentMethod
  address?: { line1?: string; city?: string; postcode?: string } | null
  phone?: string | null
  pickupDate?: string | null
  pickupSlot?: string | null
  dropoffDate?: string | null
}

/**
 * What each fulfilment type actually requires. Pickup needs an address and a
 * slot for the runner; drop-off needs only the day the customer plans to come.
 * Paying in person is a drop-off-only option - there is no counter to pay at
 * when a runner collects from the door.
 */
export function validateOrderDetails(input: OrderDetailsInput): string | null {
  if (!input.phone?.trim()) return 'Phone number is required'

  if (input.fulfilment === 'dropoff') {
    if (!input.dropoffDate) return 'Please choose the day you will drop your items off'
    return null
  }

  if (input.paymentMethod === 'in_person') {
    return 'Paying in person is only available for drop-off orders'
  }

  const { address } = input
  if (!address?.line1?.trim() || !address?.city?.trim() || !address?.postcode?.trim()) {
    return 'A collection address is required'
  }
  if (!input.pickupDate || !input.pickupSlot) {
    return 'Please choose a pickup date and time'
  }

  return null
}

/**
 * An order paid at the counter is confirmed the moment it is placed; a card
 * payment online only becomes an order once Stripe says it went through.
 */
export function initialStatusFor(paymentMethod: PaymentMethod): OrderStatus {
  return paymentMethod === 'in_person' ? 'booked' : 'pending_payment'
}

const DROPOFF_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  booked: 'Awaiting drop-off',
  collected: 'Received',
  completed: 'Collected by customer',
}

/**
 * 'collected' means "a runner picked it up" for a pickup order and "the
 * customer handed it in" for a drop-off, so the wording differs by type.
 */
export function statusLabelFor(
  status: OrderStatus,
  fulfilment: FulfilmentType,
  fallback: string
): string {
  if (fulfilment !== 'dropoff') return fallback
  return DROPOFF_STATUS_LABELS[status] ?? fallback
}

/** The statuses a drop-off order actually moves through, in order. */
export const DROPOFF_STATUS_FLOW: OrderStatus[] = [
  'booked',
  'collected',
  'in_progress',
  'ready',
  'completed',
]
