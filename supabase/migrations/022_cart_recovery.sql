-- Migration: Abandoned Cart Recovery System
-- Adds saved_carts and cart_reminders tables, plus email_preferences on users

-- ===========================================
-- 1. saved_carts table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.saved_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  pickup_date TEXT,
  pickup_slot TEXT,
  booking_step TEXT NOT NULL DEFAULT 'services',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT saved_carts_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_carts_user ON public.saved_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_carts_last_active ON public.saved_carts(last_active_at);

ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved cart"
  ON public.saved_carts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own saved cart"
  ON public.saved_carts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved cart"
  ON public.saved_carts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved cart"
  ON public.saved_carts FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER update_saved_carts_updated_at
  BEFORE UPDATE ON public.saved_carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 2. cart_reminders table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.cart_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  saved_cart_id UUID REFERENCES public.saved_carts(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('cart_abandonment', 'payment_abandonment')),
  sequence_number INTEGER NOT NULL CHECK (sequence_number IN (1, 2, 3)),
  recovery_token TEXT NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_reminders_reference_check CHECK (
    (order_id IS NOT NULL AND saved_cart_id IS NULL) OR
    (order_id IS NULL AND saved_cart_id IS NOT NULL)
  )
);

-- Use unique indexes instead of a table constraint (COALESCE not allowed in UNIQUE constraints)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_reminders_unique_order
  ON public.cart_reminders(reminder_type, sequence_number, order_id)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_reminders_unique_cart
  ON public.cart_reminders(reminder_type, sequence_number, saved_cart_id)
  WHERE saved_cart_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cart_reminders_user ON public.cart_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_reminders_order ON public.cart_reminders(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_reminders_saved_cart ON public.cart_reminders(saved_cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_reminders_token ON public.cart_reminders(recovery_token);

ALTER TABLE public.cart_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.cart_reminders FOR SELECT
  USING (user_id = auth.uid());

-- Inserts/updates are done via admin client (service role) in the cron job

-- ===========================================
-- 3. Add email_preferences to users
-- ===========================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_preferences JSONB NOT NULL DEFAULT '{"marketing": true, "cart_reminders": true}'::jsonb;
