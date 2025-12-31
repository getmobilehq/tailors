'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { ReactNode } from 'react'

interface RecaptchaProviderProps {
  children: ReactNode
}

/**
 * Provider component for Google reCAPTCHA v3
 * Wraps the app to make reCAPTCHA available throughout
 */
export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  // If no site key is configured, render children without CAPTCHA
  // This allows the app to work in development without CAPTCHA configured
  if (!siteKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY not configured - CAPTCHA disabled')
    }
    return <>{children}</>
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
      container={{
        parameters: {
          badge: 'bottomright', // Position of the reCAPTCHA badge
          theme: 'light',
        },
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}
