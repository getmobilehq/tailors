# 🚀 TailorSpace Deployment Checklist

Use this checklist to deploy TailorSpace to production.

## Pre-Deployment

### ✅ Development Environment
- [ ] Application runs locally without errors
- [ ] All features tested (booking, payments, dashboards)
- [ ] Database schema deployed to Supabase
- [ ] Environment variables configured in `.env.local`
- [ ] Stripe test payments working
- [ ] All user roles tested (customer, runner, tailor, admin)

### ✅ Code Quality
- [ ] No console errors in browser
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] All API routes tested
- [ ] Middleware working correctly
- [ ] Forms validate properly
- [ ] Images load correctly

### ✅ Database
- [ ] Schema deployed to Supabase
- [ ] RLS policies enabled on all tables
- [ ] Sample data loaded (services)
- [ ] Admin user created
- [ ] Test orders cleaned up
- [ ] Database indexes verified

## Production Setup

### 1️⃣ Supabase Production Settings

#### Authentication
- [ ] Go to Authentication → URL Configuration
- [ ] Set Site URL to production domain
- [ ] Add redirect URLs: `https://yourdomain.com/**`
- [ ] Enable email confirmations (optional)
- [ ] Configure email templates

#### API
- [ ] Copy production project URL
- [ ] Copy production anon key
- [ ] Copy production service role key
- [ ] **Keep service role key secret!**

#### Database
- [ ] Enable Point-in-Time Recovery (backups)
- [ ] Set up connection pooling
- [ ] Review RLS policies for production
- [ ] Enable replication (for high availability)

#### Storage (if using)
- [ ] Create storage buckets
- [ ] Set bucket policies
- [ ] Configure CORS

### 2️⃣ Stripe Production Setup

#### API Keys
- [ ] Switch from test to live mode in Stripe Dashboard
- [ ] Copy live publishable key
- [ ] Copy live secret key
- [ ] **Never commit live keys to git!**

#### Webhooks
- [ ] Create production webhook endpoint
- [ ] URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Select events: `checkout.session.completed`
- [ ] Copy webhook signing secret
- [ ] Test webhook delivery

#### Payment Methods
- [ ] Enable payment methods (cards, wallets)
- [ ] Configure payment capture
- [ ] Set up refund policies
- [ ] Enable 3D Secure (SCA compliance)

### 3️⃣ Vercel Deployment

#### Initial Setup
- [ ] Push code to GitHub repository
- [ ] Connect GitHub to Vercel
- [ ] Import project in Vercel
- [ ] Set framework preset to Next.js

#### Environment Variables
Add the following in Vercel → Settings → Environment Variables:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (NEVER EXPOSE!)

# Stripe (Production - Live Keys!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Deployment Settings
- [ ] Set Node.js version to 18.x or higher
- [ ] Enable automatic deployments from main branch
- [ ] Configure preview deployments
- [ ] Set up custom domain

### 4️⃣ Domain Configuration

#### Custom Domain
- [ ] Add custom domain in Vercel
- [ ] Update DNS records (A/CNAME)
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Verify SSL certificate

#### URLs to Update
- [ ] Supabase Site URL
- [ ] Supabase redirect URLs
- [ ] Stripe webhook URL
- [ ] `NEXT_PUBLIC_APP_URL` environment variable

### 5️⃣ First Production Deploy

#### Deploy
- [ ] Commit all changes to git
- [ ] Push to main branch
- [ ] Vercel auto-deploys
- [ ] Monitor build logs
- [ ] Verify deployment succeeds

#### Post-Deploy Verification
- [ ] Visit production URL
- [ ] Test homepage loads
- [ ] Test authentication (signup/login)
- [ ] Test booking flow
- [ ] Test payment (use live card!)
- [ ] Test all dashboards
- [ ] Check database records created

## Post-Deployment

### ✅ Smoke Tests

#### Authentication
- [ ] Sign up new user
- [ ] Verify email (if enabled)
- [ ] Log in
- [ ] Log out
- [ ] Password reset

#### Booking Flow
- [ ] Browse services
- [ ] Add to cart
- [ ] Complete booking form
- [ ] Schedule pickup
- [ ] Enter address (valid postcode)
- [ ] Complete payment with real card
- [ ] Verify order created in database
- [ ] Check confirmation email (if configured)

