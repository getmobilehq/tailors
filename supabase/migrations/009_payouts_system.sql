-- Payouts System Migration
-- Tracks earnings and payouts for runners and tailors

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in pence
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'cash')),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES public.users(id), -- admin who processed the payout
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX idx_payouts_order_id ON public.payouts(order_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_created_at ON public.payouts(created_at DESC);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own payouts
CREATE POLICY "Users can view own payouts"
  ON public.payouts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
  ON public.payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert/update/delete payouts
CREATE POLICY "Admins can manage payouts"
  ON public.payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_payouts_updated_at();

-- Add earnings tracking columns to runner_profiles and tailor_profiles
ALTER TABLE public.runner_profiles
ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_earnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payouts INTEGER DEFAULT 0;

ALTER TABLE public.tailor_profiles
ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_earnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payouts INTEGER DEFAULT 0;

-- Function to update profile earnings when payout is created
CREATE OR REPLACE FUNCTION update_profile_earnings_on_payout()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.users
  WHERE id = NEW.user_id;

  -- Update appropriate profile based on role
  IF user_role = 'runner' THEN
    UPDATE public.runner_profiles
    SET pending_earnings = pending_earnings + NEW.amount
    WHERE user_id = NEW.user_id;
  ELSIF user_role = 'tailor' THEN
    UPDATE public.tailor_profiles
    SET pending_earnings = pending_earnings + NEW.amount
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payout_created_update_earnings
  AFTER INSERT ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_earnings_on_payout();

-- Function to update profile when payout is marked as paid
CREATE OR REPLACE FUNCTION update_profile_on_payout_paid()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Only trigger when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Get user role
    SELECT role INTO user_role
    FROM public.users
    WHERE id = NEW.user_id;

    -- Update appropriate profile based on role
    IF user_role = 'runner' THEN
      UPDATE public.runner_profiles
      SET
        pending_earnings = pending_earnings - NEW.amount,
        total_payouts = total_payouts + NEW.amount
      WHERE user_id = NEW.user_id;
    ELSIF user_role = 'tailor' THEN
      UPDATE public.tailor_profiles
      SET
        pending_earnings = pending_earnings - NEW.amount,
        total_payouts = total_payouts + NEW.amount
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payout_paid_update_profile
  AFTER UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_on_payout_paid();
