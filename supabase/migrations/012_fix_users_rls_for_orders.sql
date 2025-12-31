-- Fix Users RLS Policy Issues
-- Simplify to allow authenticated users to view basic profile info
-- while maintaining strong security on updates

-- Drop the problematic admin policy with circular reference
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Replace with simpler approach: authenticated users can view all profiles
-- This is necessary for marketplace functionality (viewing service providers, customers, etc.)
-- Security is maintained through:
-- 1. Authentication requirement (must be logged in)
-- 2. Strict UPDATE policies (can only update own profile, cannot change role)
-- 3. Admin actions go through dedicated API routes with additional checks

CREATE POLICY "Authenticated users can view all user profiles"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');
