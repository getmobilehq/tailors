import { createClient } from '@/lib/supabase/server'
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
    const { review_id, is_visible, moderation_reason } = body

    if (!review_id || is_visible === undefined) {
      return NextResponse.json(
        { error: 'Review ID and visibility status are required' },
        { status: 400 }
      )
    }

    // If hiding review, require a reason
    if (!is_visible && !moderation_reason) {
      return NextResponse.json(
        { error: 'Moderation reason is required when hiding a review' },
        { status: 400 }
      )
    }

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', review_id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update review visibility
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        is_visible,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        moderation_reason: moderation_reason || null,
      })
      .eq('id', review_id)

    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json(
        { error: 'Failed to moderate review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Review ${is_visible ? 'made visible' : 'hidden'} successfully`
    })

  } catch (error: any) {
    console.error('Moderate review error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
