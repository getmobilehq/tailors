-- TailorSpace Useful Database Queries
-- Quick reference for common database operations

-- =============================================
-- USER MANAGEMENT
-- =============================================

-- View all users with their roles
SELECT id, email, full_name, role, active, created_at 
FROM users 
ORDER BY created_at DESC;

-- Change user role (e.g., make someone an admin)
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Deactivate a user
UPDATE users 
SET active = false 
WHERE email = 'user@example.com';

-- Find users by role
SELECT * FROM users WHERE role = 'runner';
SELECT * FROM users WHERE role = 'tailor';
SELECT * FROM users WHERE role = 'admin';

-- =============================================
-- RUNNER MANAGEMENT
-- =============================================

-- Create runner profile for a user
INSERT INTO runner_profiles (user_id, postcode_coverage, max_daily_capacity)
VALUES (
  'user-uuid-here',
  ARRAY['NG1', 'NG2', 'NG3', 'NG5', 'NG7', 'NG9'],
  10
);

-- View all runners with their stats
SELECT 
  u.full_name,
  u.email,
  u.phone,
  rp.rating,
  rp.completed_jobs,
  rp.active,
  rp.postcode_coverage
FROM users u
JOIN runner_profiles rp ON u.id = rp.user_id
WHERE u.role = 'runner';

-- Update runner capacity
UPDATE runner_profiles 
SET max_daily_capacity = 15 
WHERE user_id = 'user-uuid-here';

-- =============================================
-- TAILOR MANAGEMENT
-- =============================================

-- Create tailor profile for a user
INSERT INTO tailor_profiles (user_id, specializations, max_concurrent_orders)
VALUES (
  'user-uuid-here',
  ARRAY['trousers', 'shirts', 'dresses', 'suits', 'coats'],
  20
);

-- View all tailors with their stats
SELECT 
  u.full_name,
  u.email,
  u.phone,
  tp.rating,
  tp.completed_jobs,
  tp.active,
  tp.specializations
FROM users u
JOIN tailor_profiles tp ON u.id = tp.user_id
WHERE u.role = 'tailor';

-- Update tailor specializations
UPDATE tailor_profiles 
SET specializations = ARRAY['trousers', 'shirts', 'suits', 'dresses', 'coats']
WHERE user_id = 'user-uuid-here';

-- =============================================
-- ORDER MANAGEMENT
-- =============================================

-- View all orders with customer and runner info
SELECT 
  o.order_number,
  o.status,
  o.total / 100.0 as total_gbp,
  c.full_name as customer,
  c.email as customer_email,
  r.full_name as runner,
  t.full_name as tailor,
  o.created_at
FROM orders o
JOIN users c ON o.customer_id = c.id
LEFT JOIN users r ON o.runner_id = r.id
LEFT JOIN users t ON o.tailor_id = t.id
ORDER BY o.created_at DESC;

-- Find orders by status
SELECT * FROM orders WHERE status = 'booked';
SELECT * FROM orders WHERE status = 'collected';
SELECT * FROM orders WHERE status = 'in_progress';

-- Assign runner to order
UPDATE orders 
SET runner_id = 'runner-user-uuid', status = 'pickup_scheduled'
WHERE id = 'order-uuid-here' AND status = 'booked';

-- Assign tailor to order
UPDATE orders 
SET tailor_id = 'tailor-user-uuid'
WHERE id = 'order-uuid-here';

-- Update order status
UPDATE orders 
SET status = 'in_progress'
WHERE id = 'order-uuid-here';

-- View order with all items
SELECT 
  o.order_number,
  o.status,
  o.total / 100.0 as total_gbp,
  json_agg(
    json_build_object(
      'service', s.name,
      'description', oi.garment_description,
      'price', oi.price / 100.0
    )
  ) as items
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN services s ON oi.service_id = s.id
WHERE o.id = 'order-uuid-here'
GROUP BY o.id;

-- =============================================
-- SERVICE MANAGEMENT
-- =============================================

-- View all services
SELECT * FROM services WHERE active = true ORDER BY category, sort_order;

-- Add new service
INSERT INTO services (name, description, category, base_price, estimated_days, popular)
VALUES ('New Service', 'Service description', 'trousers', 1500, 5, false);

-- Update service price
UPDATE services 
SET base_price = 1600 
WHERE name = 'Trouser Hemming';

-- Mark service as popular
UPDATE services 
SET popular = true 
WHERE name = 'Dress Hemming';

-- Deactivate service
UPDATE services 
SET active = false 
WHERE name = 'Old Service';

-- View services by category
SELECT * FROM services WHERE category = 'trousers' AND active = true;

