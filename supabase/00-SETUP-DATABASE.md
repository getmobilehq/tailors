# Database Setup Guide

Follow these steps **in order** to set up your Supabase database from scratch.

## Prerequisites

1. Have a Supabase project created
2. Have your `.env.local` file configured with Supabase credentials
3. Open Supabase Dashboard → SQL Editor

---

## Step 1: Create Base Schema

**File:** `schema.sql`

This creates all tables, triggers, and base RLS policies.

1. Open `supabase/schema.sql`
2. Copy the entire contents
3. Go to Supabase SQL Editor
4. Paste and click **Run**

**Expected result:** Success message, 9 tables created:
- users
- services
- orders
- order_items
- payments
- runner_profiles
- tailor_profiles
- messages
- reviews

---

## Step 2: Seed Services

**File:** `seed-services.sql`

This adds 46 alteration services to the database.

1. Open `supabase/seed-services.sql`
2. Copy the entire contents
3. Go to Supabase SQL Editor
4. Paste and click **Run**

**Expected result:** 46 rows inserted into services table

**Verify:** Check Table Editor → services table (should see 46 services)

---

## Step 3: Fix RLS Policies

**File:** `fix-rls-policies.sql`

This fixes the infinite recursion issue in Row Level Security policies.

1. Open `supabase/fix-rls-policies.sql`
2. Copy the entire contents
3. Go to Supabase SQL Editor
4. Paste and click **Run**

**Expected result:** Success, policies updated

---

## Step 4: Add Pending Payment Status

**File:** `add-pending-payment-status.sql`

This adds `pending_payment` status for the checkout flow and converts prices to decimal.

1. Open `supabase/add-pending-payment-status.sql`
2. Copy the entire contents
3. Go to Supabase SQL Editor
4. Paste and click **Run**

**Expected result:** Success, constraint updated

---

## Step 5: Test the Application

1. Go to http://localhost:3000
2. Navigate to `/book` (should see 46 services)
3. Try adding services to cart
4. Continue through booking flow

**At this point:**
- ✅ Services should display
- ✅ No infinite recursion errors
- ✅ No redirect loops
- ❌ Login/signup will work but won't have test users yet

---

## Step 6: Create Test Users

### 6a. Register Test Accounts

Go to http://localhost:3000/signup and create 4 accounts:

1. **Customer Account**
   - Email: `customer@test.com`
   - Password: `testpass123`
   - Full Name: `Customer User`
   - Phone: `07123456789`

2. **Runner Account**
   - Email: `runner@test.com`
   - Password: `testpass123`
   - Full Name: `Runner User`
   - Phone: `07123456790`

3. **Tailor Account**
   - Email: `tailor@test.com`
   - Password: `testpass123`
   - Full Name: `Tailor User`
   - Phone: `07123456791`

4. **Admin Account**
   - Email: `admin@test.com`
   - Password: `testpass123`
   - Full Name: `Admin User`
   - Phone: `07123456792`

### 6b. Assign Roles

**File:** `create-test-users.sql`

1. Open `supabase/create-test-users.sql`
2. Copy the entire contents
3. Go to Supabase SQL Editor
4. Paste and click **Run**

**Expected result:**
- 4 users updated
- Runner profile created
- Tailor profile created
- Verification query shows all 4 users with correct roles

---

## Step 7: Verify Everything Works

Test each role:

1. **Customer Test**
   - Login as `customer@test.com`
   - Should see `/orders` page
   - Cannot access `/runner`, `/tailor`, or `/admin`

2. **Runner Test**
   - Login as `runner@test.com`
   - Should see `/runner` dashboard
   - Can see available jobs

3. **Tailor Test**
   - Login as `tailor@test.com`
   - Should see `/tailor` dashboard
   - Can see assigned orders

4. **Admin Test**
   - Login as `admin@test.com`
   - Should see `/admin` panel
   - Can manage services, orders, users

---

## Troubleshooting

### "Table already exists" error
- You already ran schema.sql
- Skip to next step
- OR drop all tables and start fresh

### "infinite recursion" error still occurring
- Make sure you ran `fix-rls-policies.sql` AFTER `schema.sql`
- Try running fix-rls-policies.sql again
- Check browser console for exact error

### Services not displaying
- Make sure you ran `seed-services.sql`
- Check Supabase Table Editor → services (should have 46 rows)
- Check browser console for errors

### Cannot create test users
- Make sure accounts are created via signup first
- Then run `create-test-users.sql`
- Check Supabase Authentication → Users (should see 4 users)

### "Request body too large" on checkout
- Make sure you ran `add-pending-payment-status.sql`
- This is already fixed in the code
- Old error from cached data

---

## Quick Verification Checklist

After completing all steps, verify:

- [ ] 9 tables exist in Supabase
- [ ] 46 services in services table
- [ ] No "infinite recursion" errors in console
- [ ] Can access `/book` and see services
- [ ] Can add services to cart
- [ ] 4 test users in Authentication
- [ ] Customer can access `/orders`
- [ ] Runner can access `/runner`
- [ ] Tailor can access `/tailor`
- [ ] Admin can access `/admin`

---

## All Done! 🎉

Your database is now fully set up and ready for testing.

Next steps:
- Test the full booking flow
- Test payment with Stripe test cards
- Test runner accepting jobs
- Test tailor marking orders complete
