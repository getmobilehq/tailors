# Checkout Error Analysis

## 🔍 Issues Identified

After analyzing the checkout flow, I've identified **5 major issues** that are likely causing the checkout errors:

---

## 1. ⚠️ CRITICAL: Data Type Mismatch (Pounds vs Pence)

**Location:** `app/api/orders/create/route.ts:17-20` vs Database Schema

**Problem:**
- `schema.sql` defines prices as **INTEGER in pence** (e.g., 700 = £7.00)
- `add-pending-payment-status.sql` changes to **DECIMAL in pounds** (e.g., 7.00 = £7.00)
- API routes calculate in **pounds** but the database might still be in **pence**

**Code in `route.ts`:**
```typescript
const subtotal = items.reduce((sum: number, item: any) =>
  sum + (item.service.price * item.quantity), 0  // ← Assuming price is in pounds
)
const total = subtotal + DELIVERY_FEE  // ← DELIVERY_FEE = 7 (pounds)
```

**Database expects:**
- If `add-pending-payment-status.sql` NOT run: Values in pence (700 for £7)
- If `add-pending-payment-status.sql` WAS run: Values in pounds (7.00 for £7)

**Impact:**
- Orders might be created with wrong amounts (£7 instead of £0.07 or vice versa)
- Stripe checkout will have incorrect totals
- Data corruption in database

**Recommendation:**
1. Check if `add-pending-payment-status.sql` was actually run in Supabase
2. Standardize ALL price handling to either pounds OR pence (I recommend pounds with DECIMAL)
3. Update constants.ts to clarify units
4. Add validation to ensure prices are in expected format

---

## 2. 🔴 CRITICAL: Missing User Profile Causes 401 Unauthorized

**Location:** `app/api/orders/create/route.ts:8-12`

**Problem:**
```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

This checks if auth user exists, BUT doesn't check if profile exists in `public.users`.

**The Issue:**
1. User signs up → Auth user created in `auth.users`
2. Profile creation fails (RLS issues we've been dealing with)
3. User can navigate to checkout (middleware sees auth user)
4. Checkout succeeds up to line 8 (auth user exists)
5. **But:** Later the RLS policy fails because `auth.uid()` returns a user with no profile
6. **Or:** Order creation uses `user.id` but the users table doesn't have this ID

**Impact:**
- 401 Unauthorized errors during checkout
- Orders fail to create
- Money might be charged without order being created

**Recommendation:**
1. Add profile existence check in order creation API
2. Create order using admin client (service role) to bypass RLS
3. Validate user has profile before allowing checkout access

---

## 3. ⚠️ RLS Policy Timing Issue - Order Items Creation

**Location:** `supabase/schema.sql` - Order Items INSERT Policy

**Problem:**
```sql
CREATE POLICY "Customers can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );
```

**The Issue:**
The policy checks if the order exists with matching customer_id, but:
1. Order is created in transaction 1
2. Order items are created immediately after in same request
3. RLS might not see the newly created order due to:
   - Transaction isolation
   - RLS recursion (checking orders table while inserting order_items)
   - Timing between operations

**Impact:**
- Order creates successfully
- Order items fail to insert
- Partial data: Order exists with no items
- User charged but order is incomplete

**Recommendation:**
1. Use admin client for order creation to bypass RLS entirely
2. Or: Disable RLS temporarily during order creation
3. Or: Create both in single atomic transaction with proper isolation level
4. Add rollback mechanism if order_items fail

---

## 4. ⚠️ Missing Status Value - 'pending_payment'

**Location:** `app/api/orders/create/route.ts:31`

**Problem:**
```typescript
status: 'pending_payment',
```

But `schema.sql` defines:
```sql
status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN (
  'booked',
  'pickup_scheduled',
  'collected',
  -- ... NO 'pending_payment' here!
))
```

**Only if `add-pending-payment-status.sql` was run** will this status be valid.

**Impact:**
- If script not run: **Constraint violation** error
- Order creation fails with "invalid status" error
- User sees generic error message

**Recommendation:**
1. Verify `add-pending-payment-status.sql` was run in Supabase
2. Or: Use 'booked' status initially if script wasn't run
3. Add database migration tracking to avoid this issue

---

## 5. ⚠️ Session/Cookie Issues Between Client & Server

**Location:** Cookie handling between checkout page and API routes

**Problem:**
The checkout page is client-side (`'use client'`) but API routes are server-side. Authentication relies on cookies being properly passed.

**Potential Issues:**
- Cookie SameSite restrictions
- Cookie domain mismatch (localhost vs 127.0.0.1)
- Cookie not being sent with fetch requests
- Cookie expires between page load and checkout click
- Server-side cookie reading issues (middleware.ts vs route.ts)

**Impact:**
- User appears logged in on page but API sees them as logged out
- 401 Unauthorized despite valid session
- Intermittent failures (works sometimes, fails others)

**Recommendation:**
1. Add detailed logging to track session state
2. Check browser DevTools → Network → Request Headers for cookies
3. Ensure `credentials: 'include'` if needed (though same-origin shouldn't need it)
4. Check cookie expiration times

---

## 🎯 Recommended Fix Priority

### Priority 1 - MUST FIX IMMEDIATELY:

**Issue #2: Missing Profile Check**
- This is likely the main cause of 401 errors
- Fix: Update order creation to use admin client OR check profile exists first

**Issue #4: Missing Status Value**
- This causes immediate constraint violations
- Fix: Run `add-pending-payment-status.sql` OR change status to 'booked'

### Priority 2 - SHOULD FIX SOON:

**Issue #1: Data Type Mismatch**
- Causes incorrect amounts
- Fix: Standardize to DECIMAL in pounds, update all calculations

**Issue #3: RLS Timing Issue**
- Causes partial orders
- Fix: Use admin client for order creation

### Priority 3 - INVESTIGATE:

**Issue #5: Session/Cookie Issues**
- May be causing intermittent failures
- Fix: Add logging and monitoring

---

## 🔧 Proposed Solutions

### Solution A: Use Admin Client for Order Creation (RECOMMENDED)

**Pros:**
- Bypasses ALL RLS issues
- Atomic operation
- No timing problems
- Most reliable

**Cons:**
- Need to validate user manually
- Must be careful with security

**Implementation:**
```typescript
// In app/api/orders/create/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // Step 1: Verify user with regular client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Check profile exists
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
  }

  // Step 3: Use admin client to create order (bypasses RLS)
  const adminClient = createAdminClient()

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({ ... })
    .select()
    .single()

  // Step 4: Create order items with admin client
  const { error: itemsError } = await adminClient
    .from('order_items')
    .insert(orderItems)

  // ...
}
```

---

### Solution B: Fix Data Types First

**Before any other fixes:**

1. Run this query in Supabase to check current data types:
```sql
SELECT
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name IN ('orders', 'order_items', 'payments')
  AND column_name IN ('subtotal', 'total', 'delivery_fee', 'price', 'amount');
