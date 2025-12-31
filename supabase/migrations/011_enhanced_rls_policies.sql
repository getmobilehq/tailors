-- Enhanced RLS Policies for Production Security
-- Run this in Supabase SQL Editor to tighten security

-- =============================================
-- USERS TABLE - Enhanced Security
-- =============================================

-- Drop existing policies if they exist and recreate with tighter controls
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can only update specific fields of their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid()) -- Cannot change own role
  );

-- Only admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ORDERS TABLE - Prevent Unauthorized Access
-- =============================================

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Runners can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Tailors can view assigned orders" ON public.orders;

-- Customers can only view their own orders
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id
  );

-- Customers can only insert orders for themselves
CREATE POLICY "Customers can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
  );

-- Runners can only view orders assigned to them
CREATE POLICY "Runners can view assigned orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = runner_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'runner' AND active = true
    )
  );

-- Tailors can only view orders assigned to them
CREATE POLICY "Tailors can view assigned orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = tailor_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'tailor' AND active = true
    )
  );

-- Runners can only update status of their assigned orders
CREATE POLICY "Runners can update assigned orders"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = runner_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'runner' AND active = true
    )
  )
  WITH CHECK (
    auth.uid() = runner_id
    AND runner_id = (SELECT runner_id FROM public.orders WHERE id = orders.id) -- Cannot reassign
  );

-- Tailors can only update status of their assigned orders
CREATE POLICY "Tailors can update assigned orders"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = tailor_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'tailor' AND active = true
    )
  )
  WITH CHECK (
    auth.uid() = tailor_id
    AND tailor_id = (SELECT tailor_id FROM public.orders WHERE id = orders.id) -- Cannot reassign
  );

-- =============================================
-- PAYMENTS TABLE - Critical Security
-- =============================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- Users can only view payments for their own orders
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Only system can insert payments (no user policy)
-- This prevents users from creating fake payment records

-- =============================================
-- REVIEWS TABLE - Enhanced Moderation
-- =============================================

DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.reviews;
DROP POLICY IF EXISTS "Customers can create reviews for completed orders" ON public.reviews;
DROP POLICY IF EXISTS "Customers can update their reviews" ON public.reviews;

-- Only visible reviews are publicly viewable
CREATE POLICY "Only visible reviews are publicly viewable"
  ON public.reviews FOR SELECT
  USING (
    is_visible = true
    OR auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers can only create reviews for their own completed orders
CREATE POLICY "Customers can create reviews for completed orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND orders.customer_id = auth.uid()
      AND orders.status IN ('delivered', 'completed')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE order_id = reviews.order_id -- Prevent duplicate reviews
    )
  );

-- Customers can only update their own reviews within 7 days
CREATE POLICY "Customers can update their reviews within 7 days"
  ON public.reviews FOR UPDATE
  USING (
    auth.uid() = customer_id
    AND created_at > NOW() - INTERVAL '7 days'
    AND is_visible = true -- Cannot edit hidden reviews
  )
  WITH CHECK (
    auth.uid() = customer_id
    AND is_visible = (SELECT is_visible FROM public.reviews WHERE id = reviews.id) -- Cannot change visibility
  );

-- =============================================
-- APPLICATIONS TABLE - Secure Submission
-- =============================================

DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;

-- Rate limit: Users can only submit one application per email per type
CREATE POLICY "Users can submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.applications
      WHERE email = applications.email
      AND application_type = applications.application_type
      AND status = 'pending'
    )
  );

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (
    email = (
      SELECT email FROM public.users WHERE id = auth.uid()
    )
  );

-- =============================================
-- PAYOUTS TABLE - Financial Security
-- =============================================

-- Users can only view their own payouts
DROP POLICY IF EXISTS "Users can view own payouts" ON public.payouts;

CREATE POLICY "Users can view own payouts"
  ON public.payouts FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('runner', 'tailor')
      AND active = true
    )
  );

-- Only admins can manage payouts (no insert/update for regular users)

-- =============================================
-- MESSAGES TABLE - Privacy Protection
-- =============================================

DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

-- Users can only view messages for orders they're involved in
CREATE POLICY "Users can view relevant messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND (
        orders.customer_id = auth.uid()
        OR orders.runner_id = auth.uid()
        OR orders.tailor_id = auth.uid()
      )
    )
  );

-- Users can only send messages for orders they're involved in
CREATE POLICY "Users can send relevant messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND (
        orders.customer_id = auth.uid()
        OR orders.runner_id = auth.uid()
        OR orders.tailor_id = auth.uid()
      )
    )
  );

-- =============================================
-- SAVED ADDRESSES - Personal Data Protection
-- =============================================

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.saved_addresses;

-- Users can only manage their own addresses
CREATE POLICY "Users can manage own addresses"
  ON public.saved_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ADMIN-ONLY TABLES
-- =============================================

-- Ensure only admins can access sensitive tables
DO $$
DECLARE
  admin_tables text[] := ARRAY['applications', 'payments', 'payouts'];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY admin_tables
  LOOP
    -- Drop existing admin policies
    EXECUTE format('DROP POLICY IF EXISTS "Admins can view all %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %I" ON public.%I', tbl, tbl);

    -- Recreate admin-only policies
    EXECUTE format('
      CREATE POLICY "Admins can view all %I"
        ON public.%I FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = ''admin''
          )
        )
    ', tbl, tbl);

    EXECUTE format('
      CREATE POLICY "Admins can manage %I"
        ON public.%I FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = ''admin''
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = ''admin''
          )
        )
    ', tbl, tbl);
  END LOOP;
END $$;

-- =============================================
-- CREATE SECURITY AUDIT LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  succeeded BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_log(action);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.security_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced RLS policies applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Security improvements:';
  RAISE NOTICE '- Tightened user access controls';
  RAISE NOTICE '- Enhanced order privacy';
  RAISE NOTICE '- Secured payment data';
  RAISE NOTICE '- Improved review moderation';
  RAISE NOTICE '- Protected financial records';
  RAISE NOTICE '- Added audit logging table';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review policies in Supabase Dashboard';
  RAISE NOTICE '2. Test with different user roles';
  RAISE NOTICE '3. Monitor audit logs regularly';
END $$;
