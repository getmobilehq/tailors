import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import type { SavedCartItem } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, booking_step, pickup_date, pickup_slot } = body as {
      items: SavedCartItem[]
      booking_step: string
      pickup_date: string | null
      pickup_slot: string | null
    }

    const { data, error } = await supabase
      .from('saved_carts')
      .upsert(
        {
          user_id: user.id,
          items: items || [],
          booking_step: booking_step || 'services',
          pickup_date: pickup_date || null,
          pickup_slot: pickup_slot || null,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Cart sync error:', error)
      return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Cart sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('saved_carts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Cart fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('saved_carts')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Cart delete error:', error)
      return NextResponse.json({ error: 'Failed to delete cart' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
