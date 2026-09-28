import { describe, it, expect } from 'vitest'
import {
  deliveryFeeFor,
  orderTotal,
  isDropoffAvailable,
  formatDropoffAddress,
  validateOrderDetails,
  initialStatusFor,
  statusLabelFor,
} from '@/lib/fulfilment'
import { DELIVERY_FEE } from '@/lib/constants'
import type { DropoffLocation } from '@/lib/types'

const LOCATION: DropoffLocation = {
  enabled: true,
  name: 'TailorSpace',
  line1: '12 Example Street',
  city: 'Nottingham',
  postcode: 'NG1 1AA',
  hours: 'Mon-Sat, 9:00am - 6:00pm',
}

describe('delivery fee', () => {
  it('charges the delivery fee for a runner pickup', () => {
    expect(deliveryFeeFor('pickup')).toBe(DELIVERY_FEE)
    expect(orderTotal(24, 'pickup')).toBe(24 + DELIVERY_FEE)
  })

  it('charges nothing for a drop-off, which has no runner on either leg', () => {
    expect(deliveryFeeFor('dropoff')).toBe(0)
    expect(orderTotal(24, 'dropoff')).toBe(24)
  })
})

describe('isDropoffAvailable', () => {
  it('offers drop-off once the location is enabled and addressed', () => {
    expect(isDropoffAvailable(LOCATION)).toBe(true)
  })

  it('hides drop-off when it is disabled or the address is incomplete', () => {
    expect(isDropoffAvailable({ ...LOCATION, enabled: false })).toBe(false)
    expect(isDropoffAvailable({ ...LOCATION, line1: '   ' })).toBe(false)
    expect(isDropoffAvailable({ ...LOCATION, postcode: '' })).toBe(false)
    expect(isDropoffAvailable(null)).toBe(false)
  })

  it('formats the address without empty parts', () => {
    expect(formatDropoffAddress(LOCATION)).toBe(
      'TailorSpace, 12 Example Street, Nottingham, NG1 1AA'
    )
  })
})

describe('validateOrderDetails', () => {
  const pickup = {
    fulfilment: 'pickup' as const,
    paymentMethod: 'online' as const,
    phone: '07123 456789',
    address: { line1: '1 High St', city: 'Nottingham', postcode: 'NG1 1AA' },
    pickupDate: '2026-10-01',
    pickupSlot: 'morning',
  }

  it('accepts a complete pickup order', () => {
    expect(validateOrderDetails(pickup)).toBeNull()
  })

  it('requires an address and a slot for pickup', () => {
    expect(validateOrderDetails({ ...pickup, address: null })).toMatch(/address/i)
    expect(validateOrderDetails({ ...pickup, pickupSlot: null })).toMatch(/pickup date/i)
  })

  it('accepts a drop-off with only a phone number and a date', () => {
    expect(
      validateOrderDetails({
        fulfilment: 'dropoff',
        paymentMethod: 'in_person',
        phone: '07123 456789',
        dropoffDate: '2026-10-01',
      })
    ).toBeNull()
  })

  it('requires a drop-off date', () => {
    expect(
      validateOrderDetails({
        fulfilment: 'dropoff',
        paymentMethod: 'in_person',
        phone: '07123 456789',
      })
    ).toMatch(/drop your items off/i)
  })

  it('refuses pay-in-person on a pickup order, which has no counter', () => {
    expect(validateOrderDetails({ ...pickup, paymentMethod: 'in_person' })).toMatch(
      /only available for drop-off/i
    )
  })

  it('always requires a phone number', () => {
    expect(validateOrderDetails({ ...pickup, phone: '  ' })).toMatch(/phone/i)
  })
})

describe('initialStatusFor', () => {
  it('confirms a pay-in-person order immediately', () => {
    expect(initialStatusFor('in_person')).toBe('booked')
  })

  it('holds an online order until Stripe confirms', () => {
    expect(initialStatusFor('online')).toBe('pending_payment')
  })
})

describe('statusLabelFor', () => {
  it('rewords the shared statuses for drop-off orders', () => {
    expect(statusLabelFor('collected', 'dropoff', 'Collected')).toBe('Received')
    expect(statusLabelFor('completed', 'dropoff', 'Completed')).toBe('Collected by customer')
    expect(statusLabelFor('booked', 'dropoff', 'Booked')).toBe('Awaiting drop-off')
  })

  it('leaves pickup orders and unmapped statuses alone', () => {
    expect(statusLabelFor('collected', 'pickup', 'Collected')).toBe('Collected')
    expect(statusLabelFor('in_progress', 'dropoff', 'In Progress')).toBe('In Progress')
  })
})
