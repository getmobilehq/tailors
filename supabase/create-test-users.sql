-- Create test users with different roles
-- Run this after users sign up through the app's registration

-- Instructions:
-- 1. Create accounts through the app at /register with these emails:
--    - admin@test.com (password: testpass123)
--    - runner@test.com (password: testpass123)
--    - tailor@test.com (password: testpass123)
--    - customer@test.com (password: testpass123)
--
-- 2. After registering, run this script to assign roles:

-- Update admin user
UPDATE public.users
SET role = 'admin',
    full_name = 'Admin User',
    phone = '+1234567890'
WHERE email = 'admin@test.com';

-- Update runner user
UPDATE public.users
SET role = 'runner',
    full_name = 'Runner User',
    phone = '+1234567891'
WHERE email = 'runner@test.com';

-- Create runner profile
INSERT INTO public.runner_profiles (user_id, postcode_coverage, max_daily_capacity)
SELECT id, ARRAY['NG1', 'NG2', 'NG3', 'NG4', 'NG5', 'NG6', 'NG7', 'NG8', 'NG9']::text[], 10
FROM public.users
WHERE email = 'runner@test.com'
ON CONFLICT (user_id) DO NOTHING;

-- Update tailor user
UPDATE public.users
SET role = 'tailor',
    full_name = 'Tailor User',
    phone = '+1234567892'
WHERE email = 'tailor@test.com';

-- Create tailor profile
INSERT INTO public.tailor_profiles (user_id, specializations, max_concurrent_orders)
SELECT id, ARRAY['alterations', 'hemming', 'repairs']::text[], 20
FROM public.users
WHERE email = 'tailor@test.com'
ON CONFLICT (user_id) DO NOTHING;

-- Update customer user (default role)
UPDATE public.users
SET role = 'customer',
    full_name = 'Customer User',
    phone = '+1234567893'
WHERE email = 'customer@test.com';

-- Verify the users were created correctly
SELECT u.id, u.email, u.role, u.full_name, u.phone,
       CASE
         WHEN rp.id IS NOT NULL THEN 'Has runner profile'
         WHEN tp.id IS NOT NULL THEN 'Has tailor profile'
         ELSE 'No profile'
       END as profile_status
FROM public.users u
LEFT JOIN public.runner_profiles rp ON u.id = rp.user_id
LEFT JOIN public.tailor_profiles tp ON u.id = tp.user_id
WHERE email IN ('admin@test.com', 'runner@test.com', 'tailor@test.com', 'customer@test.com')
ORDER BY role;
