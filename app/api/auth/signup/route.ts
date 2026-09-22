import { createAdminClient } from '@/lib/supabase/admin'
import { findAuthUserByEmail } from '@/lib/supabase/find-user'
import { NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { generateOtp, reissueVerificationOtp } from '@/lib/verification-otp'
import { authLimiter, applyRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Every signup sends an email, so cap it per IP: 5 requests per minute
  const rateLimitResponse = await applyRateLimit(request, authLimiter, 5)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email, password, full_name, phone } = body

    // Validate input
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use admin client with service role key (bypasses RLS)
    const supabase = createAdminClient()

    const { otp, otpExpiry } = generateOtp()

    // Step 1: Create auth user with metadata (trigger will auto-create profile)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require OTP verification
      user_metadata: {
        full_name,
        phone,
        role: 'customer',
        otp,
        otp_expiry: otpExpiry
      }
    })

    if (authError?.code === 'email_exists') {
      return handleExistingAccount(supabase, email)
    }

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Profile is auto-created by database trigger (handle_new_user)

    // Send OTP verification email
    const emailResult = await sendVerificationEmail(email, full_name, otp)

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // User is created but email failed - they can use resend functionality
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        message: 'Account created but email failed to send. Please use the resend button.',
        emailFailed: true
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: 'Verification code sent to your email'
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Someone signing up with an email that already has an account. If that
 * account was never verified - typically because the first code never arrived -
 * send a fresh code and route them to verification instead of dead-ending.
 *
 * The existing password is kept on purpose. Overwriting it would let anyone who
 * knows a pending customer's email set the password, then have the real owner
 * verify the account for them by entering the code from their own inbox.
 */
async function handleExistingAccount(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
) {
  const user = await findAuthUserByEmail(supabase, email)

  if (!user || user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Please sign in instead.' },
      { status: 409 }
    )
  }

  const result = await reissueVerificationOtp(supabase, user, email)

  if (!result.ok) {
    console.error('Failed to reissue verification code on repeat signup:', result.error)
    return NextResponse.json({
      success: true,
      message: 'You already started signing up, but we could not send a new code. Please use the resend button.',
      emailFailed: true,
    })
  }

  return NextResponse.json({
    success: true,
    message: 'You already started signing up - we have sent you a new code. Use the password you chose the first time.',
  })
}
