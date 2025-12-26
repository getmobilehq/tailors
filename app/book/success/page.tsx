'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import SuccessContent from './success-content'

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  return (
    <Suspense fallback={null}>
      <SuccessContent sessionId={searchParams.session_id} />
    </Suspense>
  )
}
