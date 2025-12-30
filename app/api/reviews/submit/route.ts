import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id, overall_rating, runner_rating, tailor_rating, comment } = body

    // Validate required fields
    if (!order_id || !overall_rating) {
      return NextResponse.json(
        { error: 'Order ID and overall rating are required' },
        { status: 400 }
      )
    }

    // Validate ratings are between 1 and 5
    if (overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json(
        { error: 'Overall rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (runner_rating && (runner_rating < 1 || runner_rating > 5)) {
      return NextResponse.json(
        { error: 'Runner rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (tailor_rating && (tailor_rating < 1 || tailor_rating > 5)) {
      return NextResponse.json(
        { error: 'Tailor rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, runner_id, tailor_id, status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify user owns the order
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only review your own orders' },
        { status: 403 }
      )
    }

    // Verify order is completed or delivered
    if (!['completed', 'delivered'].includes(order.status)) {
      return NextResponse.json(
        { error: 'You can only review completed orders' },
        { status: 400 }
      )
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'This order has already been reviewed' },
        { status: 400 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        order_id,
        customer_id: user.id,
        runner_id: order.runner_id,
        tailor_id: order.tailor_id,
        overall_rating,
        runner_rating: runner_rating || null,
        tailor_rating: tailor_rating || null,
        comment: comment || null,
        is_visible: true,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully'
    })

  } catch (error: any) {
    console.error('Submit review error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
