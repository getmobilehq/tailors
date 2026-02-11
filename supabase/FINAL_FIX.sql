-- COMBINED FIX FOR ALL RLS ISSUES
-- Run this in your Supabase SQL Editor to fix:
-- 1. Applications table missing or permission issues (Registration failure)
-- 2. Infinite recursion in Users table (Login/Profile blocking)
-- 3. Optimization for Services and Orders admin checks

-- ==============================================================================
-- PART 1: APPLICATIONS TABLE SETUP
-- ==============================================================================

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('runner', 'tailor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Common fields
  bio TEXT,
  experience_years INTEGER,
  availability TEXT, 

  -- Runner-specific fields
  postcode_coverage TEXT[], 
  has_vehicle BOOLEAN,
  license_number TEXT,

  -- Tailor-specific fields
  specializations TEXT[], 
  portfolio_urls TEXT[], 
  certifications TEXT[],

  -- Admin review
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- User created after approval
  user_id UUID REFERENCES public.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(application_type);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop obsolete or conflicting policies
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_anyone" ON public.applications;
DROP POLICY IF EXISTS "applications_select_own" ON public.applications;
DROP POLICY IF EXISTS "applications_select_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_active_insert" ON public.applications;

-- Drop problematic function if exists
DROP FUNCTION IF EXISTS public.is_admin();

-- Create SIMPLIFIED policies for applications (non-recursive)
CREATE POLICY "applications_allow_insert" ON public.applications
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "applications_select_own_email" ON public.applications
  FOR SELECT TO authenticated
  USING (email IN (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "applications_select_if_admin" ON public.applications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "applications_update_if_admin" ON public.applications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "applications_delete_if_admin" ON public.applications
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Ensure grants
GRANT SELECT, INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO authenticated;


-- ==============================================================================
-- PART 2: USERS TABLE RLS FIX (Prevent Infinite Recursion)
-- ==============================================================================

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Authenticated users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- 1. Allow authenticated users to SELECT all user profiles
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated USING (true);

-- 2. Allow users to INSERT their own profile (during signup)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. Allow users to UPDATE their own profile (SAFE version)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ==============================================================================
-- PART 3: OPTIMIZE ADMIN POLICIES FOR OTHER TABLES
-- ==============================================================================

-- Services
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' LIMIT 1)
  );

-- Orders
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' LIMIT 1)
  );
