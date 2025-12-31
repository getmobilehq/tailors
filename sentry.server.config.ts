import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production
  tracesSampleRate: 0.1,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  enabled: process.env.NODE_ENV !== 'development',

  environment: process.env.NODE_ENV,

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Filter out sensitive information
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
    }

    // Remove sensitive data from extra context
    if (event.extra) {
      delete event.extra.password
      delete event.extra.token
      delete event.extra.apiKey
    }

    return event
  },

  // Ignore errors from third-party scripts
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Common abort errors
    'AbortError',
    'The operation was aborted',
  ],
})
