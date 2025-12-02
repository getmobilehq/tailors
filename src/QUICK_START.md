# 🚀 TailorSpace Quick Start

Get up and running in 5 minutes!

## ✅ Prerequisites Completed

- [x] Supabase project created
- [x] Stripe account setup (test mode)
- [x] Environment variables configured in `.env.local`

## 📝 Quick Start Steps

### 1️⃣ Install Dependencies (2 minutes)

```bash
npm install
```

### 2️⃣ Setup Database (2 minutes)

1. Open Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy everything from `/supabase/schema.sql`
4. Paste and click **Run**
5. Wait for success message ✓

### 3️⃣ Start Development Server (1 minute)

```bash
npm run dev
```

Open: http://localhost:3000

### 4️⃣ Create Admin Account (2 minutes)

1. Go to http://localhost:3000/signup
2. Create account:
   - Name: Your Name
   - Email: admin@example.com
   - Password: password123
   - Phone: 07123456789

3. In Supabase Dashboard → **Table Editor** → **users**
4. Find your user and change `role` from `customer` to `admin`
5. Log out and log back in

### 5️⃣ Test Booking Flow (3 minutes)

1. Click **Book Now**
2. Add "Trouser Hemming" to cart
3. Fill in item details
4. Choose pickup date/time
5. Enter address (use Nottingham postcode: NG1 1AA)
6. Use Stripe test card: **4242 4242 4242 4242**
7. Complete payment ✓

### 6️⃣ Create Test Runner (Optional - 3 minutes)

1. Sign up new account: runner@example.com
2. In Supabase SQL Editor, run:

```sql
-- Change user to runner role
UPDATE users 
SET role = 'runner' 
WHERE email = 'runner@example.com';

-- Create runner profile
INSERT INTO runner_profiles (user_id, postcode_coverage, max_daily_capacity)
SELECT id, ARRAY['NG1', 'NG2', 'NG3', 'NG5', 'NG7', 'NG9'], 10
FROM users 
WHERE email = 'runner@example.com';
```

3. Log in as runner to see dashboard

### 7️⃣ Create Test Tailor (Optional - 3 minutes)

1. Sign up new account: tailor@example.com
2. In Supabase SQL Editor, run:

```sql
-- Change user to tailor role
UPDATE users 
SET role = 'tailor' 
WHERE email = 'tailor@example.com';

-- Create tailor profile
INSERT INTO tailor_profiles (user_id, specializations, max_concurrent_orders)
SELECT id, ARRAY['trousers', 'shirts', 'dresses', 'suits', 'coats'], 20
FROM users 
WHERE email = 'tailor@example.com';
```

3. Log in as tailor to see dashboard

## 🎯 What to Test

### As Customer:
- ✓ Browse services
- ✓ Add to cart
- ✓ Book alteration
- ✓ View orders
- ✓ Track order status

### As Runner:
- ✓ View available jobs
- ✓ Accept job
- ✓ Mark as collected
- ✓ Add measurements
- ✓ Mark as delivered

### As Admin:
- ✓ View all orders
- ✓ Assign runners
- ✓ Assign tailors
- ✓ Update order status
- ✓ View analytics

## 🔧 Common Issues

### Can't log in?
- Check Supabase credentials in `.env.local`
- Verify user exists in Supabase users table

### Payment fails?
- Use test card: 4242 4242 4242 4242
- Check Stripe keys in `.env.local`
- Verify STRIPE_SECRET_KEY starts with `sk_test_`

### Database errors?
- Verify schema.sql ran successfully
- Check all tables exist in Supabase
- Ensure RLS policies are enabled

### "Permission denied" errors?
- Check user role is set correctly
- Verify RLS policies in Supabase
- Try disabling RLS temporarily for testing

## 📚 File Structure

```
/app                    - Next.js app directory
  /(marketing)         - Public pages (home, pricing)
  /(auth)              - Login/signup pages
  /(dashboard)         - Protected dashboards
  /book                - Booking flow
  /api                 - API routes

/components            - React components
  /ui                  - shadcn/ui components
  /booking             - Booking components
  /orders              - Order components
  /runner              - Runner components
  /admin               - Admin components

/lib                   - Utilities
  /supabase            - Supabase client config
  constants.ts         - App constants
  types.ts             - TypeScript types
  utils.ts             - Helper functions

/supabase              - Database files
  schema.sql           - Database schema
  useful-queries.sql   - Helpful SQL queries
```

## 🎨 Key Features

- **Fixed Pricing**: Transparent prices for all services
- **£7 Flat Fee**: Pickup & delivery included
- **Expert Runners**: Skilled consultants, not just drivers
- **Real-time Tracking**: Monitor order status
- **Secure Payments**: Stripe integration
- **Role-based Access**: Customer, Runner, Tailor, Admin

## 📞 Next Steps

1. ✅ Test all user flows
2. ✅ Create sample data
3. ✅ Customize services
4. ✅ Add your branding
5. ✅ Deploy to Vercel

## 🚀 Deploy to Production

See `SETUP_GUIDE.md` for detailed deployment instructions.

---

**Ready to launch? Let's go! 🎉**
