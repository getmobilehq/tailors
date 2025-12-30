-- Applications system for runner and tailor onboarding
-- Run this in Supabase SQL Editor

-- Create applications table
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
  availability TEXT, -- 'full-time', 'part-time', 'weekends'

  -- Runner-specific fields
  postcode_coverage TEXT[], -- Areas they can cover
  has_vehicle BOOLEAN,
  license_number TEXT,

  -- Tailor-specific fields
  specializations TEXT[], -- Types of alterations they specialize in
  portfolio_urls TEXT[], -- Links to their work
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(application_type);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit applications (insert)
CREATE POLICY "Anyone can submit applications"
  ON public.applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow applicants to view their own applications
CREATE POLICY "Applicants can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow admins to view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update applications (approve/reject)
CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.applications IS 'Stores runner and tailor applications pending admin approval';
COMMENT ON COLUMN public.applications.status IS 'Application status: pending, approved, or rejected';
COMMENT ON COLUMN public.applications.application_type IS 'Type of application: runner or tailor';
