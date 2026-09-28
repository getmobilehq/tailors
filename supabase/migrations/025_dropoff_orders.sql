-- Drop-off orders: customers bring items to a fixed location instead of a
-- runner collecting them, and may pay in person when they hand the items over.
--
-- No new order statuses: a drop-off order reuses 'collected' for "we have the
-- items" and 'completed' for "customer took them home", so every existing
-- status map, timeline and filter keeps working. The UI relabels those two for
-- drop-off orders. Drop-off orders never enter the runner queue, so they skip
-- pickup_scheduled / out_for_delivery / delivered entirely.

-- =============================================
-- ORDERS
-- =============================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfilment_type TEXT NOT NULL DEFAULT 'pickup'
    CHECK (fulfilment_type IN ('pickup', 'dropoff')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'online'
    CHECK (payment_method IN ('online', 'in_person')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_method TEXT CHECK (paid_method IN ('cash', 'card', 'stripe')),
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS dropoff_date DATE,
  ADD COLUMN IF NOT EXISTS dropped_off_at TIMESTAMPTZ;

-- Drop-off customers never give us an address
ALTER TABLE public.orders
  ALTER COLUMN customer_address DROP NOT NULL;

-- Existing orders were all runner pickups paid by card up front. Anything that
-- never got past checkout, or was cancelled, stays unpaid.
UPDATE public.orders
SET payment_status = 'paid',
    paid_method = 'stripe',
    paid_at = COALESCE(paid_at, created_at)
WHERE payment_status = 'unpaid'
  AND status NOT IN ('pending_payment', 'cancelled');

-- Runner queue filters on this, and admin lists group by it
CREATE INDEX IF NOT EXISTS idx_orders_fulfilment_type ON public.orders(fulfilment_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- =============================================
-- PAYMENTS
-- =============================================

-- Cash and card-machine payments have no Stripe session, so the ledger has to
-- accept rows without one.
ALTER TABLE public.payments
  ALTER COLUMN stripe_session_id DROP NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'stripe'
    CHECK (method IN ('cash', 'card', 'stripe')),
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.users(id);

-- =============================================
-- DROP-OFF LOCATION
-- =============================================

-- Shown at checkout and in the confirmation email. Edit in admin settings.
INSERT INTO public.site_settings (key, value, description, category)
VALUES (
  'dropoff_location',
  '{"enabled": false, "name": "TailorSpace", "line1": "", "line2": "", "city": "Nottingham", "postcode": "", "hours": "Mon-Sat, 9:00am - 6:00pm", "instructions": "Ask for the TailorSpace counter when you arrive."}'::jsonb,
  'Where drop-off customers bring their items. Fill in the address then set enabled to true to offer drop-off at checkout.',
  'business'
)
ON CONFLICT (key) DO NOTHING;
