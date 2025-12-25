-- Setup Test Tailor User
-- Run this in Supabase SQL Editor

-- Option 1: Create a new tailor from an existing auth user
-- Replace 'your-email@example.com' with an actual email from auth.users

-- Check existing auth users:
SELECT id, email FROM auth.users;

-- Create Tailor Profile (example: create a new one or use existing email)
-- Let's create one for testing - you can use any existing email from above

-- Example: Convert joseph@univelcity.com to have tailor role temporarily for testing
-- (You can switch back to customer role later)

/*
UPDATE users SET role = 'tailor' WHERE email = 'joseph@univelcity.com';

-- Create tailor_profiles entry
INSERT INTO tailor_profiles (user_id, specializations, max_concurrent_orders, rating, total_reviews, completed_jobs, active)
SELECT id, ARRAY['trousers', 'shirts', 'dresses', 'suits'], 20, 5.0, 0, 0, true
FROM auth.users WHERE email = 'joseph@univelcity.com'
ON CONFLICT (user_id) DO NOTHING;
*/

-- OR Option 2: Create a dedicated tailor user
-- First create the user in Supabase Auth Dashboard (tailor@test.com)
-- Then run this:

/*
-- Get the user ID:
SELECT id FROM auth.users WHERE email = 'tailor@test.com';

-- Create profile (replace YOUR_USER_ID with the actual ID):
INSERT INTO users (id, email, full_name, phone, role)
VALUES ('YOUR_USER_ID', 'tailor@test.com', 'Test Tailor', '07123456789', 'tailor')
ON CONFLICT (id) DO UPDATE SET role = 'tailor';

-- Create tailor profile:
INSERT INTO tailor_profiles (user_id, specializations, max_concurrent_orders, rating, total_reviews, completed_jobs, active)
VALUES ('YOUR_USER_ID', ARRAY['trousers', 'shirts', 'dresses', 'suits', 'coats'], 20, 5.0, 0, 0, true)
ON CONFLICT (user_id) DO NOTHING;
*/

-- Recommended: Use joseph@univelcity.com as tailor for testing
-- Just run these two commands:

UPDATE users SET role = 'tailor' WHERE email = 'joseph@univelcity.com';

INSERT INTO tailor_profiles (user_id, specializations, max_concurrent_orders, rating, total_reviews, completed_jobs, active)
SELECT id, ARRAY['trousers', 'shirts', 'dresses', 'suits'], 20, 5.0, 0, 0, true
FROM users WHERE email = 'joseph@univelcity.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the setup
SELECT
  u.email,
  u.full_name,
  u.role,
  CASE
    WHEN tp.user_id IS NOT NULL THEN 'Has tailor profile'
    ELSE 'No tailor profile'
  END as profile_status,
  tp.specializations,
  tp.max_concurrent_orders
FROM users u
LEFT JOIN tailor_profiles tp ON u.id = tp.user_id
WHERE u.email = 'joseph@univelcity.com';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tailor user setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Login as joseph@univelcity.com → should go to /tailor';
  RAISE NOTICE '';
  RAISE NOTICE 'To switch back to customer:';
  RAISE NOTICE 'UPDATE users SET role = ''customer'' WHERE email = ''joseph@univelcity.com'';';
END $$;
