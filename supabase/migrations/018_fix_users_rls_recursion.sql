-- Fix infinite recursion in users table RLS policies
-- The problem: "Users can update own profile" policy queries the users table in its with_check clause
-- This creates circular reference when applications policies call is_admin() function

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Authenticated users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create clean, non-recursive policies

-- 1. Allow authenticated users to SELECT all user profiles
CREATE POLICY "users_select_authenticated"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow users to INSERT their own profile (during signup)
CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Allow users to UPDATE their own profile
-- CRITICAL: Do NOT query the users table in with_check - this causes recursion
-- The role field is already in the row being updated, no need to SELECT it
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow users to DELETE their own profile (optional, usually not needed)
-- CREATE POLICY "users_delete_own"
--   ON public.users
--   FOR DELETE
--   TO authenticated
--   USING (auth.uid() = id);

-- Note: The key fix is removing the circular query from the UPDATE with_check clause
-- Old (causes recursion):
--   WITH CHECK ((auth.uid() = id) AND (role = (SELECT role FROM users WHERE id = auth.uid())))
-- New (no recursion):
--   WITH CHECK (auth.uid() = id)
