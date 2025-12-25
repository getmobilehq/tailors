# TailorSpace Deployment URLs

## Production URLs

### Custom Domain (Primary)
**Live Site**: https://tailorspace.uk
**WWW**: https://www.tailorspace.uk

### Netlify URLs
**Netlify Subdomain**: https://tailorsp.netlify.app
**Admin Panel**: https://app.netlify.com/sites/tailorsp

---

## Environment Variables Configuration

For Netlify environment variables, use:

```env
NEXT_PUBLIC_APP_URL=https://tailorspace.uk
```

**Note:** Once custom domain is configured, always use `tailorspace.uk` instead of the Netlify subdomain for consistency.

---

## API Endpoints

### Stripe Webhook
```
https://tailorspace.uk/api/webhooks/stripe
```

### Email API (Internal)
```
https://tailorspace.uk/api/emails/send
```

### Order Creation
```
https://tailorspace.uk/api/orders/create
```

### Checkout
```
https://tailorspace.uk/api/checkout
```

---

## Supabase Configuration

### Redirect URLs (Add all of these)
```
https://tailorspace.uk
https://tailorspace.uk/auth/callback
https://www.tailorspace.uk
https://www.tailorspace.uk/auth/callback
https://tailorsp.netlify.app
https://tailorsp.netlify.app/auth/callback
```

### Site URL
```
https://tailorspace.uk
```

### Database App URL
Run in Supabase SQL Editor:
```sql
ALTER DATABASE postgres SET app.settings.app_url TO 'https://tailorspace.uk';
```

---

## Email Configuration (Resend)

### From Addresses
- **Orders**: orders@tailorspace.uk
- **Support**: support@tailorspace.uk
- **Legal**: legal@tailorspace.uk
- **Privacy**: privacy@tailorspace.uk

### Verified Domain
Add `tailorspace.uk` in Resend Dashboard → Domains

---

## SEO & Sitemap

### Sitemap
```
https://tailorspace.uk/sitemap.xml
```

### Robots.txt
```
https://tailorspace.uk/robots.txt
```

### Open Graph Image (to create)
```
/public/og-image.png (1200x630px)
```

---

## DNS Configuration

### Root Domain (tailorspace.uk)
```
Type: A
Name: @
Value: 75.2.60.5
```

### WWW Subdomain
```
Type: CNAME
Name: www
Value: tailorsp.netlify.app
```

**OR use Netlify DNS** (recommended):
- Netlify will provide nameservers
- Update at your domain registrar

---

## Netlify Build Settings

### Build Command
```bash
npm run build
```

### Publish Directory
```
.next
```

### Functions Directory
(Leave empty - handled by @netlify/plugin-nextjs)

---

## Testing Checklist

After deployment, test:

- [ ] Home page loads: https://tailorspace.uk
- [ ] WWW redirects: https://www.tailorspace.uk
- [ ] HTTP redirects to HTTPS
- [ ] Login/Signup works
- [ ] Booking flow works
- [ ] Stripe checkout works
- [ ] Email notifications send
- [ ] Admin dashboard accessible
- [ ] API endpoints respond
- [ ] Sitemap accessible
- [ ] Robots.txt accessible

---

## Quick Links

| Service | URL |
|---------|-----|
| **Live Site** | https://tailorspace.uk |
| **Netlify Admin** | https://app.netlify.com/sites/tailorsp |
| **Supabase** | https://supabase.com/dashboard |
| **Stripe** | https://dashboard.stripe.com |
| **Resend** | https://resend.com/emails |
| **GitHub Repo** | https://github.com/getmobilehq/tailors |

---

## Deployment Status

Check deployment status at:
```
https://app.netlify.com/sites/tailorsp/deploys
```

View build logs for any deployment to troubleshoot issues.

---

## Roll Back Procedure

If issues occur after deployment:

1. Go to: https://app.netlify.com/sites/tailorsp/deploys
2. Find last working deployment
3. Click "Publish deploy" to rollback instantly

---

Last updated: ${new Date().toLocaleDateString('en-GB')}
