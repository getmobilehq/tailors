import { DELIVERY_FEE, RETURN_POSTAGE_FEE } from '@/lib/constants'
import type { FulfilmentType, PaymentMethod, OrderStatus, DropoffLocation } from '@/lib/types'

/** Fees that vary by fulfilment type. Defaults come from constants. */
export type FeeConfig = {
  /** Runner pickup and delivery */
  delivery?: number
  /** Royal Mail return postage on a postal order */
  returnPostage?: number
}

/**
 * Drop-off has no runner and no postage on either leg, so it carries no fee.
 * Postal carries the Royal Mail cost of sending the finished items back; the
 * customer pays their own courier to send them in.
 */
export function deliveryFeeFor(fulfilment: FulfilmentType, fees: FeeConfig = {}): number {
  if (fulfilment === 'dropoff') return 0
  if (fulfilment === 'postal') return fees.returnPostage ?? RETURN_POSTAGE_FEE
  return fees.delivery ?? DELIVERY_FEE
}

export function orderTotal(
  subtotal: number,
  fulfilment: FulfilmentType,
  fees: FeeConfig = {}
): number {
  return subtotal + deliveryFeeFor(fulfilment, fees)
}

/** What the fee line is called on the customer's order summary. */
export function feeLabelFor(fulfilment: FulfilmentType): string {
  if (fulfilment === 'postal') return 'Return postage (Royal Mail)'
  return 'Pickup & Delivery'
}

/** A location is only offerable once someone has filled in the address. */
function hasAddress(location: DropoffLocation | null | undefined): boolean {
  return Boolean(location?.line1?.trim() && location.postcode?.trim())
}

export function isDropoffAvailable(location: DropoffLocation | null | undefined): boolean {
  return Boolean(location?.enabled) && hasAddress(location)
}

/** Postal is switched on separately: parcels need no walk-in counter. */
export function isPostalAvailable(location: DropoffLocation | null | undefined): boolean {
  return Boolean(location?.postalEnabled) && hasAddress(location)
}

export function formatDropoffAddress(location: DropoffLocation): string {
  return [location.name, location.line1, location.line2, location.city, location.postcode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

/**
 * UK postcode, loosely validated: enough to catch typos without rejecting a
 * valid address from an area we have never seen. Case and spacing are free.
 */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export function isValidUkPostcode(postcode: string): boolean {
  return UK_POSTCODE.test(postcode.trim())
}

/**
 * Runner pickups only happen around Nottingham. Deliberately the same loose
 * "starts with NG" test checkout has always used - tightening it to the six
 * advertised districts would turn away NG4/NG8 customers who can order today.
 */
export function isInPickupArea(postcode: string): boolean {
  const compact = postcode.trim().toUpperCase().replace(/\s+/g, '')
  return compact.startsWith('NG')
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
 * What each fulfilment type actually requires. Pickup needs an address in the
 * service area and a slot for the runner; drop-off needs only the day the
 * customer plans to come; postal needs an address anywhere in the UK to send
 * the finished items back to.
 *
 * Paying in person is drop-off only - there is no counter to pay at when a
 * runner calls at the door or a parcel arrives in the post.
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
    return input.fulfilment === 'postal'
      ? 'A return address is required'
      : 'A collection address is required'
  }

  if (!isValidUkPostcode(address.postcode)) {
    return 'Please enter a valid UK postcode'
  }

  if (input.fulfilment === 'postal') return null

  if (!isInPickupArea(address.postcode)) {
    return 'We only collect from Nottingham postcodes - choose drop-off or post instead'
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

const POSTAL_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  booked: 'Awaiting your parcel',
  collected: 'Parcel received',
  ready: 'Ready to post back',
  completed: 'Posted back',
}

/**
 * 'collected' means "a runner picked it up" for a pickup order, "the customer
 * handed it in" for a drop-off and "the parcel arrived" for a postal order, so
 * the wording differs by type.
 */
export function statusLabelFor(
  status: OrderStatus,
  fulfilment: FulfilmentType,
  fallback: string
): string {
  if (fulfilment === 'dropoff') return DROPOFF_STATUS_LABELS[status] ?? fallback
  if (fulfilment === 'postal') return POSTAL_STATUS_LABELS[status] ?? fallback
  return fallback
}

/** The statuses a drop-off or postal order actually moves through, in order. */
export const DROPOFF_STATUS_FLOW: OrderStatus[] = [
  'booked',
  'collected',
  'in_progress',
  'ready',
  'completed',
]

/** Royal Mail's public tracking page for a given tracking number. */
export function royalMailTrackingUrl(trackingNumber: string): string {
  return `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(
    trackingNumber.trim()
  )}`
}
