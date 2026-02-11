-- Simplify applications RLS to avoid any recursion
-- The issue: Even with SECURITY DEFINER, PostgreSQL detects potential recursion
-- Solution: Use role-based policies that don't query any tables

-- Drop all existing policies
DROP POLICY IF EXISTS "applications_insert_anyone" ON public.applications;
DROP POLICY IF EXISTS "applications_select_own" ON public.applications;
DROP POLICY IF EXISTS "applications_select_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_update_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_admin" ON public.applications;

-- Drop the is_admin function since it's causing recursion detection
DROP FUNCTION IF EXISTS public.is_admin();

-- Create new simplified policies

-- 1. Allow EVERYONE (anon + authenticated) to INSERT applications
CREATE POLICY "applications_allow_insert"
  ON public.applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Allow authenticated users to SELECT their own applications by email
CREATE POLICY "applications_select_own_email"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- 3. Allow SELECT for users with admin role (without function call)
-- This queries users table but doesn't create recursion because:
-- - It's in the USING clause only (not WITH CHECK)
-- - The users policies don't reference applications
CREATE POLICY "applications_select_if_admin"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 4. Allow UPDATE for admin users
CREATE POLICY "applications_update_if_admin"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 5. Allow DELETE for admin users
CREATE POLICY "applications_delete_if_admin"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Ensure proper grants
GRANT SELECT, INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO authenticated;
