-- Delete all users except joseph@univelcity.com
-- Run this in Supabase SQL Editor

-- Step 1: Delete profiles from public.users (except joseph)
DELETE FROM public.users
WHERE email != 'joseph@univelcity.com';

-- Step 2: Delete auth users (except joseph)
-- Note: This requires admin privileges, so we use a function

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM auth.users
    WHERE email != 'joseph@univelcity.com'
  LOOP
    -- Delete the auth user
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
END $$;

-- Step 3: Verify what's left
SELECT
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.full_name,
  pu.role,
  pu.created_at as profile_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
