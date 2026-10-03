import { Suspense } from 'react'
import SuccessContent from './success-content'

export default function SuccessPage({
  searchParams,
}: {
  searchParams: {
    session_id?: string
    order?: string
    id?: string
    unpaid?: string
    type?: string
  }
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SuccessContent
        sessionId={searchParams.session_id}
        orderNumber={searchParams.order}
        orderId={searchParams.id}
        payAtDropoff={searchParams.unpaid === '1'}
        isPostal={searchParams.type === 'postal'}
      />
    </Suspense>
  )
}
