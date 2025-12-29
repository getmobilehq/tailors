import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Use admin client
    const supabase = createAdminClient()

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email === email)

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

    // Verify OTP
    const storedOtp = user.user_metadata?.otp
    const otpExpiry = user.user_metadata?.otp_expiry

    if (!storedOtp || !otpExpiry) {
      return NextResponse.json(
        { error: 'Verification code not found' },
        { status: 400 }
      )
    }

    // Check if OTP expired
    if (new Date() > new Date(otpExpiry)) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      )
    }

    // Check if OTP matches
    if (storedOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Verify the email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
        user_metadata: {
          ...user.user_metadata,
          otp: null,
          otp_expiry: null
        }
      }
    )

    if (updateError) {
      console.error('Error verifying email:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    // Send welcome email
    const full_name = user.user_metadata?.full_name || 'there'
    sendWelcomeEmail(email, full_name).catch(err => {
      console.error('Failed to send welcome email:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })

  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
