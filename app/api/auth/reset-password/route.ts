import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp, newPassword } = body

    // Validate input
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: 'Password reset failed' },
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

    // Verify reset OTP
    const storedOtp = user.user_metadata?.reset_otp
    const otpExpiry = user.user_metadata?.reset_otp_expiry

    if (!storedOtp || !otpExpiry) {
      return NextResponse.json(
        { error: 'Reset code not found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if OTP expired
    if (new Date() > new Date(otpExpiry)) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if OTP matches
    if (storedOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid reset code' },
        { status: 400 }
      )
    }

    // Update password and clear reset OTP
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        user_metadata: {
          ...user.user_metadata,
          reset_otp: null,
          reset_otp_expiry: null
        }
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
