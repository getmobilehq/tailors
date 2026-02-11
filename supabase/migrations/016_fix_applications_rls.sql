-- Fix infinite recursion in applications table RLS policies
-- The issue: policies that check users table can cause recursion
-- Solution: Simplify policies and use direct auth.uid() checks

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;

-- Recreate policies with fixed logic

-- 1. Allow ANYONE (including anonymous) to INSERT applications
-- This is critical - applicants are not logged in when applying
CREATE POLICY "allow_anonymous_insert"
  ON public.applications
  FOR INSERT
  WITH CHECK (true);

-- 2. Allow authenticated users to view their own applications by email
CREATE POLICY "allow_view_own_by_email"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 3. Allow admins to view all applications
-- Use a simpler check that avoids recursion
CREATE POLICY "allow_admin_view_all"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 4. Allow admins to update applications
CREATE POLICY "allow_admin_update"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 5. Allow admins to delete applications (optional, for cleanup)
CREATE POLICY "allow_admin_delete"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
