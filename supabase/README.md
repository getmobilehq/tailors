# Supabase Database Scripts

This folder contains all SQL scripts for setting up and fixing the TailorSpace Marketplace database.

## 📋 Setup Order (Fresh Database)

Run these scripts in Supabase SQL Editor in this exact order:

### 1. **schema.sql** (REQUIRED)
Creates all tables, triggers, and initial RLS policies.
- Tables: users, services, orders, order_items, payments, etc.
- Initial RLS policies
- Timestamp triggers

### 2. **create-auto-user-trigger.sql** (REQUIRED - NEW!)
Creates database trigger to auto-create user profiles on signup.
- Runs when someone signs up via Supabase Auth
- Uses SECURITY DEFINER to bypass RLS
- Reads user metadata (full_name, phone) from signup
- **This is the proper Supabase pattern for user profiles!**

### 3. **fix-rls-policies.sql** (REQUIRED)
Fixes broken RLS policies from schema.sql.
- Adds UPDATE policy for profile updates
- Fixes infinite recursion in admin policies

**If this doesn't work, use `FORCE-fix-rls-policies.sql` instead.**

### 4. **fix-existing-users.sql** (REQUIRED if you already have users)
Creates profiles for users who signed up before the trigger was created.
- Checks auth.users table
- Creates missing public.users profiles
- Sets default role to 'customer'

### 5. **seed-services.sql** (OPTIONAL)
Seeds the database with 46 alteration services across categories:
- Trousers, Dresses, Coats & Jackets, Shirts & Tops
- Skirts, Suits, Jeans, Formal Wear

### 6. **add-pending-payment-status.sql** (OPTIONAL)
Adds 'pending_payment' status to orders table.
- Enables new checkout flow (save order before Stripe payment)

---

## 🔧 Diagnostic Scripts

### **verify-policies.sql**
Check what RLS policies currently exist for the users table.
- Should show 4 policies total
- Critical: Must have INSERT and UPDATE policies

### **FORCE-fix-rls-policies.sql**
Alternative fix if `fix-rls-policies.sql` doesn't work.
- Disables RLS temporarily
- Drops ALL existing policies
- Recreates policies with explicit conditions
- Re-enables RLS

---

## 🚨 Troubleshooting

### "new row violates row-level security policy for table 'users'"

**This is the most common issue. It means users can't create their profile during signup.**

**Fix:**
1. Run `verify-policies.sql` - check if INSERT policy exists
2. If missing, run `FORCE-fix-rls-policies.sql`
3. Run `verify-policies.sql` again - should now show 4 policies
4. Run `fix-existing-users.sql` to create profiles for existing users
5. Test signup at http://localhost:3000/auth-test

### "infinite recursion detected in policy"

**This happens when admin policies query the users table in their own conditions.**

**Fix:**
- Run `fix-rls-policies.sql` (already fixed in current version)

### Login works but profile is null

**User has auth account but no profile in public.users table.**

**Fix:**
- Run `fix-existing-users.sql`

---

## 📝 Script Descriptions

| Script | Purpose | Required? |
|--------|---------|-----------|
| `schema.sql` | Create all tables and triggers | ✅ Yes |
| `create-auto-user-trigger.sql` | Auto-create profiles on signup | ✅ Yes (NEW!) |
| `fix-rls-policies.sql` | Fix RLS policies for updates | ✅ Yes |
| `fix-existing-users.sql` | Create profiles for existing users | ⚠️ If users exist |
| `seed-services.sql` | Add alteration services | ⏭️ Optional |
| `add-pending-payment-status.sql` | Enable new checkout flow | ⏭️ Optional |
| `verify-policies.sql` | Check current RLS policies | 🔍 Diagnostic |
| `FORCE-fix-rls-policies.sql` | Force recreate RLS policies | 🔧 Troubleshooting |

---

## 🎯 Complete Setup Commands

**Copy and paste each script into Supabase SQL Editor:**

```sql
-- 1. Schema (creates tables)
-- Copy contents of schema.sql → Run

-- 2. Auto-user trigger (CRITICAL - NEW!)
-- Copy contents of create-auto-user-trigger.sql → Run
-- This enables automatic profile creation on signup

-- 3. Fix RLS policies
-- Copy contents of fix-rls-policies.sql → Run

-- 4. Fix existing users (if any)
-- Copy contents of fix-existing-users.sql → Run

-- 5. Add services (optional)
-- Copy contents of seed-services.sql → Run

-- 6. Add pending payment status (optional)
-- Copy contents of add-pending-payment-status.sql → Run
```

**Total setup time: 3 minutes**

---

## ✅ Verification Checklist

After running all scripts, verify:

- [ ] Tables exist (check Supabase Table Editor)
- [ ] Trigger `on_auth_user_created` exists on auth.users table (NEW!)
- [ ] RLS policies exist for users table (4 total)
- [ ] Services table has 46 rows (if seeded)
- [ ] Existing users have profiles in public.users
- [ ] Can signup new user at http://localhost:3000/auth-test (profile created automatically!)
- [ ] Can login existing user with profile returned

---

## 📚 Additional Documentation

See `FIX-AUTH-NOW.md` for detailed troubleshooting guide.
