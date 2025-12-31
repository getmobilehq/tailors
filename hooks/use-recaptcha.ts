'use client'

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useCallback } from 'react'

/**
 * Custom hook for executing reCAPTCHA
 * Returns a function that generates a reCAPTCHA token for a specific action
 *
 * @example
 * ```tsx
 * const executeRecaptcha = useRecaptcha()
 *
 * async function handleSubmit() {
 *   const token = await executeRecaptcha('login')
 *   // Send token to API
 *   await fetch('/api/auth/login', {
 *     method: 'POST',
 *     body: JSON.stringify({ email, password, recaptchaToken: token })
 *   })
 * }
 * ```
 */
export function useRecaptcha() {
  const { executeRecaptcha: googleExecuteRecaptcha } = useGoogleReCaptcha()

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (!googleExecuteRecaptcha) {
        console.warn('reCAPTCHA not available yet')
        return null
      }

      try {
        const token = await googleExecuteRecaptcha(action)
        return token
      } catch (error) {
        console.error('Error executing reCAPTCHA:', error)
        return null
      }
    },
    [googleExecuteRecaptcha]
  )

  return executeRecaptcha
}
