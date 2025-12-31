/**
 * Server-side reCAPTCHA verification utility
 * Verifies reCAPTCHA tokens sent from the client
 */

interface RecaptchaResponse {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

/**
 * Verify a reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action name (e.g., 'login', 'signup')
 * @param minScore - Minimum score required (0.0 to 1.0, default 0.5)
 * @returns Object with success status and optional error message
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  minScore: number = 0.5
): Promise<{ success: boolean; error?: string; score?: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured')
    // In production, we want to fail closed (reject if CAPTCHA not configured)
    // In development, we can be more lenient
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'CAPTCHA verification not configured' }
    }
    console.warn('Skipping CAPTCHA verification in development mode')
    return { success: true, score: 1.0 }
  }

  if (!token) {
    return { success: false, error: 'CAPTCHA token is required' }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data: RecaptchaResponse = await response.json()

    // Check if verification was successful
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes'])
      return {
        success: false,
        error: 'CAPTCHA verification failed',
      }
    }

    // Check score (v3 only - score ranges from 0.0 to 1.0)
    if (data.score !== undefined && data.score < minScore) {
      console.warn(`reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`)
      return {
        success: false,
        error: 'CAPTCHA score too low. Please try again.',
        score: data.score,
      }
    }

    // Check action matches (if provided)
    if (expectedAction && data.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`)
      return {
        success: false,
        error: 'CAPTCHA action mismatch',
      }
    }

    return {
      success: true,
      score: data.score,
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error)
    return {
      success: false,
      error: 'Failed to verify CAPTCHA',
    }
  }
}

/**
 * Middleware helper to verify reCAPTCHA in API routes
 * Usage:
 * ```ts
 * const captchaToken = await request.json().recaptchaToken
 * const captchaResult = await verifyRecaptchaMiddleware(captchaToken, 'login')
 * if (!captchaResult.success) {
 *   return NextResponse.json({ error: captchaResult.error }, { status: 400 })
 * }
 * ```
 */
export async function verifyRecaptchaMiddleware(
  token: string,
  action: string,
  minScore: number = 0.5
): Promise<{ success: boolean; error?: string }> {
  const result = await verifyRecaptcha(token, action, minScore)

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'CAPTCHA verification failed',
    }
  }

  return { success: true }
}
