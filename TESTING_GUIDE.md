# Testing Guide

Quick reference for testing different user roles and features.

---

## Quick Logout for Testing

To quickly switch between test accounts:

### Method 1: Direct Logout URL
Navigate to: **http://localhost:3000/logout**

This will immediately log you out and redirect to the login page.

### Method 2: Dashboard Dropdown
1. Click your avatar in the top-right corner
2. Click "Sign Out"

---

## Test User Accounts

After running the setup scripts, you'll have these test accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Customer | `customer@test.com` | `testpass123` | `/orders` |
| Runner | `runner@test.com` | `testpass123` | `/runner` |
| Tailor | `tailor@test.com` | `testpass123` | `/tailor` |
| Admin | `admin@test.com` | `testpass123` | `/admin` |

---

## Testing Workflow

### 1. Test Customer Flow

**Login:** `customer@test.com`

**Test Cases:**
- [ ] View empty orders page
- [ ] Click "New Order" button
- [ ] Browse services by category
- [ ] Add multiple services to cart
- [ ] Remove items from cart
- [ ] Continue to item details
- [ ] Upload photos for garments
- [ ] Add descriptions and notes
- [ ] Schedule pickup date/time
- [ ] Enter delivery address (must be NG postcode)
- [ ] Complete Stripe checkout
- [ ] View order confirmation
- [ ] Check order appears in orders list

**Test Card:** `4242 4242 4242 4242` (any future date, any CVC)

### 2. Test Runner Flow

**Logout:** http://localhost:3000/logout
**Login:** `runner@test.com`

**Test Cases:**
- [ ] View available jobs (orders with no runner assigned)
- [ ] Accept a job
- [ ] View assigned jobs list
- [ ] Navigate to customer address
- [ ] Mark order as "Collected"
- [ ] Enter customer measurements
- [ ] Add runner notes
- [ ] View jobs ready for delivery
- [ ] Mark order as "Delivered"

### 3. Test Tailor Flow

**Logout:** http://localhost:3000/logout
**Login:** `tailor@test.com`

**Test Cases:**
- [ ] View assigned orders
- [ ] See order details and garment photos
- [ ] Mark items as "In Progress"
- [ ] Add tailor notes
- [ ] Mark items as "Done"
- [ ] Mark entire order as "Ready"
- [ ] View completed orders history

### 4. Test Admin Flow

**Logout:** http://localhost:3000/logout
**Login:** `admin@test.com`

**Test Cases:**
- [ ] View all users
- [ ] Edit user roles
- [ ] View all orders
- [ ] Manually assign runner to order
- [ ] Manually assign tailor to order
- [ ] View/edit services
- [ ] Add new service
- [ ] Disable service
- [ ] View system statistics
- [ ] Export data (if implemented)

---

## Testing Role-Based Access Control

Test that users cannot access pages they shouldn't:

### Customer Restrictions
- ❌ Cannot access `/runner`
- ❌ Cannot access `/tailor`
- ❌ Cannot access `/admin`
- ✅ Redirected to `/orders` if they try

### Runner Restrictions
- ❌ Cannot access `/tailor`
- ❌ Cannot access `/admin`
- ✅ Can access `/orders` (their own orders as customer)

### Tailor Restrictions
- ❌ Cannot access `/runner`
- ❌ Cannot access `/admin`
- ✅ Can access `/orders` (their own orders as customer)

**Test:** While logged in as customer, manually navigate to:
- http://localhost:3000/runner → Should redirect to /orders
- http://localhost:3000/tailor → Should redirect to /orders
- http://localhost:3000/admin → Should redirect to /orders

---

## Testing Booking Flow End-to-End

### Step 1: Select Services
1. Go to http://localhost:3000/book
2. Browse categories: Trousers, Shirts, Jackets, Dresses, Zips
3. Add 3-5 services to cart
4. Verify cart total updates correctly
5. Remove one item from cart
6. Click "Continue"

### Step 2: Item Details
1. For each cart item:
   - Add garment description (e.g., "Blue jeans, slight fade")
   - Upload 1-2 photos (test both small and large images)
   - Add quantity if needed
   - Add special notes
2. Click "Continue"

### Step 3: Schedule Pickup
1. Select pickup date (tomorrow or later)
2. Choose time slot:
   - Morning (8am-12pm)
   - Afternoon (12pm-5pm)
   - Evening (5pm-8pm)
3. Click "Continue"

### Step 4: Checkout
1. Enter collection address:
   - Line 1: `123 Test Street`
   - City: `Nottingham`
   - Postcode: `NG1 1AA` (must start with NG)
   - Phone: `07123456789`
2. Add delivery notes (optional)
3. Click "Pay Securely"

### Step 5: Stripe Payment
1. Card number: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., `12/25`)
3. CVC: Any 3 digits (e.g., `123`)
4. Click "Pay"

