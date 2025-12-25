-- Verify RLS policies exist for users table
-- Run this in Supabase SQL Editor to see what policies are currently active

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Expected policies:
-- 1. "Users can view their own profile" - SELECT
-- 2. "Authenticated users can view user profiles" - SELECT
-- 3. "Users can create their own profile" - INSERT
-- 4. "Users can update their own profile" - UPDATE

-- If you see fewer than 4 policies, the fix-rls-policies.sql didn't apply correctly
