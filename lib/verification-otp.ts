import { randomInt } from 'crypto'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { sendVerificationEmail } from '@/lib/email'

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

/** A fresh 6-digit code and its expiry, from a cryptographically secure source. */
export function generateOtp() {
  return {
    otp: randomInt(100000, 1000000).toString(),
    otpExpiry: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  }
}

export type ReissueResult =
  | { ok: true }
  | { ok: false; stage: 'update' | 'send'; error: unknown }

/**
 * Replace an unverified user's code with a new one and email it. Used by the
 * resend button and by signup when the email already has an unverified account.
 */
export async function reissueVerificationOtp(
  supabase: SupabaseClient,
  user: User,
  email: string
): Promise<ReissueResult> {
  const { otp, otpExpiry } = generateOtp()

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      otp,
      otp_expiry: otpExpiry,
    },
  })

  if (updateError) {
    return { ok: false, stage: 'update', error: updateError }
  }

  const full_name = user.user_metadata?.full_name || 'there'
  const emailResult = await sendVerificationEmail(email, full_name, otp)

  if (!emailResult.success) {
    return { ok: false, stage: 'send', error: emailResult.error }
  }

  return { ok: true }
}