### Step 6: Success
1. Verify success page shows order number
2. Click "View Order"
3. Verify order appears in orders list with correct status

---

## Testing Edge Cases

### Authentication
- [ ] Try accessing /orders while logged out → Redirected to /login
- [ ] Login with wrong password → Error message shown
- [ ] Login with non-existent email → Error message shown
- [ ] Signup with existing email → Error message shown
- [ ] Signup with weak password (< 8 chars) → Error message shown

### Booking Flow
- [ ] Try skipping steps (manually navigate to /book/checkout) → Redirected back
- [ ] Add item to cart, clear localStorage, reload → Cart restored
- [ ] Try checkout with non-NG postcode → Validation error
- [ ] Try checkout without filling required fields → Validation errors
- [ ] Cancel Stripe payment → Returns to checkout page

### Cart & Storage
- [ ] Add many items to cart → No localStorage quota error
- [ ] Upload large photos → Photos displayed but not in localStorage
- [ ] Refresh page during booking → State persists
- [ ] Clear cookies → Logged out, cart cleared

### Orders
- [ ] View orders with different statuses
- [ ] Check order status badge colors correct
- [ ] Verify timestamps display correctly
- [ ] Check photos display in order details

---

## Performance Testing

### Load Testing
- [ ] Add 20+ services to cart → No lag
- [ ] Upload 10+ photos → Handles gracefully
- [ ] Browse all service categories → Fast switching
- [ ] Navigate between pages → Quick routing

### Browser Testing
Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Responsive Testing
Test at different screen sizes:
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px+)
- [ ] Large Desktop (1920px+)

---

## Debugging Tips

### View Server Logs
Watch the terminal running `npm run dev` for:
- API errors
- Database errors
- Supabase RLS errors
- Stripe webhook events

### View Browser Console
Check for:
- JavaScript errors
- Failed API requests
- Network timeouts
- React warnings

### Check Supabase Logs
Dashboard → Logs:
- Auth logs (login/signup events)
- Database logs (queries, errors)
- Realtime logs (if using subscriptions)

### Verify Database State
Table Editor:
- Check `users` table has profiles
- Check `services` table has 46 services
- Check `orders` table after checkout
- Check `order_items` has photos array
- Check `payments` table has Stripe IDs

---

## Common Issues & Solutions

### "Infinite recursion" Error
**Cause:** RLS policies not fixed
**Solution:** Run `fix-rls-policies.sql`

### Redirect Loop (307)
**Cause:** Cannot fetch user role due to RLS error
**Solution:** Run `fix-rls-policies.sql`

### Services Not Showing
**Cause:** Services not seeded
**Solution:** Run `seed-services.sql`

### Cannot Login After Signup
**Cause:** User profile not created
**Solution:** Check RLS policies, verify users table

### Photos Not Saving
**Cause:** Photos too large for Stripe
**Solution:** Already fixed - photos saved in database first

### Checkout "Request Body Too Large"
**Cause:** Old checkout flow (fixed)
**Solution:** Clear browser cache, try again

### "Location is not defined" Error
**Cause:** Server component accessing window.location
**Solution:** Minor issue, doesn't affect functionality

---

## Stripe Test Cards

| Scenario | Card Number | Details |
|----------|-------------|---------|
| Success | `4242 4242 4242 4242` | Any future date, any CVC |
| Decline | `4000 0000 0000 0002` | Any future date, any CVC |
| Insufficient Funds | `4000 0000 0000 9995` | Any future date, any CVC |
| Requires 3DS | `4000 0027 6000 3184` | Any future date, any CVC |

**Important:** Only use test cards in development. Never use real cards.

---

## Testing Checklist (MVP)

Before considering the app "ready", verify:

### Core Functionality
- [x] User signup and login works
- [x] Role-based access control works
- [x] Services display correctly
- [x] Cart add/remove works
- [x] Photo upload works
- [x] Checkout flow completes
- [x] Stripe payment succeeds
- [x] Orders created in database
- [x] Order status displays correctly

### Role-Specific Features
- [ ] Customer can view their orders
- [ ] Runner can accept jobs
- [ ] Runner can mark collected/delivered
- [ ] Tailor can view assigned orders
- [ ] Tailor can mark items complete
- [ ] Admin can view all data

### Critical Bugs Fixed
- [x] No infinite recursion errors
- [x] No redirect loops
- [x] No localStorage quota errors
- [x] No Stripe request size errors
- [ ] All images display correctly
- [ ] All forms validate properly

---

## Next Steps After Testing

Once all tests pass:
1. Deploy to production (Vercel recommended)
2. Update Stripe webhook URL to production domain
3. Configure Supabase Auth with production URL
4. Set up real Stripe account (switch from test mode)
5. Update email templates in Supabase
6. Enable email verification
7. Set up monitoring/logging
8. Create admin documentation

---

**Happy Testing!** 🧪

For issues, check the `AUTHENTICATION_REPORT.md` for detailed system documentation.
