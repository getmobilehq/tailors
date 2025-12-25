import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
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

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for simplicity
    })

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

    // Step 2: Create profile using admin client (bypasses RLS completely)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        phone,
        role: 'customer',
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)

      // Try to clean up the auth user if profile fails
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          details: profileError.message
        },
        { status: 500 }
      )
    }

    // Send welcome email (don't block response if it fails)
    sendWelcomeEmail(email, full_name).catch(err => {
      console.error('Failed to send welcome email:', err)
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
