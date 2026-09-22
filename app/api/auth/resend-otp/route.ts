import { createAdminClient } from '@/lib/supabase/admin'
import { findAuthUserByEmail } from '@/lib/supabase/find-user'
import { NextResponse } from 'next/server'
import { reissueVerificationOtp } from '@/lib/verification-otp'
import { strictAuthLimiter, applyRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Apply rate limiting: 5 requests per hour per IP
  const rateLimitResponse = await applyRateLimit(request, strictAuthLimiter, 5)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get user by email
    let user
    try {
      user = await findAuthUserByEmail(supabase, email)
    } catch (lookupError) {
      console.error('Error looking up user:', lookupError)
      return NextResponse.json(
        { error: 'Failed to resend code' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    const result = await reissueVerificationOtp(supabase, user, email)

    if (!result.ok) {
      if (result.stage === 'update') {
        console.error('Error updating user:', result.error)
        return NextResponse.json(
          { error: 'Failed to generate new code' },
          { status: 500 }
        )
      }
      console.error('Failed to send verification email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code resent successfully'
    })

  } catch (error: any) {
    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