```

2. If types are INTEGER (pence):
   - Either run `add-pending-payment-status.sql` to convert to DECIMAL
   - Or update all API routes to work in pence

3. If types are DECIMAL (pounds):
   - Update constants.ts to clarify DELIVERY_FEE is in pounds
   - Ensure all calculations are consistent

---

### Solution C: Add Comprehensive Error Handling

Add detailed logging to identify exact failure point:

```typescript
export async function POST(req: NextRequest) {
  try {
    console.log('[CHECKOUT] Starting order creation...')

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[CHECKOUT] Auth user:', user?.id, 'Error:', authError)

    if (!user) {
      console.error('[CHECKOUT] No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', user.id)
      .single()

    console.log('[CHECKOUT] Profile:', profile, 'Error:', profileError)

    if (!profile) {
      console.error('[CHECKOUT] Profile not found for user:', user.id)
      return NextResponse.json({
        error: 'User profile not found. Please contact support.',
        details: 'AUTH_PROFILE_MISMATCH'
      }, { status: 403 })
    }

    const body = await req.json()
    console.log('[CHECKOUT] Request body:', JSON.stringify(body, null, 2))

    // ... rest of code with logging at each step
  } catch (error: any) {
    console.error('[CHECKOUT] Unexpected error:', error)
    console.error('[CHECKOUT] Stack:', error.stack)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      type: error.constructor.name
    }, { status: 500 })
  }
}
```

---

## 📊 Testing Checklist

After implementing fixes, test:

- [ ] User with valid profile can create order
- [ ] User without profile gets clear error message
- [ ] Order and order_items created atomically
- [ ] Prices stored correctly in database
- [ ] Stripe checkout receives correct amount
- [ ] pending_payment status accepted by database
- [ ] Session persists from page to API call
- [ ] Error messages are clear and actionable

---

## 🎯 Next Steps

1. **Immediate:** Check server logs when checkout fails - what error appears?
2. **Immediate:** Run database query to check data types
3. **Immediate:** Verify `add-pending-payment-status.sql` was run
4. **Immediate:** Check if current user has profile in public.users
5. **Then:** Implement Solution A (admin client) if profile exists
6. **Then:** Add comprehensive error logging
7. **Finally:** Test end-to-end and monitor

---

**Most Likely Root Cause:**

Based on the authentication issues we've been debugging, the **#1 most likely cause** is:

> **User exists in `auth.users` but NOT in `public.users` (missing profile)**
>
> → Middleware allows access (sees auth user)
> → Checkout page loads fine
> → Order creation API sees auth user
> → But RLS policies fail because no profile exists
> → Result: 401 Unauthorized or silent failure

**Quick Test:**
Run this in Supabase SQL Editor:
```sql
SELECT
  au.id,
  au.email,
  pu.id as profile_id,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;
```

If you see users with `profile_id = NULL`, that's your smoking gun. 🔫
