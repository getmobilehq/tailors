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
      name,
      description,
      category,
      base_price,
      estimated_days,
      popular,
      active,
      sort_order,
    } = body

    // Validate required fields
    if (!name || !category || base_price === undefined || estimated_days === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['trousers', 'shirts', 'dresses', 'suits', 'coats', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Create service
    const { data, error } = await supabase
      .from('services')
      .insert({
        name,
        description: description || null,
        category,
        base_price,
        estimated_days,
        popular: popular || false,
        active: active !== undefined ? active : true,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service: data,
      message: 'Service created successfully'
    })

  } catch (error: any) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
