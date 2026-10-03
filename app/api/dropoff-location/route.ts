import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDropoffAvailable, isPostalAvailable } from '@/lib/fulfilment'
import { RETURN_POSTAGE_FEE } from '@/lib/constants'
import type { DropoffLocation } from '@/lib/types'

/**
 * The address customers bring or post items to, plus which of those two
 * options is currently offered and what return postage costs. Public: the
 * booking flow needs it before anyone signs in. Each option stays hidden until
 * an admin has filled in the address and switched that option on, so a
 * half-configured location is never offered to a customer.
 */
// Read fresh: admins change this in settings and it must take effect at once
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['dropoff_location', 'return_postage_fee'])

    if (error) throw error

    const rows = data ?? []
    const location = (rows.find((r) => r.key === 'dropoff_location')?.value ??
      null) as DropoffLocation | null
    const feeSetting = rows.find((r) => r.key === 'return_postage_fee')?.value as
      | { amount?: number }
      | undefined

    const dropoffAvailable = isDropoffAvailable(location)
    const postalAvailable = isPostalAvailable(location)

    return NextResponse.json({
      // Kept for the drop-off flow, which asked for this field first
      available: dropoffAvailable,
      dropoffAvailable,
      postalAvailable,
      location: dropoffAvailable || postalAvailable ? location : null,
      returnPostageFee: feeSetting?.amount ?? RETURN_POSTAGE_FEE,
    })
  } catch (error: any) {
    console.error('Failed to load drop-off location:', error)
    // Fall back to pickup-only rather than blocking the booking flow
    return NextResponse.json({
      available: false,
      dropoffAvailable: false,
      postalAvailable: false,
      location: null,
      returnPostageFee: RETURN_POSTAGE_FEE,
    })
  }
}
