# TailorSpace - Quick Reference Card

## 🌐 URLs

| Purpose | URL |
|---------|-----|
| **Production Site** | https://tailorspace.uk |
| **Netlify Dashboard** | https://app.netlify.com/sites/tailorsp |
| **GitHub Repository** | https://github.com/getmobilehq/tailors |

---

## 🔑 Environment Variables (Netlify)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://tailorspace.uk
EMAIL_API_SECRET=your_random_secret
NODE_ENV=production
```

---

## 📧 Email Addresses

- **All inquiries**: support@tailorspace.uk

---

## 🔗 Integration URLs

### Stripe Webhook
```
https://tailorspace.uk/api/webhooks/stripe
```

### Supabase Redirect URLs
```
https://tailorspace.uk
https://tailorspace.uk/auth/callback
https://www.tailorspace.uk
https://www.tailorspace.uk/auth/callback
https://tailorsp.netlify.app
https://tailorsp.netlify.app/auth/callback
```

---

## 🗄️ Database Migrations (Run in Supabase SQL Editor)

1. `/supabase/migrations/004_update_messages_for_group_chat.sql`
2. `/supabase/migrations/005_reviews_system.sql`
3. `/supabase/migrations/006_email_notifications.sql`
4. `/supabase/migrations/007_photo_storage.sql`

**After running migration 006:**
```sql
ALTER DATABASE postgres SET app.settings.api_secret TO 'your_supabase_service_role_key';
ALTER DATABASE postgres SET app.settings.app_url TO 'https://tailorspace.uk';
```

---

## 🌐 DNS Configuration

### Root Domain (A Record)
```
Type: A
Name: @
Value: 75.2.60.5
```

### WWW (CNAME)
```
Type: CNAME
Name: www
Value: tailorsp.netlify.app
```

---

## ✅ Pre-Launch Checklist

- [ ] All environment variables added to Netlify
- [ ] Custom domain configured (tailorspace.uk)
- [ ] DNS records updated
- [ ] HTTPS enabled and forced
- [ ] All database migrations run
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhook configured
- [ ] Resend domain verified
- [ ] Email DNS records added (SPF, DKIM, DMARC)
- [ ] Test payment flow
- [ ] Test authentication
- [ ] Test email sending
- [ ] Create Open Graph image (1200x630px)

---

## 🚀 Deployment Process

1. Push to `main` branch
2. Netlify automatically builds
3. Site deploys in ~3-5 minutes
4. Check: https://app.netlify.com/sites/tailorsp/deploys

---

## 📋 Features Implemented

✅ Complete booking flow with photo upload
✅ Real-time messaging system
✅ Reviews and ratings
✅ Email notifications (welcome + status updates)
✅ Order journey tracking with timeline
✅ Admin analytics dashboard
✅ Terms of Service & Privacy Policy
✅ SEO optimization (meta tags, sitemap, robots.txt)
✅ Payment processing with Stripe
✅ Role-based access control

---

## 📞 Support

- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs

---

## 📚 Full Documentation

- **NETLIFY_DEPLOYMENT.md** - Complete Netlify setup
- **CUSTOM_DOMAIN_SETUP.md** - Domain configuration
- **DEPLOYMENT_URLS.md** - All URLs and endpoints
- **COMPLETION_SUMMARY.md** - Feature summary
- **TESTING_GUIDE.md** - Testing procedures

---

**Last Updated**: ${new Date().toLocaleDateString('en-GB')}
