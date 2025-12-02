# TailorSpace Setup Guide

Follow these steps to get TailorSpace up and running.

## ✅ Prerequisites

- [x] Node.js 18+ installed
- [x] Supabase account created
- [x] Stripe account created (test mode)
- [x] Environment variables configured

## 📋 Step-by-Step Setup

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `/supabase/schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

**Expected Result:** You should see a success message and the following tables created:
- users
- services (with 23 pre-loaded alteration services)
- orders
- order_items
- payments
- runner_profiles
- tailor_profiles
- messages
- reviews

### 2. Create Your First Admin User

1. Start the development server:
   ```bash
   npm install
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Click **Sign Up** and create an account with:
   - Full Name: Your Name
   - Email: your-email@example.com
   - Password: secure-password
   - Phone: Your phone number

4. After signup, go back to Supabase Dashboard
5. Navigate to **Table Editor** → **users**
6. Find your newly created user
7. Click to edit and change the **role** column from `customer` to `admin`
8. Click **Save**

9. Log out and log back in to see the admin dashboard

### 3. Configure Stripe Webhook (For Production)

For local development, the webhook is already configured in `.env.local`. When deploying to production:

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
5. Copy the **Signing secret** and update your production environment variables

### 4. Test the Application

#### Create Test Users

Create additional test accounts with different roles:

1. **Runner Account:**
   - Sign up via /signup
   - Change role to `runner` in Supabase
   - Create runner profile:
     ```sql
     INSERT INTO runner_profiles (user_id, postcode_coverage, max_daily_capacity)
     VALUES ('runner-user-id', ARRAY['NG1', 'NG2', 'NG3'], 10);
     ```

2. **Tailor Account:**
   - Sign up via /signup
   - Change role to `tailor` in Supabase
   - Create tailor profile:
     ```sql
     INSERT INTO tailor_profiles (user_id, specializations, max_concurrent_orders)
     VALUES ('tailor-user-id', ARRAY['trousers', 'shirts', 'dresses'], 20);
     ```

#### Test the Booking Flow

1. Log in as a **customer**
2. Click **Book Now**
3. Add services to cart (e.g., "Trouser Hemming")
4. Fill in item details
5. Schedule a pickup time
6. Proceed to checkout
7. Use Stripe test card: `4242 4242 4242 4242`
8. Complete the payment

#### Test the Runner Dashboard

1. Log in as **admin**
2. Go to **Admin Panel**
3. Find the test order
4. Assign it to a runner
5. Log out and log in as the **runner**
6. Go to **Runner Dashboard**
7. View the assigned order
8. Mark it as collected (add measurements)

#### Test the Admin Panel

1. Log in as **admin**
2. View all orders
3. Assign runners and tailors
4. Update order status
5. View business metrics

### 5. Verify Everything Works

✅ **Authentication:**
- [ ] Users can sign up
- [ ] Users can log in
- [ ] Users can log out
- [ ] Protected routes require login

✅ **Booking Flow:**
- [ ] Services are displayed correctly
- [ ] Cart functionality works
- [ ] Pickup scheduling works
- [ ] Stripe checkout redirects properly
- [ ] Orders are created after payment

✅ **Customer Dashboard:**
- [ ] Orders are displayed
- [ ] Order details show correctly
- [ ] Status badges update properly

✅ **Runner Dashboard:**
- [ ] Runners can see available jobs
- [ ] Runners can accept jobs
- [ ] Runners can record measurements
- [ ] Runners can mark as collected/delivered

✅ **Admin Panel:**
- [ ] All orders are visible
- [ ] Can assign runners/tailors
- [ ] Can update order status
- [ ] Stats display correctly

## 🔧 Troubleshooting

### Database Connection Issues

If you see errors like "relation does not exist":
1. Verify schema was run successfully in Supabase
2. Check your `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

### Stripe Payment Issues

If checkout doesn't work:
1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
3. Check browser console for errors
4. Use test card: `4242 4242 4242 4242`

### Authentication Issues

If login doesn't work:
1. Verify Supabase credentials in `.env.local`
2. Check Supabase Dashboard → Authentication → URL Configuration
3. Make sure `NEXT_PUBLIC_APP_URL` matches your local URL

### RLS Policy Issues

If you get "permission denied" errors:
1. Go to Supabase Dashboard → Authentication
2. Temporarily disable RLS on specific tables for testing
3. Check that policies were created correctly
4. Verify user roles are set correctly

## 📝 Creating Sample Data

### Add More Services

```sql
INSERT INTO services (name, description, category, base_price, estimated_days)
VALUES ('Your Service', 'Description', 'category', 2500, 7);
```

### Create Test Orders Manually

You can create test orders via the booking flow or manually in Supabase SQL Editor.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to Vercel Dashboard
3. Click **New Project**
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)
6. Click **Deploy**

### Update Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Update endpoint URL to your production domain
3. Copy the new webhook secret
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

### Update Supabase URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your production URL to **Site URL**
3. Add redirect URLs: `https://yourdomain.com/**`

## 🎉 You're Ready!

Your TailorSpace application should now be fully functional. Test all features thoroughly before launching to customers.

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs
3. Check Stripe logs
4. Review the RLS policies in Supabase
