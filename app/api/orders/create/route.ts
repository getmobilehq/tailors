import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import { createAdminClient } from '@/lib/supabase/admin'
import { DELIVERY_FEE } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    console.log('[ORDER CREATE] Starting order creation...')

    // Step 1: Verify user authentication with request-specific client
    const supabase = createClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[ORDER CREATE] Auth check - User ID:', user?.id, 'Error:', authError)

    if (!user) {
      console.error('[ORDER CREATE] No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Verify user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single()

    console.log('[ORDER CREATE] Profile check - Profile:', profile, 'Error:', profileError)

    if (!profile) {
      console.error('[ORDER CREATE] User profile not found for user:', user.id)
      return NextResponse.json({
        error: 'User profile not found. Please contact support.',
        details: 'Your account exists but profile is missing. This should not happen.'
      }, { status: 403 })
    }

    const { items, address, phone, notes, pickupDate, pickupSlot } = await req.json()

    console.log('[ORDER CREATE] Request data:', {
      itemCount: items?.length,
      address,
      phone,
      pickupDate,
      pickupSlot
    })

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    if (!address || !phone || !pickupDate || !pickupSlot) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 })
    }

    // Calculate totals (prices are in pounds as DECIMAL after migration)
    const subtotal = items.reduce((sum: number, item: any) =>
      sum + (item.service.price * item.quantity), 0
    )
    const total = subtotal + DELIVERY_FEE

    console.log('[ORDER CREATE] Calculated totals - Subtotal:', subtotal, 'Total:', total)

    // Generate order number
    const orderNumber = `TS-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    console.log('[ORDER CREATE] Generated order number:', orderNumber)

    // Step 3: Use admin client to create order (bypasses RLS)
    const adminClient = createAdminClient()

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        status: 'pending_payment',
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        customer_address: address,
        customer_phone: phone,
        customer_notes: notes || null,
        pickup_date: pickupDate,
        pickup_slot: pickupSlot,
      })
      .select()
      .single()

    if (orderError) {
      console.error('[ORDER CREATE] Order creation failed:', orderError)
      return NextResponse.json(
        {
          error: 'Failed to create order',
          details: orderError.message,
          code: orderError.code
        },
        { status: 500 }
      )
    }

    console.log('[ORDER CREATE] Order created successfully:', order.id)

    // Step 4: Create order items with admin client (bypasses RLS)
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      service_id: item.service.id,
      garment_description: item.garment_description,
      quantity: item.quantity,
      price: item.service.price, // Already in pounds
      photos: item.photos || [],
      notes: item.notes || null,
    }))

    console.log('[ORDER CREATE] Creating', orderItems.length, 'order items')

    const { error: itemsError } = await adminClient
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('[ORDER CREATE] Order items creation failed:', itemsError)

      // Try to clean up the order
      await adminClient.from('orders').delete().eq('id', order.id)

      return NextResponse.json(
        {
          error: 'Failed to create order items',
          details: itemsError.message,
          code: itemsError.code
        },
        { status: 500 }
      )
    }

    console.log('[ORDER CREATE] Order items created successfully')

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      total
    })
  } catch (error: any) {
    console.error('[ORDER CREATE] Unexpected error:', error)
    console.error('[ORDER CREATE] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Order creation failed',
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}
