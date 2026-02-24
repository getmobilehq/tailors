import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeSignature } from '@/lib/recovery'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('uid')
  const signature = searchParams.get('sig')

  if (!userId || !signature) {
    return NextResponse.redirect(new URL('/unsubscribe/error', request.url))
  }

  // Verify signature
  if (!verifyUnsubscribeSignature(userId, signature)) {
    return NextResponse.redirect(new URL('/unsubscribe/error', request.url))
  }

  const supabase = createAdminClient()

  // Update email preferences
  const { data: user } = await supabase
    .from('users')
    .select('email_preferences')
    .eq('id', userId)
    .single()

  const currentPrefs = (user?.email_preferences as any) || {}
  const updatedPrefs = { ...currentPrefs, cart_reminders: false }

  await supabase
    .from('users')
    .update({ email_preferences: updatedPrefs })
    .eq('id', userId)

  return NextResponse.redirect(new URL('/unsubscribe/success', request.url))
}
