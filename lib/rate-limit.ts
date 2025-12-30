import { LRUCache } from 'lru-cache'

// Rate limiting configuration
type RateLimitOptions = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max number of unique tokens (IPs)
}

// In-memory cache for rate limiting
// In production, consider using Redis for distributed rate limiting
const tokenCache = new LRUCache<string, number[]>({
  max: 500, // Maximum number of items in cache
  ttl: 60000, // Items expire after 1 minute
})

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (identifier: string, limit: number): { success: boolean; remaining: number; reset: number } => {
      const tokenCount = tokenCache.get(identifier) || []
      const now = Date.now()
      const windowStart = now - options.interval

      // Filter out requests outside the current window
      const requestsInWindow = tokenCount.filter((timestamp) => timestamp > windowStart)

      if (requestsInWindow.length >= limit) {
        // Rate limit exceeded
        const oldestRequest = requestsInWindow[0]
        const reset = oldestRequest + options.interval

        return {
          success: false,
          remaining: 0,
          reset,
        }
      }

      // Add current request timestamp
      requestsInWindow.push(now)
      tokenCache.set(identifier, requestsInWindow)

      return {
        success: true,
        remaining: limit - requestsInWindow.length,
        reset: now + options.interval,
      }
    },
  }
}

// Predefined rate limiters for different endpoints
export const authLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export const strictAuthLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

export const paymentLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 200,
})

// Helper to get client identifier (IP address)
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxy/CDN setups)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  // Fallback (this won't work well in serverless, but better than nothing)
  return 'unknown'
}

// Helper to apply rate limit and return response if exceeded
export async function applyRateLimit(
  request: Request,
  limiter: ReturnType<typeof rateLimit>,
  limit: number,
  identifier?: string
): Promise<Response | null> {
  const clientId = identifier || getClientIdentifier(request)
  const { success, remaining, reset } = limiter.check(clientId, limit)

  if (!success) {
    const resetDate = new Date(reset)
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetDate.toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}
