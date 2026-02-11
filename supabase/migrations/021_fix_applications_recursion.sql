-- Fix infinite recursion in applications RLS policies
-- Problem: Querying users table from applications policies causes recursion detection
-- Solution: Create SECURITY DEFINER function that bypasses RLS

-- Drop existing policies
DROP POLICY IF EXISTS "applications_allow_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_select_own_email" ON public.applications;
DROP POLICY IF EXISTS "applications_select_if_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_update_if_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_if_admin" ON public.applications;

-- Create a SECURITY DEFINER function that bypasses RLS
-- This function runs with the privileges of the function owner (superuser)
-- and bypasses RLS policies, preventing recursion
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO anon;

-- Create new policies using the SECURITY DEFINER function

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

-- 3. Allow SELECT for admin users (using SECURITY DEFINER function)
CREATE POLICY "applications_select_if_admin"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

-- 4. Allow UPDATE for admin users
CREATE POLICY "applications_update_if_admin"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (current_user_is_admin());

-- 5. Allow DELETE for admin users
CREATE POLICY "applications_delete_if_admin"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (current_user_is_admin());

-- Ensure proper grants
GRANT SELECT, INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO authenticated;
