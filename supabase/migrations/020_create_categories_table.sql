-- Create categories table for dynamic service category management
-- This replaces the hardcoded CHECK constraint on services.category

-- Step 1: Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT, -- Emoji or icon identifier
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Insert existing categories from the CHECK constraint
INSERT INTO public.categories (name, slug, icon, description, sort_order, active) VALUES
  ('Trousers & Jeans', 'trousers', '👖', 'Hemming, waist alterations, tapering, and repairs', 1, true),
  ('Shirts & Blouses', 'shirts', '👔', 'Sleeve shortening, taking in, button replacement', 2, true),
  ('Dresses & Skirts', 'dresses', '👗', 'Hemming, taking in, letting out, zip replacement', 3, true),
  ('Suits & Formal', 'suits', '🤵', 'Jacket alterations, trouser hemming, perfect fit', 4, true),
  ('Jackets & Coats', 'coats', '🧥', 'Sleeve shortening, taking in, lining repairs', 5, true),
  ('Other', 'other', '✂️', 'Custom alterations and repairs', 6, true);

-- Step 4: Add category_id column to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Step 5: Migrate existing category data
UPDATE public.services SET category_id = (SELECT id FROM public.categories WHERE slug = 'trousers') WHERE category = 'trousers';
UPDATE public.services SET category_id = (SELECT id FROM public.categories WHERE slug = 'shirts') WHERE category = 'shirts';
UPDATE public.services SET category_id = (SELECT id FROM public.categories WHERE slug = 'dresses') WHERE category = 'dresses';
UPDATE public.services SET category_id = (SELECT id FROM public.categories WHERE slug = 'suits') WHERE category = 'suits';
UPDATE public.services SET category_id = (SELECT id FROM public.categories WHERE slug = 'coats') WHERE category = 'coats';
UPDATE public.services SET category_id = (SELECT id FROM public.categories WHERE slug = 'other') WHERE category = 'other';

-- Step 6: Make category_id NOT NULL after migration
ALTER TABLE public.services
ALTER COLUMN category_id SET NOT NULL;

-- Step 7: Create index
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);

-- Step 8: RLS Policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active categories
CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO public
  USING (active = true);

-- Allow authenticated users to view all categories
CREATE POLICY "categories_select_authenticated"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage categories
CREATE POLICY "categories_admin_all"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Step 9: Comments
COMMENT ON TABLE public.categories IS 'Service categories for organizing alterations';
COMMENT ON COLUMN public.categories.slug IS 'URL-friendly identifier for category';
COMMENT ON COLUMN public.categories.icon IS 'Emoji or icon identifier for display';
COMMENT ON COLUMN public.categories.sort_order IS 'Display order (lower = first)';

-- Note: We keep the old 'category' column for backward compatibility
-- It can be dropped in a future migration after all code is updated
