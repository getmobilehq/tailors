import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all services with category info
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        category:categories!services_category_id_fkey(id, name, slug, icon)
      `)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ services })
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category_id, base_price, estimated_days, active } = body

    if (!name || !category_id || !base_price) {
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      )
    }

    // Get max sort_order
    const { data: maxOrderData } = await supabase
      .from('services')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.sort_order || 0) + 1

    // Create service
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name,
        description: description || null,
        category_id,
        base_price: Math.round(base_price * 100), // Convert pounds to pence
        estimated_days: estimated_days || 7,
        active: active !== undefined ? active : true,
        sort_order: nextOrder,
      })
      .select(`
        *,
        category:categories!services_category_id_fkey(id, name, slug, icon)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ service })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create service' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { services } = body

    if (!services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Services array is required' },
        { status: 400 }
      )
    }

    // Update sort_order for all services
    for (let i = 0; i < services.length; i++) {
      await supabase
        .from('services')
        .update({ sort_order: i })
        .eq('id', services[i].id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error reordering services:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reorder services' },
      { status: 500 }
    )
  }
}
