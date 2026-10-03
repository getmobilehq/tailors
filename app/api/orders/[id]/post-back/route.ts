import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff-auth'
import { sendItemsPostedEmail } from '@/lib/email'

/**
 * The finished items have gone back in the post. Records the Royal Mail
 * tracking number, completes the order, and emails the customer a tracking
 * link - a postal customer has no other way of knowing their parcel is on
 * its way.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaff(['admin', 'tailor'])
  if (!auth.ok) return auth.response

  try {
    const { trackingNumber } = await request.json()

    if (typeof trackingNumber !== 'string' || !trackingNumber.trim()) {
      return NextResponse.json({ error: 'Enter the Royal Mail tracking number' }, { status: 400 })
    }

    const tracking = trackingNumber.trim().toUpperCase()

    const { data: order, error: loadError } = await auth.ctx.admin
      .from('orders')
      .select('id, status, payment_status, fulfilment_type, order_number, customer:customer_id(full_name, email)')
      .eq('id', params.id)
      .single()

    if (loadError) throw loadError

    if (order.fulfilment_type !== 'postal') {
      return NextResponse.json(
        { error: 'This order is not a postal order' },
        { status: 400 }
      )
    }

    // Postal orders are paid online up front, so an unpaid one means the
    // Stripe payment never landed. Don't post goods out against it.
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'This order has not been paid for' },
        { status: 409 }
      )
    }

    const { data: updated, error } = await auth.ctx.admin
      .from('orders')
      .update({
        status: 'completed',
        return_tracking_number: tracking,
        posted_back_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('status', 'ready')
      .select('id')

    if (error) throw error

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'The items are not marked ready yet' },
        { status: 409 }
      )
    }

    const customer = order.customer as unknown as { full_name: string; email: string } | null

    if (customer?.email) {
      const emailResult = await sendItemsPostedEmail(
        customer.email,
        customer.full_name,
        order.order_number,
        tracking
      )

      // The parcel is already posted; a failed email doesn't undo that
      if (!emailResult.success) {
        console.error('Failed to send dispatch email:', emailResult.error)
        return NextResponse.json({ ok: true, emailFailed: true })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Post back error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record the dispatch' },
      { status: 500 }
    )
  }
}