#### Runner Dashboard
- [ ] Log in as runner
- [ ] View available jobs
- [ ] Accept a job
- [ ] Record measurements
- [ ] Mark as collected

#### Admin Panel
- [ ] Log in as admin
- [ ] View all orders
- [ ] Assign runner to order
- [ ] Assign tailor to order
- [ ] Update order status
- [ ] View analytics

### ✅ Monitoring

#### Set Up Monitoring
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry optional)
- [ ] Configure uptime monitoring
- [ ] Set up alerts for errors

#### Monitor
- [ ] Check Vercel deployment logs
- [ ] Check Supabase logs
- [ ] Check Stripe webhook logs
- [ ] Monitor error rates
- [ ] Check response times

### ✅ Performance

#### Optimization
- [ ] Enable Vercel Edge Network
- [ ] Optimize images (already using Next.js Image)
- [ ] Enable compression
- [ ] Configure caching headers
- [ ] Test on mobile devices

#### Speed Tests
- [ ] Run Lighthouse audit (aim for 90+)
- [ ] Test on 3G connection
- [ ] Check Core Web Vitals
- [ ] Test page load times

### ✅ Security

#### Checklist
- [ ] Environment variables secure
- [ ] Service role key not exposed to client
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Stripe webhook signature verified
- [ ] CORS configured correctly
- [ ] SQL injection protected (using Supabase ORM)
- [ ] XSS protected (React escapes by default)

#### Review
- [ ] No hardcoded secrets in code
- [ ] No API keys in client-side code
- [ ] All sensitive operations server-side
- [ ] Rate limiting configured (Vercel Edge)

### ✅ Documentation

#### Internal
- [ ] Document deployment process
- [ ] Document environment setup
- [ ] Create runbook for common issues
- [ ] Document backup procedures

#### External (Optional)
- [ ] Create user guide
- [ ] Create FAQ
- [ ] Create terms of service
- [ ] Create privacy policy

### ✅ Legal & Compliance

#### Required
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Cookie consent (if EU users)
- [ ] GDPR compliance (if EU users)
- [ ] Payment processing disclosure
- [ ] Refund policy

#### Stripe Requirements
- [ ] Business information in Stripe
- [ ] Bank account connected
- [ ] Identity verification completed
- [ ] Tax forms submitted (if required)

## Launch Day

### 🎉 Go Live Checklist

1. **Final Verification**
   - [ ] All tests passing
   - [ ] No critical bugs
   - [ ] Payment processing working
   - [ ] All dashboards functional

2. **Switch to Live Mode**
   - [ ] Stripe in live mode
   - [ ] Production database active
   - [ ] Live domain configured
   - [ ] SSL certificate active

3. **Announce Launch**
   - [ ] Notify stakeholders
   - [ ] Marketing campaign ready
   - [ ] Support team briefed
   - [ ] Monitoring active

4. **Monitor Closely**
   - [ ] Watch error logs
   - [ ] Monitor user signups
   - [ ] Check payment success rate
   - [ ] Respond to issues quickly

## Post-Launch

### Week 1
- [ ] Daily monitoring of errors
- [ ] Daily check of payment processing
- [ ] Review user feedback
- [ ] Fix critical bugs immediately
- [ ] Monitor server performance

### Ongoing
- [ ] Weekly database backups
- [ ] Monthly security reviews
- [ ] Quarterly dependency updates
- [ ] Regular performance optimization
- [ ] Feature improvements based on feedback

## Rollback Plan

### If Issues Occur

1. **Minor Issues**
   - Fix and redeploy quickly
   - Monitor fix effectiveness

2. **Major Issues**
   - Rollback to previous Vercel deployment
   - Investigate issue in development
   - Fix and test thoroughly
   - Redeploy when ready

3. **Database Issues**
   - Restore from Supabase backup
   - Review changes that caused issue
   - Test thoroughly before redeploying

## Support Contacts

### Services
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com

### Documentation
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs

## Success Metrics

Track these after launch:
- [ ] User signups
- [ ] Order completion rate
- [ ] Payment success rate
- [ ] Page load times
- [ ] Error rate
- [ ] Customer satisfaction

---

## 🎊 Congratulations!

If you've completed this checklist, TailorSpace is live and ready to serve customers!

**Next Steps:**
1. Monitor performance and errors
2. Gather user feedback
3. Iterate and improve
4. Scale as needed

Good luck with your launch! 🚀
