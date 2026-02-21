import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  try {
    // Verify admin user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get all orders that should have payments (any status beyond initial creation)
    const { data: orders, error: ordersError } = await adminClient
      .from('orders')
      .select('id, order_number, total, status, created_at')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Get existing payment order_ids to skip
    const { data: existingPayments } = await adminClient
      .from('payments')
      .select('order_id, stripe_session_id')

    const existingOrderIds = new Set(existingPayments?.map(p => p.order_id) || [])

    // Find orders without payment records
    const ordersWithoutPayments = (orders || []).filter(o => !existingOrderIds.has(o.id))

    if (ordersWithoutPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All orders already have payment records',
        synced: 0,
      })
    }

    // Fetch recent Stripe checkout sessions to match with orders
    let allSessions: Stripe.Checkout.Session[] = []
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const params: Stripe.Checkout.SessionListParams = {
        limit: 100,
        status: 'complete',
      }
      if (startingAfter) {
        params.starting_after = startingAfter
      }

      const sessions = await stripe.checkout.sessions.list(params)
      allSessions = [...allSessions, ...sessions.data]
      hasMore = sessions.has_more
      if (sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id
      }
    }

    // Build a map of order_id -> Stripe session
    const sessionsByOrderId = new Map<string, Stripe.Checkout.Session>()
    for (const session of allSessions) {
      const orderId = session.metadata?.order_id
      if (orderId) {
        sessionsByOrderId.set(orderId, session)
      }
    }

    // Also check for existing sessions to avoid unique constraint violations
    const existingSessionIds = new Set(existingPayments?.map(p => p.stripe_session_id) || [])

    let synced = 0
    let skipped = 0
    const errors: string[] = []

    for (const order of ordersWithoutPayments) {
      const session = sessionsByOrderId.get(order.id)

      if (session && !existingSessionIds.has(session.id)) {
        const { error: insertError } = await adminClient
          .from('payments')
          .insert({
            order_id: order.id,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string || null,
            amount: order.total,
            status: 'succeeded',
          })

        if (insertError) {
          errors.push(`Order ${order.order_number}: ${insertError.message}`)
        } else {
          synced++
        }
      } else if (!session) {
        // No Stripe session found — create a record with order data only
        // Use a unique placeholder for stripe_session_id
        const placeholderId = `manual_sync_${order.id}`

        if (!existingSessionIds.has(placeholderId)) {
          const { error: insertError } = await adminClient
            .from('payments')
            .insert({
              order_id: order.id,
              stripe_session_id: placeholderId,
              stripe_payment_intent_id: null,
              amount: order.total,
              status: 'succeeded',
            })

          if (insertError) {
            errors.push(`Order ${order.order_number}: ${insertError.message}`)
          } else {
            synced++
          }
        } else {
          skipped++
        }
      } else {
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} payment records`,
      synced,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      totalOrders: orders?.length || 0,
      ordersWithoutPayments: ordersWithoutPayments.length,
    })

  } catch (error: any) {
    console.error('Payment sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