-- =============================================
-- ANALYTICS & REPORTING
-- =============================================

-- Total revenue
SELECT SUM(total) / 100.0 as total_revenue_gbp
FROM orders
WHERE status IN ('completed', 'delivered');

-- Revenue by month
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  COUNT(*) as order_count,
  SUM(total) / 100.0 as revenue_gbp
FROM orders
WHERE status IN ('completed', 'delivered')
GROUP BY month
ORDER BY month DESC;

-- Most popular services
SELECT 
  s.name,
  s.category,
  COUNT(oi.id) as times_ordered,
  SUM(oi.price) / 100.0 as total_revenue_gbp
FROM services s
JOIN order_items oi ON s.id = oi.service_id
GROUP BY s.id
ORDER BY times_ordered DESC;

-- Orders by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total) / 100.0 as total_value_gbp
FROM orders
GROUP BY status
ORDER BY count DESC;

-- Runner performance
SELECT 
  u.full_name,
  rp.completed_jobs,
  rp.rating,
  COUNT(o.id) as current_active_jobs
FROM users u
JOIN runner_profiles rp ON u.id = rp.user_id
LEFT JOIN orders o ON u.id = o.runner_id AND o.status IN ('pickup_scheduled', 'collected', 'out_for_delivery')
WHERE u.role = 'runner'
GROUP BY u.id, rp.completed_jobs, rp.rating
ORDER BY rp.completed_jobs DESC;

-- Tailor performance
SELECT 
  u.full_name,
  tp.completed_jobs,
  tp.rating,
  COUNT(o.id) as current_active_jobs
FROM users u
JOIN tailor_profiles tp ON u.id = tp.user_id
LEFT JOIN orders o ON u.id = o.tailor_id AND o.status IN ('collected', 'in_progress')
WHERE u.role = 'tailor'
GROUP BY u.id, tp.completed_jobs, tp.rating
ORDER BY tp.completed_jobs DESC;

-- Customer lifetime value
SELECT 
  c.full_name,
  c.email,
  COUNT(o.id) as total_orders,
  SUM(o.total) / 100.0 as lifetime_value_gbp,
  MAX(o.created_at) as last_order_date
FROM users c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.role = 'customer'
GROUP BY c.id
ORDER BY lifetime_value_gbp DESC NULLS LAST;

-- Orders without runners (need assignment)
SELECT 
  o.order_number,
  o.pickup_date,
  o.customer_address->>'postcode' as postcode,
  c.full_name as customer
FROM orders o
JOIN users c ON o.customer_id = c.id
WHERE o.runner_id IS NULL 
  AND o.status = 'booked'
ORDER BY o.pickup_date;

-- Orders without tailors (need assignment)
SELECT 
  o.order_number,
  o.status,
  c.full_name as customer,
  r.full_name as runner
FROM orders o
JOIN users c ON o.customer_id = c.id
LEFT JOIN users r ON o.runner_id = r.id
WHERE o.tailor_id IS NULL 
  AND o.status IN ('collected', 'in_progress')
ORDER BY o.collected_at;

-- =============================================
-- PAYMENT TRACKING
-- =============================================

-- View all payments
SELECT 
  o.order_number,
  p.amount / 100.0 as amount_gbp,
  p.status,
  p.stripe_session_id,
  p.created_at
FROM payments p
JOIN orders o ON p.order_id = o.id
ORDER BY p.created_at DESC;

-- Find failed payments
SELECT * FROM payments WHERE status = 'failed';

-- Successful payments total
SELECT 
  COUNT(*) as successful_payments,
  SUM(amount) / 100.0 as total_gbp
FROM payments
WHERE status = 'succeeded';

-- =============================================
-- MAINTENANCE & CLEANUP
-- =============================================

-- Delete test orders (BE CAREFUL!)
-- DELETE FROM orders WHERE order_number LIKE 'TS%TEST%';

-- Reset order sequence (if needed)
-- ALTER SEQUENCE order_number_seq RESTART WITH 1;

-- Find duplicate orders (shouldn't exist)
SELECT order_number, COUNT(*) 
FROM orders 
GROUP BY order_number 
HAVING COUNT(*) > 1;

-- Find orders with no items (data issue)
SELECT o.*
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL;

-- =============================================
-- BACKUP QUERIES
-- =============================================

-- Export all users (for backup)
-- COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' WITH CSV HEADER;

-- Export all orders (for backup)
-- COPY (SELECT * FROM orders) TO '/tmp/orders_backup.csv' WITH CSV HEADER;

-- Export all services (for backup)
-- COPY (SELECT * FROM services) TO '/tmp/services_backup.csv' WITH CSV HEADER;
