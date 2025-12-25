-- Fix existing users who have auth accounts but no profiles
-- This happens when users signed up before RLS policies were fixed

-- For each user in auth.users who doesn't have a profile in public.users,
-- create a profile with default values

-- Note: This uses the service role to bypass RLS
-- Run this in Supabase SQL Editor

INSERT INTO public.users (id, email, full_name, phone, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
  COALESCE(au.raw_user_meta_data->>'phone', '') as phone,
  'customer' as role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT
  au.id,
  au.email,
  pu.full_name,
  pu.role,
  CASE
    WHEN pu.id IS NOT NULL THEN 'Has profile ✓'
    ELSE 'Missing profile ✗'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;
