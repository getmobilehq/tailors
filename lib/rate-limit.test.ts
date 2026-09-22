import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit, applyRateLimit } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000

function requestFrom(path: string, ip = '203.0.113.7') {
  return new Request(`https://tailorspace.uk${path}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('keeps an hourly limit in force past the first minute', () => {
    vi.useFakeTimers()
    const limiter = rateLimit({ interval: HOUR, uniqueTokenPerInterval: 10 })

    for (let i = 0; i < 3; i++) expect(limiter.check('ip', 3).success).toBe(true)

    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(limiter.check('ip', 3).success).toBe(false)
  })

  it('allows requests again once the window has passed', () => {
    vi.useFakeTimers()
    const limiter = rateLimit({ interval: HOUR, uniqueTokenPerInterval: 10 })

    for (let i = 0; i < 3; i++) limiter.check('ip', 3)

    vi.advanceTimersByTime(HOUR + 1)
    expect(limiter.check('ip', 3).success).toBe(true)
  })
})

describe('applyRateLimit', () => {
  it('counts each route separately when they share a limiter', async () => {
    const limiter = rateLimit({ interval: HOUR, uniqueTokenPerInterval: 10 })

    for (let i = 0; i < 3; i++) {
      expect(await applyRateLimit(requestFrom('/api/auth/resend-otp'), limiter, 3)).toBeNull()
    }
    expect(await applyRateLimit(requestFrom('/api/auth/resend-otp'), limiter, 3)).not.toBeNull()

    expect(await applyRateLimit(requestFrom('/api/auth/forgot-password'), limiter, 3)).toBeNull()
  })

  it('responds 429 once the limit is exceeded', async () => {
    const limiter = rateLimit({ interval: HOUR, uniqueTokenPerInterval: 10 })

    await applyRateLimit(requestFrom('/api/auth/signup'), limiter, 1)
    const blocked = await applyRateLimit(requestFrom('/api/auth/signup'), limiter, 1)

    expect(blocked?.status).toBe(429)
  })
})
