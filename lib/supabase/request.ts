import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest } from 'next/server'

/**
 * Create a Supabase client for API routes
 * This reads cookies from the NextRequest object
 */
export function createClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Cannot set cookies in API routes
        },
        remove() {
          // Cannot remove cookies in API routes
        },
      },
    }
  )
}
