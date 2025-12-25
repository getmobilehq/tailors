-- Reviews and Ratings System
-- Run this in Supabase SQL Editor

-- Add indexes to reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_runner_id ON public.reviews(runner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tailor_id ON public.reviews(tailor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view reviews
CREATE POLICY "Reviews are publicly viewable"
  ON public.reviews FOR SELECT
  USING (true);

-- RLS Policy: Customers can create reviews for their completed orders
CREATE POLICY "Customers can create reviews for completed orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = order_id
      AND public.orders.customer_id = auth.uid()
      AND public.orders.status IN ('delivered', 'completed')
    )
  );

-- RLS Policy: Customers can update their own reviews (within 7 days)
CREATE POLICY "Customers can update their reviews"
  ON public.reviews FOR UPDATE
  USING (
    auth.uid() = customer_id
    AND created_at > NOW() - INTERVAL '7 days'
  );

-- RLS Policy: Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin')
  );

-- Function to update runner/tailor ratings after review
CREATE OR REPLACE FUNCTION update_ratings_after_review()
RETURNS TRIGGER AS $$
DECLARE
  v_runner_avg DECIMAL(3,2);
  v_tailor_avg DECIMAL(3,2);
  v_runner_count INTEGER;
  v_tailor_count INTEGER;
BEGIN
  -- Update runner profile if runner was rated
  IF NEW.runner_id IS NOT NULL AND NEW.runner_rating IS NOT NULL THEN
    -- Calculate new average and count
    SELECT AVG(runner_rating), COUNT(*)
    INTO v_runner_avg, v_runner_count
    FROM public.reviews
    WHERE runner_id = NEW.runner_id
    AND runner_rating IS NOT NULL;

    -- Update runner profile
    UPDATE public.runner_profiles
    SET
      rating = v_runner_avg,
      total_reviews = v_runner_count
    WHERE user_id = NEW.runner_id;
  END IF;

  -- Update tailor profile if tailor was rated
  IF NEW.tailor_id IS NOT NULL AND NEW.tailor_rating IS NOT NULL THEN
    -- Calculate new average and count
    SELECT AVG(tailor_rating), COUNT(*)
    INTO v_tailor_avg, v_tailor_count
    FROM public.reviews
    WHERE tailor_id = NEW.tailor_id
    AND tailor_rating IS NOT NULL;

    -- Update tailor profile
    UPDATE public.tailor_profiles
    SET
      rating = v_tailor_avg,
      total_reviews = v_tailor_count
    WHERE user_id = NEW.tailor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_ratings ON public.reviews;
CREATE TRIGGER trigger_update_ratings
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_ratings_after_review();

-- Function to check if order can be reviewed
CREATE OR REPLACE FUNCTION can_review_order(p_order_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_review BOOLEAN;
BEGIN
  SELECT
    o.customer_id = p_user_id
    AND o.status IN ('delivered', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE order_id = p_order_id
    )
  INTO v_can_review
  FROM public.orders o
  WHERE o.id = p_order_id;

  RETURN COALESCE(v_can_review, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get average rating for runner
CREATE OR REPLACE FUNCTION get_runner_rating(p_runner_id UUID)
RETURNS TABLE(
  avg_rating DECIMAL(3,2),
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(runner_rating), 0.0)::DECIMAL(3,2) as avg_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM public.reviews
  WHERE runner_id = p_runner_id
  AND runner_rating IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get average rating for tailor
CREATE OR REPLACE FUNCTION get_tailor_rating(p_tailor_id UUID)
RETURNS TABLE(
  avg_rating DECIMAL(3,2),
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(tailor_rating), 0.0)::DECIMAL(3,2) as avg_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM public.reviews
  WHERE tailor_id = p_tailor_id
  AND tailor_rating IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Reviews and Ratings system created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '- Customers can review completed orders';
  RAISE NOTICE '- Reviews are publicly viewable';
  RAISE NOTICE '- Automatic rating aggregation for runners/tailors';
  RAISE NOTICE '- Customers can edit reviews within 7 days';
  RAISE NOTICE '- Admin moderation of reviews';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to collect customer feedback!';
END $$;
