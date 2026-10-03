import { describe, it, expect } from 'vitest'
import {
  deliveryFeeFor,
  feeLabelFor,
  isPostalAvailable,
  isValidUkPostcode,
  isInPickupArea,
  royalMailTrackingUrl,
  orderTotal,
  isDropoffAvailable,
  formatDropoffAddress,
  validateOrderDetails,
  initialStatusFor,
  statusLabelFor,
} from '@/lib/fulfilment'
import { DELIVERY_FEE, RETURN_POSTAGE_FEE } from '@/lib/constants'
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

  it('charges Royal Mail return postage on a postal order', () => {
    expect(deliveryFeeFor('postal')).toBe(RETURN_POSTAGE_FEE)
    expect(orderTotal(24, 'postal')).toBe(24 + RETURN_POSTAGE_FEE)
  })

  it('prefers the configured fees over the built-in defaults', () => {
    expect(deliveryFeeFor('postal', { returnPostage: 7.5 })).toBe(7.5)
    expect(deliveryFeeFor('pickup', { delivery: 8 })).toBe(8)
    // A configured fee never reintroduces a charge on drop-off
    expect(deliveryFeeFor('dropoff', { returnPostage: 7.5, delivery: 8 })).toBe(0)
  })

  it('names the fee line for the fulfilment type', () => {
    expect(feeLabelFor('postal')).toMatch(/royal mail/i)
    expect(feeLabelFor('pickup')).toMatch(/delivery/i)
  })
})

describe('postcodes', () => {
  it('accepts UK postcodes from anywhere, however they are spaced', () => {
    for (const pc of ['NG1 1AA', 'sw1a2aa', 'EH1 1YZ', 'M1 1AE', 'B33 8TH', 'CR2 6XH']) {
      expect(isValidUkPostcode(pc)).toBe(true)
    }
  })

  it('rejects obvious nonsense', () => {
    for (const pc of ['', 'hello', '12345', 'NG1']) {
      expect(isValidUkPostcode(pc)).toBe(false)
    }
  })

  it('limits runner pickups to Nottingham', () => {
    expect(isInPickupArea('NG7 2RD')).toBe(true)
    expect(isInPickupArea('ng1 1aa')).toBe(true)
    expect(isInPickupArea('SW1A 2AA')).toBe(false)
  })
})

describe('isPostalAvailable', () => {
  it('is independent of the walk-in drop-off switch', () => {
    expect(isPostalAvailable({ ...LOCATION, postalEnabled: true })).toBe(true)
    // Accepting parcels without running a walk-in counter is valid
    expect(
      isPostalAvailable({ ...LOCATION, enabled: false, postalEnabled: true })
    ).toBe(true)
    expect(isPostalAvailable(LOCATION)).toBe(false)
    expect(
      isPostalAvailable({ ...LOCATION, postalEnabled: true, postcode: '' })
    ).toBe(false)
  })
})

describe('royalMailTrackingUrl', () => {
  it('builds a tracking link', () => {
    expect(royalMailTrackingUrl(' AB123456789GB ')).toContain('AB123456789GB')
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

  it('accepts a postal order with a return address anywhere in the UK', () => {
    expect(
      validateOrderDetails({
        fulfilment: 'postal',
        paymentMethod: 'online',
        phone: '07123 456789',
        address: { line1: '9 Royal Mile', city: 'Edinburgh', postcode: 'EH1 1YZ' },
      })
    ).toBeNull()
  })

  it('requires a return address on a postal order', () => {
    expect(
      validateOrderDetails({
        fulfilment: 'postal',
        paymentMethod: 'online',
        phone: '07123 456789',
      })
    ).toMatch(/return address/i)
  })

  it('rejects a pickup outside Nottingham and points elsewhere', () => {
    expect(
      validateOrderDetails({
        ...pickup,
        address: { line1: '9 Royal Mile', city: 'Edinburgh', postcode: 'EH1 1YZ' },
      })
    ).toMatch(/only collect from nottingham/i)
  })

  it('rejects a malformed postcode on any addressed order', () => {
    expect(
      validateOrderDetails({ ...pickup, address: { ...pickup.address, postcode: 'nope' } })
    ).toMatch(/valid uk postcode/i)
  })

  it('refuses pay-in-person on a postal order, which has no counter', () => {
    expect(
      validateOrderDetails({
        fulfilment: 'postal',
        paymentMethod: 'in_person',
        phone: '07123 456789',
        address: { line1: '9 Royal Mile', city: 'Edinburgh', postcode: 'EH1 1YZ' },
      })
    ).toMatch(/only available for drop-off/i)
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

  it('rewords the shared statuses for postal orders', () => {
    expect(statusLabelFor('collected', 'postal', 'Collected')).toBe('Parcel received')
    expect(statusLabelFor('completed', 'postal', 'Completed')).toBe('Posted back')
  })

  it('leaves pickup orders and unmapped statuses alone', () => {
    expect(statusLabelFor('collected', 'pickup', 'Collected')).toBe('Collected')
    expect(statusLabelFor('in_progress', 'dropoff', 'In Progress')).toBe('In Progress')
  })
})
