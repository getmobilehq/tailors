import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify admin user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, active } = body

    if (!user_id || active === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prevent self-suspension
    if (user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot modify your own account status' },
        { status: 400 }
      )
    }

    // Get target user to check if they're an admin
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user_id)
      .single()

    if (targetUser?.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin users' },
        { status: 400 }
      )
    }

    // Update user status
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('users')
      .update({ active })
      .eq('id', user_id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${active ? 'activated' : 'suspended'} successfully`
    })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
