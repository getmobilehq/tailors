import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import RecoverClient from './recover-client'

interface RecoverPageProps {
  searchParams: { token?: string }
}

export default async function RecoverPage({ searchParams }: RecoverPageProps) {
  const { token } = searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Recovery Link</h1>
          <p className="text-muted-foreground">This recovery link is missing or invalid.</p>
          <a href="/book" className="text-primary underline mt-4 inline-block">
            Browse services instead
          </a>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()

  // Look up the recovery token
  const { data: reminder, error } = await supabase
    .from('cart_reminders')
    .select('*')
    .eq('recovery_token', token)
    .single()

  if (error || !reminder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
          <p className="text-muted-foreground">This recovery link may have expired or already been used.</p>
          <a href="/book" className="text-primary underline mt-4 inline-block">
            Browse services instead
          </a>
        </div>
      </div>
    )
  }

  // Check if token is expired (7 days)
  const sentAt = new Date(reminder.sent_at).getTime()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  if (Date.now() - sentAt > sevenDays) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">This recovery link has expired. Please start a new booking.</p>
          <a href="/book" className="text-primary underline mt-4 inline-block">
            Browse services
          </a>
        </div>
      </div>
    )
  }

  // Track click
  await supabase
    .from('cart_reminders')
    .update({ clicked_at: new Date().toISOString() })
    .eq('id', reminder.id)

  // Route based on reminder type
  if (reminder.reminder_type === 'payment_abandonment' && reminder.order_id) {
    // Check if order is still pending payment
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', reminder.order_id)
      .single()

    if (!order || order.status !== 'pending_payment') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Order Already Processed</h1>
            <p className="text-muted-foreground">
              This order has already been completed or cancelled.
            </p>
            <a href="/orders" className="text-primary underline mt-4 inline-block">
              View your orders
            </a>
          </div>
        </div>
      )
    }

    // Redirect to checkout with recovery param
    redirect(`/book/checkout?recover=${reminder.order_id}`)
  }

  // Cart abandonment — fetch saved cart and restore
  if (reminder.reminder_type === 'cart_abandonment' && reminder.saved_cart_id) {
    const { data: savedCart } = await supabase
      .from('saved_carts')
      .select('*')
      .eq('id', reminder.saved_cart_id)
      .single()

    if (!savedCart || !savedCart.items || (savedCart.items as any[]).length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Cart No Longer Available</h1>
            <p className="text-muted-foreground">
              Your saved cart has been cleared. Start a fresh booking instead.
            </p>
            <a href="/book" className="text-primary underline mt-4 inline-block">
              Browse services
            </a>
          </div>
        </div>
      )
    }

    return (
      <RecoverClient
        cartItems={savedCart.items as any[]}
        bookingStep={savedCart.booking_step}
        pickupDate={savedCart.pickup_date}
        pickupSlot={savedCart.pickup_slot}
      />
    )
  }

  // Fallback
  redirect('/book')
}
