import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminPasswordResetEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function generateTempPassword(): string {
  // 12 chars from an unambiguous alphabet (no 0/O/1/l/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (params.id === user.id) {
      return NextResponse.json({ error: 'Use account settings to change your own password' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const sendEmail: boolean = !!body?.sendEmail

    const admin = createAdminClient()

    const { data: targetRow, error: targetError } = await admin
      .from('users')
      .select('id, email, full_name')
      .eq('id', params.id)
      .single()

    if (targetError || !targetRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tempPassword = generateTempPassword()

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(params.id, {
      password: tempPassword,
    })

    if (updateAuthError) {
      return NextResponse.json({ error: updateAuthError.message }, { status: 500 })
    }

    const { error: flagError } = await admin
      .from('users')
      .update({ must_change_password: true })
      .eq('id', params.id)

    if (flagError) {
      return NextResponse.json({ error: flagError.message }, { status: 500 })
    }

    let emailed = false
    let emailError: string | null = null
    if (sendEmail && targetRow.email) {
      const result = await sendAdminPasswordResetEmail(
        targetRow.email,
        targetRow.full_name || 'there',
        tempPassword,
      )
      emailed = result.success
      if (!result.success) {
        emailError = 'Email delivery failed — share the password manually.'
      }
    }

    return NextResponse.json({
      success: true,
      tempPassword,
      emailed,
      emailError,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
