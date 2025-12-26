'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  return (
    <Suspense fallback={null}>
      <LoginForm redirectTo={searchParams.redirect || '/orders'} />
    </Suspense>
  )
}
