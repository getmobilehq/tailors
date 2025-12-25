# Custom Domain Setup: tailorspace.uk

This guide will help you configure `tailorspace.uk` with Netlify.

---

## Step 1: Add Custom Domain in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Domain settings**
3. Click **"Add custom domain"**
4. Enter: `tailorspace.uk`
5. Click **"Verify"**

Netlify will also suggest adding `www.tailorspace.uk` - **add this too** for better coverage.

---

## Step 2: Configure DNS Records

You need to update your domain's DNS settings. This is done at your domain registrar (where you bought `tailorspace.uk`).

### Option A: Using Netlify DNS (Recommended - Easiest)

1. In Netlify → **Domain settings** → **DNS**
2. Click **"Set up Netlify DNS"**
3. Netlify will provide nameservers (e.g., `dns1.p01.nsone.net`)
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Update nameservers to the ones Netlify provided
6. DNS propagation takes 24-48 hours (usually faster)

### Option B: Using External DNS

Add these records at your domain registrar:

**For Root Domain (`tailorspace.uk`):**
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600
```

**For WWW Subdomain (`www.tailorspace.uk`):**
```
Type: CNAME
Name: www
Value: tailorsp.netlify.app
TTL: 3600
```

---

## Step 3: Enable HTTPS

1. After DNS is configured, go to **Domain settings** → **HTTPS**
2. Netlify will automatically provision a **free SSL certificate** (Let's Encrypt)
3. This takes 5-10 minutes after DNS propagates
4. Enable **"Force HTTPS"** to redirect all HTTP traffic to HTTPS

---

## Step 4: Update Environment Variables

In Netlify → **Site settings** → **Environment variables**:

Update:
```
NEXT_PUBLIC_APP_URL=https://tailorspace.uk
```

Then **redeploy** your site (Netlify does this automatically when you change env vars).

---

## Step 5: Update Supabase Configuration

In Supabase Dashboard:

### 5.1 Authentication Settings
1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL**: `https://tailorspace.uk`
3. Add **Redirect URLs**:
   - `https://tailorspace.uk`
   - `https://tailorspace.uk/auth/callback`
   - `https://www.tailorspace.uk` (if using www)
   - `https://www.tailorspace.uk/auth/callback`

### 5.2 Database Settings
Run in Supabase SQL Editor:
```sql
ALTER DATABASE postgres SET app.settings.app_url TO 'https://tailorspace.uk';
```

---

## Step 6: Update Stripe Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Find your webhook endpoint
3. Update the URL to: `https://tailorspace.uk/api/webhooks/stripe`
4. Verify the webhook secret in Netlify env vars is correct

---

## Step 7: Update SEO & Social Media

The sitemap and Open Graph images will automatically use your custom domain once `NEXT_PUBLIC_APP_URL` is updated.

Verify:
- Sitemap: `https://tailorspace.uk/sitemap.xml`
- Robots: `https://tailorspace.uk/robots.txt`

---

## Step 8: Test Your Setup

After DNS propagation (24-48 hours max):

1. ✅ Visit `https://tailorspace.uk` - should load your site
2. ✅ Visit `http://tailorspace.uk` - should redirect to HTTPS
3. ✅ Visit `https://www.tailorspace.uk` - should work (or redirect to non-www)
4. ✅ Test authentication (login/signup)
5. ✅ Test Stripe payment flow
6. ✅ Check Stripe webhook is receiving events

---

## DNS Propagation Check

While waiting for DNS to propagate, you can check status:
- https://dnschecker.org/
- Enter `tailorspace.uk`
- Should show Netlify's IP or your Netlify subdomain

---

## Troubleshooting

### "Site not found" error
- DNS hasn't propagated yet (wait up to 48 hours)
- Check DNS records are correct
- Try clearing your browser cache

### HTTPS not working
- Wait for SSL certificate to be provisioned (5-10 min after DNS)
- Check "HTTPS" section in Netlify domain settings
- Verify DNS is fully propagated

### Authentication redirects failing
- Double-check Supabase redirect URLs include your custom domain
- Verify `NEXT_PUBLIC_APP_URL` is updated in Netlify
- Redeploy the site after changing env vars

### Stripe webhook not receiving events
- Verify webhook URL is `https://tailorspace.uk/api/webhooks/stripe`
- Check webhook signing secret matches in Netlify env vars
- Test webhook in Stripe dashboard

---

## Email Configuration

Since your domain is `tailorspace.uk`, you may want to:

### Update Email "From" Addresses:
In `/lib/email.ts`, update:
```typescript
from: 'TailorSpace <orders@tailorspace.uk>'
```

### Set up Email DNS (SPF, DKIM, DMARC):
If using Resend, add these DNS records:
1. Go to Resend Dashboard → Domains
2. Add `tailorspace.uk`
3. Add the DNS records Resend provides
4. This ensures emails don't go to spam

---

## Final Checklist

- [ ] Custom domain added in Netlify
- [ ] DNS records configured (A and CNAME)
- [ ] HTTPS enabled and forced
- [ ] `NEXT_PUBLIC_APP_URL` updated to `https://tailorspace.uk`
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhook URL updated
- [ ] Database app URL updated
- [ ] Site redeployed
- [ ] Domain loads successfully
- [ ] Authentication works
- [ ] Payments work
- [ ] Emails send from correct domain

---

## Support Resources

- **Netlify Domain Docs**: https://docs.netlify.com/domains-https/custom-domains/
- **Netlify DNS Setup**: https://docs.netlify.com/domains-https/netlify-dns/
- **SSL Certificate Troubleshooting**: https://docs.netlify.com/domains-https/https-ssl/

---

**Your TailorSpace marketplace will be live at https://tailorspace.uk! 🎉**

DNS propagation is the only waiting step - everything else is instant.
