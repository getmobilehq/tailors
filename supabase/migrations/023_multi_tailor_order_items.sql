-- Migration 023: Multi-tailor order support (Phase 1)
--
-- Enables splitting an order's items across multiple tailors by adding
-- item-level tailor assignment. Forward-only — existing order_items keep
-- tailor_id NULL and remain gated by orders.tailor_id via the legacy RLS path.

-- 1. Item-level tailor assignment (nullable — items stay unassigned until
--    the auto-assign engine runs when runner marks the order 'collected').
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS tailor_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Index for "items assigned to me" queries on the tailor dashboard.
CREATE INDEX IF NOT EXISTS idx_order_items_tailor ON public.order_items(tailor_id);

-- 3. SELECT policy — accept ownership via EITHER the new item-level column
--    OR the legacy orders.tailor_id (so existing orders keep working).
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    order_items.tailor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND (
        customer_id = auth.uid() OR
        runner_id = auth.uid() OR
        tailor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. UPDATE policy — same either-path rule. Item-level branch also requires
--    the tailor be active, matching the pattern from migration 011.
DROP POLICY IF EXISTS "Tailors can update order items" ON public.order_items;
CREATE POLICY "Tailors can update order items" ON public.order_items
  FOR UPDATE USING (
    (
      order_items.tailor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'tailor' AND active = true
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND tailor_id = auth.uid()
    )
  );
