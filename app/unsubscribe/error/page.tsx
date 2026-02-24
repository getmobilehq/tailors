import Link from 'next/link'

export default function UnsubscribeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold mb-3">Invalid Link</h1>
        <p className="text-muted-foreground mb-6">
          This unsubscribe link is invalid or has expired. If you'd like to
          manage your email preferences, please log in to your account.
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
