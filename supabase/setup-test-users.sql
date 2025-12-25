-- Setup Test Users for Runner and Admin
-- Run this in Supabase SQL Editor

-- First, let's check if the auth users exist:
SELECT id, email FROM auth.users WHERE email IN ('isongini@gmail.com', 'iniagunbiade22@gmail.com');

-- Create Runner Profile (isongini@gmail.com)
INSERT INTO users (id, email, full_name, phone, role)
SELECT id, email, 'Test Runner', '07123456789', 'runner'
FROM auth.users WHERE email = 'isongini@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'runner';

-- Create runner_profiles entry
INSERT INTO runner_profiles (user_id, postcode_coverage, max_daily_capacity, rating, total_reviews, completed_jobs, active)
SELECT id, ARRAY['NG1', 'NG2', 'NG3', 'NG4', 'NG5', 'NG7', 'NG9'], 10, 5.0, 0, 0, true
FROM auth.users WHERE email = 'isongini@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create Admin Profile (iniagunbiade22@gmail.com)
INSERT INTO users (id, email, full_name, phone, role)
SELECT id, email, 'Test Admin', '07987654321', 'admin'
FROM auth.users WHERE email = 'iniagunbiade22@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify the setup
SELECT
  u.email,
  u.full_name,
  u.role,
  CASE
    WHEN rp.user_id IS NOT NULL THEN 'Has runner profile'
    ELSE 'No runner profile'
  END as profile_status
FROM users u
LEFT JOIN runner_profiles rp ON u.id = rp.user_id
WHERE u.email IN ('isongini@gmail.com', 'iniagunbiade22@gmail.com')
ORDER BY u.email;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Test users setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Runner: isongini@gmail.com (with runner profile)';
  RAISE NOTICE 'Admin: iniagunbiade22@gmail.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Login as isongini@gmail.com → should go to /runner';
  RAISE NOTICE '2. Login as iniagunbiade22@gmail.com → should go to /admin';
  RAISE NOTICE '3. Both can view and manage orders';
END $$;
