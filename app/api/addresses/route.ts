import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SavedAddress } from '@/lib/types'

// GET - Fetch all addresses for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: addresses, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ addresses: addresses as SavedAddress[] })
  } catch (error: any) {
    console.error('[ADDRESSES GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

// POST - Create a new address
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { label, line1, line2, city, postcode, is_default } = body

    // Validate required fields
    if (!label || !line1 || !city || !postcode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Nottingham postcode
    if (!postcode.toUpperCase().startsWith('NG')) {
      return NextResponse.json(
        { error: 'We currently only serve Nottingham postcodes (NG)' },
        { status: 400 }
      )
    }

    const { data: address, error } = await supabase
      .from('saved_addresses')
      .insert({
        user_id: user.id,
        label,
        line1,
        line2: line2 || null,
        city,
        postcode,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ address: address as SavedAddress }, { status: 201 })
  } catch (error: any) {
    console.error('[ADDRESSES POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create address' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing address
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, label, line1, line2, city, postcode, is_default } = body

    // Validate required fields
    if (!id || !label || !line1 || !city || !postcode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Nottingham postcode
    if (!postcode.toUpperCase().startsWith('NG')) {
      return NextResponse.json(
        { error: 'We currently only serve Nottingham postcodes (NG)' },
        { status: 400 }
      )
    }

    const { data: address, error } = await supabase
      .from('saved_addresses')
      .update({
        label,
        line1,
        line2: line2 || null,
        city,
        postcode,
        is_default: is_default || false,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ address: address as SavedAddress })
  } catch (error: any) {
    console.error('[ADDRESSES PUT] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update address' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an address
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('saved_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ADDRESSES DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address' },
      { status: 500 }
    )
  }
}
