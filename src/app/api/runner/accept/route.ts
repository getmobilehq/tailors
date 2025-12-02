import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const orderId = formData.get('order_id') as string

    // Update order with runner assignment
    const { error } = await supabase
      .from('orders')
      .update({
        runner_id: user.id,
        status: 'pickup_scheduled',
      })
      .eq('id', orderId)
      .is('runner_id', null) // Only if not already assigned
      .eq('status', 'booked')

    if (error) {
      throw error
    }

    return redirect(`/runner/orders/${orderId}`)
  } catch (error: any) {
    console.error('Accept job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept job' },
      { status: 500 }
    )
  }
}
