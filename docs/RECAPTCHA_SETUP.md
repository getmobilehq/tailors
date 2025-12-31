# Google reCAPTCHA v3 Setup Guide

This guide explains how to set up Google reCAPTCHA v3 for TailorSpace Marketplace to protect forms from bot submissions.

## Why reCAPTCHA v3?

Google reCAPTCHA v3 provides invisible bot protection without challenging users with puzzles or checkboxes. It:
- Works silently in the background
- Assigns a score (0.0 to 1.0) to each request based on how human-like the behavior is
- Protects critical forms (login, signup, password reset, applications)
- Reduces spam and abuse without impacting user experience
- Is free for most use cases

## reCAPTCHA v3 vs v2

- **v2**: Shows "I'm not a robot" checkbox or image puzzles (can frustrate users)
- **v3**: Completely invisible, analyzes user behavior automatically (better UX)

We use **v3** for a seamless experience.

## Step 1: Create a Google Account

If you don't have one already:
1. Go to [https://accounts.google.com](https://accounts.google.com)
2. Create a new Google account

## Step 2: Register Your Site

1. Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
2. Click the **+** button to add a new site
3. Fill in the registration form:

**Label**: `TailorSpace Marketplace` (or your preferred name)

**reCAPTCHA type**: Select **reCAPTCHA v3**

**Domains**: Add your domains
- For development: `localhost`
- For production: `yourdomain.com` (e.g., `tailorspace.co.uk`)

**Accept the reCAPTCHA Terms of Service**

4. Click **Submit**

## Step 3: Get Your Keys

After registration, you'll see two keys:

### Site Key (Public)
- This goes in `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- It's safe to expose in client-side code
- Starts with something like: `6Lc...`

### Secret Key (Private)
- This goes in `RECAPTCHA_SECRET_KEY`
- **NEVER** expose this in client-side code or commit to Git
- Starts with something like: `6Lc...`

Copy both keys - you'll need them for environment variables.

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc_your_site_key_here
RECAPTCHA_SECRET_KEY=6Lc_your_secret_key_here
```

**Important:**
- The site key has `NEXT_PUBLIC_` prefix (accessible in browser)
- The secret key does NOT have the prefix (server-side only)

## Step 5: How It Works in the App

### Client-Side (Forms)

Forms that need CAPTCHA protection use the `useRecaptcha` hook:

```typescript
import { useRecaptcha } from '@/hooks/use-recaptcha'

function LoginForm() {
  const executeRecaptcha = useRecaptcha()

  async function handleSubmit(e) {
    e.preventDefault()

    // Generate CAPTCHA token
    const token = await executeRecaptcha('login')

    // Send to API with other form data
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        recaptchaToken: token, // Include token
      })
    })
  }
}
```

### Server-Side (API Routes)

API routes verify the token using the `verifyRecaptcha` function:

```typescript
import { verifyRecaptcha } from '@/lib/recaptcha'

export async function POST(request: Request) {
  const { email, password, recaptchaToken } = await request.json()

  // Verify CAPTCHA
  const captchaResult = await verifyRecaptcha(
    recaptchaToken,
    'login', // Expected action
    0.5      // Minimum score (0.0 to 1.0)
  )

  if (!captchaResult.success) {
    return NextResponse.json(
      { error: 'CAPTCHA verification failed' },
      { status: 400 }
    )
  }

  // Proceed with login...
}
```

## Step 6: Understanding Scores

reCAPTCHA v3 returns a score from 0.0 to 1.0:

- **1.0**: Very likely a human
- **0.5**: Neutral (could be human or bot)
- **0.0**: Very likely a bot

### Recommended Thresholds

- **Critical actions** (login, signup, password reset): `0.5` or higher
- **Less critical** (contact forms, newsletter): `0.3` or higher
- **Very permissive**: `0.1` or higher

You can adjust these in the API route:

```typescript
// Stricter for login
await verifyRecaptcha(token, 'login', 0.7)

// More lenient for contact form
await verifyRecaptcha(token, 'contact', 0.3)
```

## Step 7: Protected Forms in the App

The following forms are already protected:

1. **Signup** (`/signup`) - Action: `'signup'`
2. **Login** (`/login`) - Action: `'login'`
3. **Forgot Password** (`/forgot-password`) - Action: `'forgot_password'`
4. **Reset Password** - Action: `'reset_password'`
5. **Resend OTP** - Action: `'resend_otp'`
6. **Applications** (Runner/Tailor) - Action: `'apply'`

Each form automatically generates a CAPTCHA token and sends it with the request.

## Step 8: Testing

### Development Testing

By default, CAPTCHA is **disabled in development** to avoid configuration hassles. If you want to test it:

1. Add the environment variables to `.env.local`
2. The system will automatically enable CAPTCHA
3. Test form submissions

### Production Testing

1. Deploy with environment variables configured
2. Fill out a form (e.g., signup)
3. Check Google reCAPTCHA Admin Console:
   - Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
   - Click on your site
   - View analytics to see requests and scores

### Testing with Low Scores (Bot-like Behavior)

To test the score threshold:
1. Temporarily lower the minimum score in your API route:
   ```typescript
   await verifyRecaptcha(token, 'login', 0.9) // Very strict
   ```
2. Try submitting a form quickly or with automated tools
3. You should get rejected if the score is too low

## Step 9: Monitoring

### Google reCAPTCHA Admin Console

View analytics in the admin console:
- Total requests
- Score distribution (how many high vs low scores)
- Suspected bot traffic
- Error rates

### Application Logs

Server-side verification logs warnings:
```
reCAPTCHA score too low: 0.3 (minimum: 0.5)
```

Check these logs to see if legitimate users are being blocked.

## Troubleshooting

### CAPTCHA Token is Null

**Problem**: `executeRecaptcha` returns `null`

**Solutions**:
1. Check that `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
2. Ensure the RecaptchaProvider is wrapping your app in `layout.tsx`
3. Wait for the page to fully load before calling `executeRecaptcha`

### Verification Failing on Server

**Problem**: `verifyRecaptcha` returns `{ success: false }`

**Solutions**:
1. Check that `RECAPTCHA_SECRET_KEY` is set on the server
2. Verify the site key and secret key match the same reCAPTCHA site
3. Check that the domain is registered in Google reCAPTCHA admin
4. Ensure you're not testing from a banned IP or using a VPN

### Legitimate Users Getting Blocked

**Problem**: Real users getting "CAPTCHA failed" errors

**Solutions**:
1. Lower the minimum score threshold (e.g., from 0.5 to 0.3)
2. Check if users are on VPNs or corporate networks (can lower scores)
3. Monitor score distribution in Google admin console
4. Consider adding a fallback (e.g., email verification) for low-score users

### Badge Showing on Every Page

**Problem**: The reCAPTCHA badge appears on all pages

**Solution**: This is normal behavior. You can:
1. Leave it (recommended for transparency)
2. Hide it with CSS (must include text disclosure):
   ```css
   .grecaptcha-badge { visibility: hidden; }
   ```
   Then add text to your footer:
   ```
   This site is protected by reCAPTCHA and the Google
   Privacy Policy and Terms of Service apply.
   ```

## Best Practices

1. **Use different actions**: Use specific action names for different forms (`'login'`, `'signup'`, etc.) to get better analytics

2. **Adjust scores based on analytics**: Monitor the score distribution and adjust thresholds accordingly

3. **Don't block too aggressively**: Start with a lenient score (0.3-0.5) and increase if you see abuse

4. **Provide feedback**: If CAPTCHA fails, tell users why:
   ```typescript
   return { error: 'Security check failed. Please try again or contact support.' }
   ```

5. **Combine with other security**: Use CAPTCHA alongside:
   - Rate limiting (already implemented)
   - Email verification (already implemented)
   - Strong password requirements

6. **Monitor for false positives**: Check logs regularly to ensure legitimate users aren't being blocked

## Cost and Limits

### Free Tier
- **1 million assessments per month** (free)
- Sufficient for most small-to-medium apps

### Paid Tier
- Required if you exceed 1 million assessments/month
- Contact Google for pricing

### Monitoring Usage
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Select your site
3. View "Analytics" tab to see monthly usage

## Security Notes

1. **Never expose the secret key**: Keep `RECAPTCHA_SECRET_KEY` server-side only
2. **Validate on server**: Always verify tokens on the server, never trust client-side validation
3. **Use HTTPS in production**: reCAPTCHA requires HTTPS in production
4. **Don't rely solely on CAPTCHA**: Combine with other security measures (rate limiting, email verification)

## Additional Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [reCAPTCHA v3 Guide](https://developers.google.com/recaptcha/docs/v3)
- [Interpreting the Score](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score)
- [FAQ](https://developers.google.com/recaptcha/docs/faq)

## Example: Adding CAPTCHA to a New Form

If you want to protect a new form:

### 1. Client-Side (React Component)

```typescript
'use client'

import { useRecaptcha } from '@/hooks/use-recaptcha'
import { useState } from 'react'

export function MyForm() {
  const executeRecaptcha = useRecaptcha()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Get CAPTCHA token
      const token = await executeRecaptcha('my_custom_action')

      // Submit form
      const response = await fetch('/api/my-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Your form data
          name: 'John',
          email: 'john@example.com',
          // Include CAPTCHA token
          recaptchaToken: token,
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      // Handle success
      alert('Success!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

### 2. Server-Side (API Route)

```typescript
import { NextResponse } from 'next/server'
import { verifyRecaptcha } from '@/lib/recaptcha'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, recaptchaToken } = body

    // Verify CAPTCHA
    const captchaResult = await verifyRecaptcha(
      recaptchaToken,
      'my_custom_action', // Must match client-side action
      0.5 // Minimum score
    )

    if (!captchaResult.success) {
      return NextResponse.json(
        { error: captchaResult.error || 'CAPTCHA verification failed' },
        { status: 400 }
      )
    }

    // CAPTCHA passed - process the form
    // ... your business logic here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

That's it! Your form is now protected with reCAPTCHA v3.
