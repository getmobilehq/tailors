-- Add moderation fields to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Update RLS policy for publicly viewable reviews to only show visible ones
DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.reviews;
CREATE POLICY "Reviews are publicly viewable"
  ON public.reviews FOR SELECT
  USING (is_visible = true);

-- Add admin policy to view all reviews (including hidden)
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin policy to update reviews (for moderation)
CREATE POLICY "Admins can moderate reviews"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
