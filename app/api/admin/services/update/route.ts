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
    const {
      service_id,
      name,
      description,
      category,
      base_price,
      estimated_days,
      popular,
      active,
      sort_order,
    } = body

    if (!service_id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['trousers', 'shirts', 'dresses', 'suits', 'coats', 'other']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (base_price !== undefined) updateData.base_price = base_price
    if (estimated_days !== undefined) updateData.estimated_days = estimated_days
    if (popular !== undefined) updateData.popular = popular
    if (active !== undefined) updateData.active = active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    // Update service
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', service_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service: data,
      message: 'Service updated successfully'
    })

  } catch (error: any) {
    console.error('Update service error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
