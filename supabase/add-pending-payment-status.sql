-- Add pending_payment status to orders table
-- This allows orders to be created before payment is completed

ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending_payment',
  'booked',
  'pickup_scheduled',
  'collected',
  'in_progress',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled'
));

-- Also need to update the decimal price types (currently INTEGER in pence)
-- Orders table uses DECIMAL for subtotal, delivery_fee, total in pounds
ALTER TABLE public.orders
ALTER COLUMN subtotal TYPE DECIMAL(10, 2);

ALTER TABLE public.orders
ALTER COLUMN delivery_fee TYPE DECIMAL(10, 2);

ALTER TABLE public.orders
ALTER COLUMN total TYPE DECIMAL(10, 2);

-- Order items table uses DECIMAL for price
ALTER TABLE public.order_items
ALTER COLUMN price TYPE DECIMAL(10, 2);

-- Payments table uses DECIMAL for amount
ALTER TABLE public.payments
ALTER COLUMN amount TYPE DECIMAL(10, 2);
