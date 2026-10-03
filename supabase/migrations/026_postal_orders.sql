-- Postal orders: customers anywhere in the UK post their items in with a
-- courier of their choosing, and we post the finished items back by Royal Mail
-- for a flat fee charged at checkout.
--
-- Like drop-off, postal reuses existing statuses rather than adding new ones:
-- 'collected' means the parcel arrived, 'completed' means it went back in the
-- post. Unlike drop-off, a postal order DOES need customer_address - that is
-- the return address - but never a pickup date or slot, and it is always paid
-- online, because there is no counter to pay at.

-- =============================================
-- ORDERS
-- =============================================

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_fulfilment_type_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_fulfilment_type_check
    CHECK (fulfilment_type IN ('pickup', 'dropoff', 'postal'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS return_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS posted_back_at TIMESTAMPTZ;

-- =============================================
-- SETTINGS
-- =============================================

-- Charged on postal orders in place of the runner delivery fee.
INSERT INTO public.site_settings (key, value, description, category)
VALUES (
  'return_postage_fee',
  '{"amount": 4.99, "currency": "GBP"}'::jsonb,
  'Flat Royal Mail fee charged to post finished items back to postal customers',
  'pricing'
)
ON CONFLICT (key) DO NOTHING;

-- Postal uses the same address as walk-in drop-off, but is switched on
-- separately: you can accept parcels without running a walk-in counter.
UPDATE public.site_settings
SET value = value || '{"postalEnabled": false}'::jsonb
WHERE key = 'dropoff_location'
  AND NOT (value ? 'postalEnabled');
