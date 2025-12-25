# Netlify Deployment Guide for TailorSpace

This guide will help you deploy TailorSpace to Netlify with automatic CI/CD.

## Prerequisites

- Netlify account (sign up at https://netlify.com)
- GitHub repository pushed (✅ already done)
- Supabase project set up
- Stripe account configured
- Resend API key

---

## Step 1: Install Netlify Next.js Plugin

First, add the Netlify Next.js plugin to your project:

```bash
npm install -D @netlify/plugin-nextjs
```

---

## Step 2: Connect Repository to Netlify

1. **Log in to Netlify**: https://app.netlify.com
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to GitHub**:
   - Authorize Netlify to access your GitHub account
   - Select the repository: `getmobilehq/tailors`
4. **Configure build settings**:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build` (auto-detected)
   - **Publish directory**: `.next` (auto-detected)
   - **Functions directory**: Leave empty (Next.js API routes will be handled)

---

## Step 3: Configure Environment Variables

In Netlify dashboard, go to **Site settings** → **Environment variables** and add:

### Required Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_... (use live key for production)
STRIPE_WEBHOOK_SECRET=whsec_... (update this after deployment)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (if using in frontend)

# Resend Email
RESEND_API_KEY=re_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app (update after deployment)
EMAIL_API_SECRET=your_secure_random_string_for_email_api
NODE_ENV=production
```

### How to add variables:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add each variable one by one
4. Select **"All scopes"** for each variable

---

## Step 4: Deploy

Click **"Deploy site"** button. Netlify will:
1. ✅ Clone your repository
2. ✅ Install dependencies (`npm install`)
3. ✅ Run build command (`npm run build`)
4. ✅ Deploy to CDN

**First deployment takes 3-5 minutes.**

---

## Step 5: Post-Deployment Configuration

### 5.1 Update App URL

After deployment, you'll get a URL like: `https://your-site-name.netlify.app`

1. Go to **Site settings** → **Environment variables**
2. Update `NEXT_PUBLIC_APP_URL` to your Netlify URL
3. **Redeploy** (Netlify will auto-redeploy when you change env vars)

### 5.2 Configure Stripe Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-site-name.netlify.app/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in Netlify environment variables
7. **Redeploy** your site

### 5.3 Update Supabase Settings

In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add your Netlify URL to **Site URL**: `https://your-site-name.netlify.app`
3. Add to **Redirect URLs**:
   - `https://your-site-name.netlify.app/auth/callback`
   - `https://your-site-name.netlify.app`

4. Go to **SQL Editor** and update database settings:
   ```sql
   ALTER DATABASE postgres SET app.settings.app_url TO 'https://your-site-name.netlify.app';
   ALTER DATABASE postgres SET app.settings.api_secret TO 'your_supabase_service_role_key';
   ```

### 5.4 Run Database Migrations

Run all migrations in Supabase SQL Editor (if not already done):

1. `004_update_messages_for_group_chat.sql`
2. `005_reviews_system.sql`
3. `006_email_notifications.sql`
4. `007_photo_storage.sql`

---

## Step 6: Configure Custom Domain (Optional)

1. Go to **Domain settings** → **Add custom domain**
2. Follow Netlify's instructions to configure DNS
3. Netlify provides free HTTPS certificates automatically
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Stripe webhook URL
6. Update Supabase redirect URLs

---

## Step 7: Enable Automatic Deployments (CI/CD)

✅ **Already configured!** Netlify automatically:
- Deploys when you push to `main` branch
- Creates deploy previews for pull requests
- Runs builds in isolated environments

### Branch Deploys:
- **Production**: Deploys from `main` branch automatically
- **Deploy Previews**: Created for every pull request
- **Branch Deploys**: Can enable for specific branches in Site settings

---

## Environment-Specific Deployments

### Production (main branch)
- Uses production environment variables
- Deployed to primary domain
- Full optimization and caching

### Deploy Previews (Pull Requests)
- Uses same environment variables
- Gets unique preview URL
- Perfect for testing before merge

### Branch Deploys (Other branches)
- Can enable in **Site settings** → **Build & deploy** → **Branch deploys**
- Useful for staging environments

---

## Monitoring & Debugging

### View Build Logs:
1. Go to **Deploys** tab
2. Click on any deployment
3. View detailed logs

### Common Issues:

**Build Fails:**
- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version matches

**Environment Variables Not Working:**
- Ensure you've redeployed after adding variables
- Variables must not have quotes in Netlify UI
- Check variable names match exactly

**API Routes Not Working:**
- Ensure `@netlify/plugin-nextjs` is installed
- Check that API routes are in `app/api/` directory
- Verify serverless function size limits

**Database Connection Issues:**
- Verify Supabase credentials are correct
- Check Supabase is allowing connections from Netlify IPs
- Ensure RLS policies are configured

---

## Performance Optimization

### Enable Netlify Edge Functions (Optional):
For even faster response times, consider:
1. **Netlify Analytics**: Track performance
2. **Asset Optimization**: Auto-enabled for images
3. **CDN Caching**: Already configured in `netlify.toml`

### Monitoring:
- **Netlify Analytics**: Built-in analytics
- **Deploy Notifications**: Configure in Settings → Notifications
- **Error Tracking**: Consider Sentry integration

---

## Security Checklist

- ✅ Environment variables are secure (not in code)
- ✅ HTTPS enabled by default
- ✅ Security headers configured in `netlify.toml`
- ✅ Stripe webhook signature verification
- ✅ Supabase RLS policies enabled
- ✅ CORS configured properly

---

## Continuous Deployment Workflow

```
1. Make changes locally
   ↓
2. Commit and push to GitHub
   ↓
3. Netlify automatically detects changes
   ↓
4. Runs build process
   ↓
5. Deploys to production (if on main branch)
   ↓
6. Site goes live automatically! 🚀
```

---

## Rollback Procedure

If something goes wrong:

1. Go to **Deploys** tab
2. Find the last working deployment
3. Click **"Publish deploy"** on that version
4. Site instantly rolls back to that version

---

## Cost Considerations

### Netlify Free Tier Includes:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS
- ✅ Deploy previews
- ✅ Form submissions (100/month)

### If You Exceed Free Tier:
- Upgrade to **Pro** ($19/month):
  - 1TB bandwidth
  - 1,000 build minutes
  - Background functions
  - Priority support

---

## Additional Resources

- **Netlify Docs**: https://docs.netlify.com
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/
- **Troubleshooting**: https://docs.netlify.com/configure-builds/troubleshooting-tips/

---

## Quick Commands

```bash
# Install Netlify CLI (optional, for local testing)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to existing site
netlify link

# Deploy from CLI
netlify deploy --prod

# Test functions locally
netlify dev
```

---

## Support

If you encounter issues:
1. Check Netlify build logs
2. Review environment variables
3. Verify Supabase connection
4. Check Stripe webhook configuration
5. Contact Netlify support: https://www.netlify.com/support/

---

**Your TailorSpace marketplace is now ready for automatic deployments! 🎉**

Every push to `main` will automatically deploy to production.
