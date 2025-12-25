# Migration 006 Fix: Email Notifications for Supabase

## The Problem

The original `006_email_notifications.sql` migration tries to use `ALTER DATABASE` to set custom parameters, which requires superuser privileges. Supabase hosted instances don't allow this.

**Error:**
```
ERROR: 42501: permission denied to set parameter "app.settings.app_url"
```

---

## Solution: Use the Fixed Migration

I've created `006_email_notifications_FIXED.sql` which works around this limitation.

### Option 1: Run the Fixed Migration (Recommended)

1. **Run the fixed migration:**
   - Open Supabase SQL Editor
   - Copy and paste the contents of `006_email_notifications_FIXED.sql`
   - Click **"Run"**

2. **Configure the API secret (IMPORTANT for emails to work):**

   After running the migration, you need to update the function with your actual `EMAIL_API_SECRET`.

   **Steps:**
   a. In Supabase SQL Editor, run this to view the function:
   ```sql
   SELECT pg_get_functiondef('notify_on_status_change'::regproc);
   ```

   b. Copy the function definition

   c. Find this line:
   ```sql
   v_api_secret := NULL; -- Set this to your EMAIL_API_SECRET
   ```

   d. Replace it with your actual secret (same as `EMAIL_API_SECRET` in Netlify):
   ```sql
   v_api_secret := 'your_actual_email_api_secret_here';
   ```

   e. Run the modified function to update it

3. **The app URL is already set:**
   - The function already uses `https://tailorspace.uk`
   - You don't need to change this

---

## Option 2: Disable Database Email Triggers (Alternative)

If you prefer to skip email notifications from database triggers entirely:

1. **Run this simplified version:**

```sql
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update function to ONLY create notifications (no emails)
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_order_number TEXT;
  v_customer_id UUID;
  v_runner_id UUID;
  v_tailor_id UUID;
BEGIN
  -- Get order details
  SELECT order_number, customer_id, runner_id, tailor_id
  INTO v_order_number, v_customer_id, v_runner_id, v_tailor_id
  FROM orders
  WHERE id = NEW.id;

  -- Add timeline entry
  PERFORM add_timeline_entry(
    NEW.id,
    NEW.status,
    auth.uid(),
    (SELECT role FROM users WHERE id = auth.uid()),
    'Status changed to ' || NEW.status
  );

  -- Only create in-app notifications (no emails)
  CASE NEW.status
    WHEN 'pickup_scheduled' THEN
      PERFORM create_notification(
        v_customer_id,
        NEW.id,
        'order_update',
        'Runner Assigned',
        'A runner has been assigned to collect your order ' || v_order_number,
        '/orders/' || NEW.id
      );
    -- ... (add other cases as needed)
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. **Emails will be sent from the application layer instead:**
   - The Stripe webhook already sends order confirmation emails
   - You can add email sending logic in your API routes when updating order status
   - This is actually a cleaner approach for many applications

---

## Recommendation

**For Production: Use Option 1 (Fixed Migration)**

This gives you:
- ✅ In-app notifications (work immediately)
- ✅ Email notifications (work after configuring API secret)
- ✅ Centralized notification logic
- ✅ Automatic emails on every status change

**Steps:**
1. Run `006_email_notifications_FIXED.sql`
2. Edit the function to add your `EMAIL_API_SECRET`
3. Test by changing an order status

---

## How to Update the Function After Running Migration

### Quick Method (SQL Editor):

```sql
-- 1. First, get your current function
SELECT pg_get_functiondef('notify_on_status_change'::regproc);

-- 2. Copy the output, find this line:
--    v_api_secret := NULL;

-- 3. Replace with:
--    v_api_secret := 'your_email_api_secret_from_netlify';

-- 4. Run the modified CREATE OR REPLACE FUNCTION statement
```

### What the API Secret Should Be:

Use the **SAME value** as your `EMAIL_API_SECRET` environment variable in Netlify.

This is a random string you create (like a password) that authenticates requests to `/api/emails/send`.

**Example:**
```sql
v_api_secret := 'sk_secret_abc123xyz789';  -- Use your actual secret
```

---

## Testing Email Notifications

After configuring:

1. **Create a test order** (go through booking flow)
2. **Update order status** in admin dashboard
3. **Check:**
   - In-app notification appears ✅
   - Email is sent ✅
   - Check Supabase logs for any errors

---

## Troubleshooting

### Emails not sending?

**Check 1:** Is `v_api_secret` set in the function?
```sql
-- View the function to verify
SELECT pg_get_functiondef('notify_on_status_change'::regproc);
```

**Check 2:** Is the API endpoint working?
```bash
# Test the email API directly
curl -X POST https://tailorspace.uk/api/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_email_api_secret" \
  -d '{
    "type": "order_status_update",
    "data": {
      "to": "test@example.com",
      "customerName": "Test User",
      "orderNumber": "TS123",
      "status": "collected"
    }
  }'
```

**Check 3:** Check Supabase logs
- Go to Supabase Dashboard → Database → Logs
- Look for errors from `notify_on_status_change`

### In-app notifications not working?

Make sure you ran migration `003_notifications_and_timeline.sql` first.

---

## Summary

1. ✅ Use `006_email_notifications_FIXED.sql`
2. ✅ Update the function with your `EMAIL_API_SECRET`
3. ✅ Test by updating an order status
4. ✅ In-app notifications work immediately
5. ✅ Emails work after API secret is configured

---

**The fixed migration is production-ready and works with Supabase hosted instances!** 🎉
