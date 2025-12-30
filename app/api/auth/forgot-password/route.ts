import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
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
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email === email)

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.'
      })
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Please verify your email first before resetting password.' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP for password reset
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Update user metadata with reset OTP
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          reset_otp: resetOtp,
          reset_otp_expiry: resetOtpExpiry
        }
      }
    )

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to generate reset code' },
        { status: 500 }
      )
    }

    // Send password reset email
    const full_name = user.user_metadata?.full_name || 'there'
    const emailResult = await sendPasswordResetEmail(email, full_name, resetOtp)

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your email'
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
