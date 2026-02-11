import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category_id !== undefined) updateData.category_id = category_id
    if (base_price !== undefined) updateData.base_price = Math.round(base_price * 100)
    if (estimated_days !== undefined) updateData.estimated_days = estimated_days
    if (active !== undefined) updateData.active = active

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        category:categories!services_category_id_fkey(id, name, slug, icon)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ service })
  } catch (error: any) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if service is used in any orders
    const { count } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', params.id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete service. It has ${count} order(s) associated with it.` },
        { status: 400 }
      )
    }

    // Delete service
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete service' },
      { status: 500 }
    )
  }
}
