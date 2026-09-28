import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDropoffAvailable } from '@/lib/fulfilment'
import type { DropoffLocation } from '@/lib/types'

/**
 * The drop-off point shown during booking. Public: the booking flow needs it
 * before anyone signs in. Returns available:false until an admin has filled in
 * the address and switched it on, so a half-configured location is never
 * offered to a customer.
 */
// Read fresh: admins change this in settings and it must take effect at once
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'dropoff_location')
      .maybeSingle()

    if (error) throw error

    const location = (data?.value ?? null) as DropoffLocation | null

    if (!isDropoffAvailable(location)) {
      return NextResponse.json({ available: false, location: null })
    }

    return NextResponse.json({ available: true, location })
  } catch (error: any) {
    console.error('Failed to load drop-off location:', error)
    // Fall back to pickup-only rather than blocking the booking flow
    return NextResponse.json({ available: false, location: null })
  }
}
