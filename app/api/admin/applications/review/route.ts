import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendApplicationApprovalEmail, sendApplicationRejectionEmail } from '@/lib/email'

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
    const { application_id, action, rejection_reason } = body

    if (!application_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get application
    const { data: application, error: fetchError } = await adminClient
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application has already been reviewed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase()

      // Create auth user
      const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
        email: application.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.full_name,
          phone: application.phone,
          role: application.application_type,
        }
      })

      if (authCreateError) {
        console.error('Error creating auth user:', authCreateError)
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        )
      }

      const userId = authData.user.id

      // Profile creation will be handled by the database trigger (handle_new_user)
      // We just need to update the specific profile table

      if (application.application_type === 'runner') {
        // Create runner profile
        const { error: profileError } = await adminClient
          .from('runner_profiles')
          .insert({
            user_id: userId,
            postcode_coverage: application.postcode_coverage || [],
            max_daily_capacity: 10,
            rating: 5.0,
            total_reviews: 0,
            completed_jobs: 0,
            active: true,
          })

        if (profileError) {
          console.error('Error creating runner profile:', profileError)
          // Rollback: delete auth user
          await adminClient.auth.admin.deleteUser(userId)
          return NextResponse.json(
            { error: 'Failed to create runner profile' },
            { status: 500 }
          )
        }
      } else if (application.application_type === 'tailor') {
        // Create tailor profile
        const { error: profileError } = await adminClient
          .from('tailor_profiles')
          .insert({
            user_id: userId,
            specializations: application.specializations || [],
            max_concurrent_orders: 20,
            rating: 5.0,
            total_reviews: 0,
            completed_jobs: 0,
            active: true,
          })

        if (profileError) {
          console.error('Error creating tailor profile:', profileError)
          // Rollback: delete auth user
          await adminClient.auth.admin.deleteUser(userId)
          return NextResponse.json(
            { error: 'Failed to create tailor profile' },
            { status: 500 }
          )
        }
      }

      // Update application
      const { error: updateError } = await adminClient
        .from('applications')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          user_id: userId,
        })
        .eq('id', application_id)

      if (updateError) {
        console.error('Error updating application:', updateError)
        return NextResponse.json(
          { error: 'Failed to update application' },
          { status: 500 }
        )
      }

      // Send approval email
      const emailResult = await sendApplicationApprovalEmail(
        application.email,
        application.full_name,
        application.application_type,
        tempPassword
      )

      if (!emailResult.success) {
        console.error('Failed to send approval email:', emailResult.error)
        // Don't fail the request, just log the error
      }

      return NextResponse.json({
        success: true,
        message: 'Application approved and user account created'
      })

    } else {
      // Reject application
      const { error: updateError } = await adminClient
        .from('applications')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason,
        })
        .eq('id', application_id)

      if (updateError) {
        console.error('Error updating application:', updateError)
        return NextResponse.json(
          { error: 'Failed to update application' },
          { status: 500 }
        )
      }

      // Send rejection email
      const emailResult = await sendApplicationRejectionEmail(
        application.email,
        application.full_name,
        application.application_type,
        rejection_reason
      )

      if (!emailResult.success) {
        console.error('Failed to send rejection email:', emailResult.error)
        // Don't fail the request, just log the error
      }

      return NextResponse.json({
        success: true,
        message: 'Application rejected'
      })
    }

  } catch (error: any) {
    console.error('Application review error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
