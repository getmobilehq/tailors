-- Complete fix for RLS infinite recursion on applications table
-- This drops ALL policies and creates minimal, safe policies

-- Step 1: List all current policies (for debugging)
-- Run this first to see what policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'applications';

-- Step 2: Drop ALL policies on applications table
-- Get all policy names and drop them
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'applications'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.applications', r.policyname);
    END LOOP;
END $$;

-- Step 3: Disable RLS temporarily to ensure clean slate
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

-- Step 4: Re-enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Step 5: Create minimal, safe policies

-- Policy 1: Allow EVERYONE (anonymous + authenticated) to INSERT
-- This is critical - applicants are NOT logged in
CREATE POLICY "applications_insert_anyone"
  ON public.applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT their own by email
-- Uses auth.users which doesn't cause recursion
CREATE POLICY "applications_select_own"
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

-- Policy 3: Allow admins to SELECT all
-- Use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

CREATE POLICY "applications_select_admin"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 4: Allow admins to UPDATE
CREATE POLICY "applications_update_admin"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 5: Allow admins to DELETE
CREATE POLICY "applications_delete_admin"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Step 6: Grant necessary permissions
GRANT SELECT, INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO authenticated;

-- Step 7: Verify the setup (you can run this after)
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   cmd,
--   roles,
--   permissive
-- FROM pg_policies
-- WHERE tablename = 'applications'
-- ORDER BY policyname;
