import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/request'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(req)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const orderId = formData.get('order_id') as string

    // Update order with tailor assignment
    const { error } = await supabase
      .from('orders')
      .update({
        tailor_id: user.id,
        status: 'in_progress',
      })
      .eq('id', orderId)
      .is('tailor_id', null) // Only if not already assigned
      .eq('status', 'collected')

    if (error) {
      throw error
    }

    return redirect(`/tailor/orders/${orderId}`)
  } catch (error: any) {
    console.error('Accept job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept job' },
      { status: 500 }
    )
  }
}
