-- TailorSpace Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'runner', 'tailor', 'admin')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('trousers', 'shirts', 'dresses', 'suits', 'coats', 'other')),
  base_price INTEGER NOT NULL, -- in pence
  estimated_days INTEGER NOT NULL DEFAULT 7,
  image_url TEXT,
  popular BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  runner_id UUID REFERENCES public.users(id),
  tailor_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN (
    'booked',
    'pickup_scheduled',
    'collected',
    'in_progress',
    'ready',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled'
  )),
  subtotal INTEGER NOT NULL, -- in pence
  delivery_fee INTEGER NOT NULL DEFAULT 700, -- £7.00 in pence
  total INTEGER NOT NULL, -- in pence
  customer_address JSONB NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  pickup_date DATE,
  pickup_slot TEXT,
  measurements JSONB,
  runner_notes TEXT,
  tailor_notes TEXT,
  admin_notes TEXT,
  collected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  garment_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL, -- in pence
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  tailor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in pence
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runner Profiles table
CREATE TABLE IF NOT EXISTS public.runner_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  postcode_coverage TEXT[] NOT NULL DEFAULT '{}',
  max_daily_capacity INTEGER NOT NULL DEFAULT 10,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tailor Profiles table
CREATE TABLE IF NOT EXISTS public.tailor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  max_concurrent_orders INTEGER NOT NULL DEFAULT 20,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  recipient_id UUID NOT NULL REFERENCES public.users(id),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  runner_id UUID REFERENCES public.users(id),
  tailor_id UUID REFERENCES public.users(id),
  runner_rating INTEGER CHECK (runner_rating BETWEEN 1 AND 5),
  tailor_rating INTEGER CHECK (tailor_rating BETWEEN 1 AND 5),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_runner ON public.orders(runner_id);
CREATE INDEX IF NOT EXISTS idx_orders_tailor ON public.orders(tailor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_order ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id, read);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'TS' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_runner_profiles_updated_at ON public.runner_profiles;
CREATE TRIGGER update_runner_profiles_updated_at BEFORE UPDATE ON public.runner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tailor_profiles_updated_at ON public.tailor_profiles;
CREATE TRIGGER update_tailor_profiles_updated_at BEFORE UPDATE ON public.tailor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number generation trigger
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Services policies (public read access)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Orders policies
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Runners can view assigned orders" ON public.orders;
CREATE POLICY "Runners can view assigned orders" ON public.orders
  FOR SELECT USING (
    runner_id = auth.uid() OR 
    runner_id IS NULL AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'runner'
    )
  );

DROP POLICY IF EXISTS "Runners can update assigned orders" ON public.orders;
CREATE POLICY "Runners can update assigned orders" ON public.orders
  FOR UPDATE USING (runner_id = auth.uid());

DROP POLICY IF EXISTS "Tailors can view assigned orders" ON public.orders;
CREATE POLICY "Tailors can view assigned orders" ON public.orders
  FOR SELECT USING (tailor_id = auth.uid());

DROP POLICY IF EXISTS "Tailors can update assigned orders" ON public.orders;
CREATE POLICY "Tailors can update assigned orders" ON public.orders
  FOR UPDATE USING (tailor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Order Items policies
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND (
        customer_id = auth.uid() OR 
        runner_id = auth.uid() OR 
        tailor_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Customers can create order items" ON public.order_items;
CREATE POLICY "Customers can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tailors can update order items" ON public.order_items;
CREATE POLICY "Tailors can update order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND tailor_id = auth.uid()
    )
  );

-- Payments policies
DROP POLICY IF EXISTS "Users can view payments for their orders" ON public.payments;
CREATE POLICY "Users can view payments for their orders" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND customer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can create payments" ON public.payments;
CREATE POLICY "System can create payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Runner Profiles policies
DROP POLICY IF EXISTS "Runners can view their own profile" ON public.runner_profiles;
CREATE POLICY "Runners can view their own profile" ON public.runner_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage runner profiles" ON public.runner_profiles;
CREATE POLICY "Admins can manage runner profiles" ON public.runner_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tailor Profiles policies
DROP POLICY IF EXISTS "Tailors can view their own profile" ON public.tailor_profiles;
CREATE POLICY "Tailors can view their own profile" ON public.tailor_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage tailor profiles" ON public.tailor_profiles;
CREATE POLICY "Admins can manage tailor profiles" ON public.tailor_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Reviews policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers can create reviews for their orders" ON public.reviews;
CREATE POLICY "Customers can create reviews for their orders" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- =============================================
-- SEED DATA - SERVICES
-- =============================================

INSERT INTO public.services (name, description, category, base_price, estimated_days, popular, sort_order) VALUES
  -- Trousers
  ('Trouser Hemming', 'Professional hemming to your perfect length', 'trousers', 1400, 5, true, 1),
  ('Trouser Waist Adjustment', 'Take in or let out waist up to 2 inches', 'trousers', 1800, 5, true, 2),
  ('Trouser Tapering', 'Slim fit adjustment from knee down', 'trousers', 2200, 7, false, 3),
  ('Zip Replacement (Trousers)', 'Replace broken or damaged zip', 'trousers', 1600, 5, false, 4),
  
  -- Shirts
  ('Shirt Sleeve Shortening', 'Adjust sleeve length to perfect fit', 'shirts', 1400, 5, true, 5),
  ('Shirt Darting', 'Add darts for better fit through body', 'shirts', 1800, 5, false, 6),
  ('Button Replacement', 'Replace missing or damaged buttons', 'shirts', 800, 3, false, 7),
  ('Shirt Collar Repair', 'Fix or replace worn collar', 'shirts', 1400, 5, false, 8),
  
  -- Dresses
  ('Dress Hemming', 'Adjust dress length to your height', 'dresses', 1800, 7, true, 9),
  ('Dress Taking In', 'Adjust fit through waist and bust', 'dresses', 2500, 7, true, 10),
  ('Zip Replacement (Dress)', 'Replace dress zip', 'dresses', 1800, 5, false, 11),
  ('Dress Strap Adjustment', 'Shorten or replace dress straps', 'dresses', 1200, 5, false, 12),
  
  -- Suits
  ('Suit Jacket Sleeve Shortening', 'Professional sleeve adjustment', 'suits', 1800, 5, true, 13),
  ('Suit Jacket Taking In', 'Adjust fit through body', 'suits', 2800, 7, false, 14),
  ('Suit Trouser Package', 'Hem and waist adjustment', 'suits', 2800, 5, true, 15),
  ('Full Suit Alteration', 'Complete suit fitting service', 'suits', 5500, 10, false, 16),
  
  -- Coats
  ('Coat Sleeve Shortening', 'Adjust coat sleeve length', 'coats', 2200, 7, false, 17),
  ('Coat Hemming', 'Shorten coat length', 'coats', 2500, 7, false, 18),
  ('Coat Lining Repair', 'Fix or replace coat lining', 'coats', 3500, 10, false, 19),
  ('Coat Zip Replacement', 'Replace coat zip', 'coats', 2200, 7, false, 20),
  
  -- Other
  ('Basic Repair', 'Small repairs and fixes', 'other', 1200, 5, false, 21),
  ('Patch Application', 'Apply decorative or repair patches', 'other', 1500, 5, false, 22),
  ('Custom Alteration', 'Bespoke alteration service - price quoted', 'other', 0, 14, false, 23);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'TailorSpace database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create your first admin user via the signup page';
  RAISE NOTICE '2. Manually update their role to "admin" in the users table';
  RAISE NOTICE '3. Create test runner and tailor users as needed';
END $$;
