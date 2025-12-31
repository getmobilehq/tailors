# Sentry Setup Guide

This guide explains how to set up Sentry error monitoring for TailorSpace Marketplace.

## Why Sentry?

Sentry provides real-time error tracking and performance monitoring for production applications. It helps you:
- Catch and debug errors in production
- Monitor application performance
- Track user sessions with replay
- Get alerted when critical errors occur
- Prioritize fixes based on error frequency and impact

## Step 1: Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (free tier includes 5,000 errors/month)
3. Create a new organization (or use an existing one)

## Step 2: Create a Sentry Project

1. In your Sentry dashboard, click **Create Project**
2. Select **Next.js** as the platform
3. Set alert frequency (recommended: "Alert me on every new issue")
4. Name your project (e.g., "tailorspace-marketplace")
5. Click **Create Project**

## Step 3: Get Your Sentry DSN

After creating the project, Sentry will show you a **DSN (Data Source Name)**. It looks like:
```
https://abc123@o123456.ingest.sentry.io/789012
```

Copy this DSN - you'll need it for the environment variables.

## Step 4: Create an Auth Token

To upload source maps for better error debugging:

1. Go to **Settings** → **Account** → **Auth Tokens**
2. Click **Create New Token**
3. Set the scope to:
   - ✅ `project:read`
   - ✅ `project:releases`
   - ✅ `org:read`
4. Copy the token (you won't see it again!)

## Step 5: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

**Where to find these:**
- `NEXT_PUBLIC_SENTRY_DSN`: From Step 3
- `SENTRY_ORG`: Your organization slug (found in Settings → General)
- `SENTRY_PROJECT`: Your project name (e.g., "tailorspace-marketplace")
- `SENTRY_AUTH_TOKEN`: From Step 4

## Step 6: Test Sentry Integration

### Local Testing (Development)

Sentry is disabled in development mode by default. To test it:

1. Temporarily change the `enabled` setting in `sentry.client.config.ts`:
```typescript
enabled: true, // Change from: process.env.NODE_ENV !== 'development'
```

2. Create a test error in your app:
```typescript
// Add this button temporarily to any page
<button onClick={() => { throw new Error('Test Sentry error!') }}>
  Test Sentry
</button>
```

3. Click the button and check your Sentry dashboard for the error

4. **Important:** Revert the `enabled` change when done testing

### Production Testing

1. Deploy your application to production (Vercel, Netlify, etc.)
2. Make sure all environment variables are set in your hosting platform
3. Trigger an error in production
4. Check your Sentry dashboard - you should see the error appear

## Step 7: Configure Alerts

Set up email/Slack alerts for critical errors:

1. Go to **Alerts** → **Create Alert**
2. Choose conditions (e.g., "When a new issue is created")
3. Set actions (e.g., "Send email to team@example.com")
4. Save the alert

## Understanding the Configuration

### Files Created

1. **`sentry.client.config.ts`** - Client-side error tracking
   - Captures browser errors
   - Session replay for debugging
   - Filters sensitive data (cookies, auth headers)

2. **`sentry.server.config.ts`** - Server-side error tracking
   - Captures API route errors
   - Server component errors
   - Filters sensitive data

3. **`sentry.edge.config.ts`** - Edge runtime error tracking
   - Captures middleware errors
   - Edge function errors

4. **`instrumentation.ts`** - Initializes Sentry on server startup

5. **`next.config.js`** - Webpack plugin configuration
   - Uploads source maps to Sentry
   - Enables automatic instrumentation

### Security Features

The configuration automatically:
- ✅ Filters cookies and authorization headers
- ✅ Masks all text in session replays
- ✅ Blocks media in session replays
- ✅ Removes sensitive data from error context
- ✅ Hides source maps from client bundles
- ✅ Only sends errors in production (not development)

### Performance Monitoring

- **`tracesSampleRate: 0.1`** - Captures 10% of transactions for performance monitoring
- **`replaysSessionSampleRate: 0.1`** - Records 10% of normal sessions
- **`replaysOnErrorSampleRate: 1.0`** - Records 100% of sessions with errors

You can adjust these rates based on your traffic and Sentry plan limits.

## Monitoring Source Maps

Source maps help you see the original source code in error stack traces (instead of minified code).

During production builds, source maps are automatically uploaded to Sentry via the webpack plugin.

To verify source maps are working:
1. Trigger an error in production
2. Open the error in Sentry
3. Check the stack trace - you should see your original code, not minified code

## Troubleshooting

### Errors not appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify environment is set to production: `NODE_ENV=production`
3. Check browser console for Sentry initialization errors
4. Verify your Sentry project quota isn't exceeded

### Source maps not working

1. Verify `SENTRY_AUTH_TOKEN` is set with correct permissions
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry dashboard
3. Look for upload errors in build logs
4. Ensure your build process has internet access

### Too many errors/quota exceeded

1. Adjust sample rates in config files (reduce `tracesSampleRate`)
2. Add more patterns to `ignoreErrors` array
3. Use `beforeSend` to filter out noise
4. Upgrade your Sentry plan if needed

## Best Practices

1. **Don't log sensitive data**: The config already filters common sensitive fields, but always review error data
2. **Set up alerts**: Configure alerts for high-severity errors
3. **Review errors weekly**: Make it a team habit to review and fix errors
4. **Use releases**: Tag deployments with release versions for better tracking
5. **Monitor performance**: Use Sentry's performance monitoring to find slow API routes

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Pricing](https://sentry.io/pricing/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)

## Cost Estimation

**Free tier includes:**
- 5,000 errors per month
- 10,000 performance units per month
- 50 replays per month
- 1 user

This is usually sufficient for small to medium projects. Monitor your usage in the Sentry dashboard.
