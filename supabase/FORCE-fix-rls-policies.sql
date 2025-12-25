-- FORCE FIX: Alternative approach to fixing RLS policies
-- Use this if fix-rls-policies.sql didn't work
-- This script is more aggressive and explicit

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies with explicit conditions

-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow all authenticated users to view profiles (needed for app navigation)
CREATE POLICY "Authenticated users can view user profiles"
ON public.users
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Policy 3: CRITICAL - Allow users to INSERT their own profile during signup
CREATE POLICY "Users can create their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 5: Verify policies were created
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as operation,
  CASE
    WHEN policyname LIKE '%create%' THEN '✓ CRITICAL FOR SIGNUP'
    WHEN policyname LIKE '%update%' THEN '✓ Needed for settings'
    ELSE 'Supporting policy'
  END as importance
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY cmd;
