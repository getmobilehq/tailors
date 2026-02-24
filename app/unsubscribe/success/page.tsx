import Link from 'next/link'

export default function UnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold mb-3">Unsubscribed</h1>
        <p className="text-muted-foreground mb-6">
          You've been unsubscribed from cart reminder emails. You'll no longer
          receive abandoned cart notifications from TailorSpace.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          You'll still receive order confirmations and status updates for active orders.
        </p>
        <Link
          href="/"
          className="text-primary underline hover:no-underline"
        >
          Back to TailorSpace
        </Link>
      </div>
    </div>
  )
}
