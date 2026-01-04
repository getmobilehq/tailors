-- CMS System for TailorSpace Marketplace
-- Allows admins to manage page content and site settings

-- =============================================
-- SITE CONTENT TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR(100) NOT NULL,           -- 'home', 'how-it-works', 'pricing', 'apply'
  section VARCHAR(100) NOT NULL,         -- 'hero', 'features', 'faq', 'cta'
  content_key VARCHAR(100) NOT NULL,     -- 'title', 'description', 'image_url', 'button_text'
  content_value TEXT NOT NULL,           -- The actual content
  content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'html', 'url', 'json'
  display_order INTEGER DEFAULT 0,       -- For ordering multiple items in a section
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id),
  UNIQUE(page, section, content_key, display_order)
);

-- Add indexes for faster queries
CREATE INDEX idx_site_content_page ON public.site_content(page);
CREATE INDEX idx_site_content_section ON public.site_content(page, section);
CREATE INDEX idx_site_content_active ON public.site_content(is_active);

-- =============================================
-- SITE SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general', -- 'general', 'business', 'features', 'pricing'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site content and settings (for public pages)
CREATE POLICY "Anyone can view active site content"
  ON public.site_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage site content"
  ON public.site_content FOR ALL
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

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
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

-- =============================================
-- SEED DATA - Current Homepage Content
-- =============================================

-- Homepage Hero
INSERT INTO public.site_content (page, section, content_key, content_value, content_type) VALUES
  ('home', 'hero', 'title', 'Expert Clothing Alterations in Nottingham', 'text'),
  ('home', 'hero', 'subtitle', 'Professional tailoring delivered to your door. Book online, we collect, alter, and return your garments.', 'text'),
  ('home', 'hero', 'cta_primary_text', 'Book Alteration', 'text'),
  ('home', 'hero', 'cta_primary_url', '/book', 'url'),
  ('home', 'hero', 'cta_secondary_text', 'How It Works', 'text'),
  ('home', 'hero', 'cta_secondary_url', '/how-it-works', 'url');

-- Homepage Features
INSERT INTO public.site_content (page, section, content_key, content_value, content_type, display_order) VALUES
  ('home', 'features', 'title', 'Why Choose TailorSpace?', 'text', 0),
  ('home', 'features', 'feature_1_icon', 'Truck', 'text', 1),
  ('home', 'features', 'feature_1_title', 'Door-to-Door Service', 'text', 1),
  ('home', 'features', 'feature_1_description', 'We collect and deliver your garments at a time that suits you', 'text', 1),
  ('home', 'features', 'feature_2_icon', 'Users', 'text', 2),
  ('home', 'features', 'feature_2_title', 'Expert Tailors', 'text', 2),
  ('home', 'features', 'feature_2_description', 'Professional alterations by experienced tailors', 'text', 2),
  ('home', 'features', 'feature_3_icon', 'Clock', 'text', 3),
  ('home', 'features', 'feature_3_title', 'Fast Turnaround', 'text', 3),
  ('home', 'features', 'feature_3_description', 'Most alterations completed within 5-7 working days', 'text', 3);

-- How It Works page
INSERT INTO public.site_content (page, section, content_key, content_value, content_type, display_order) VALUES
  ('how-it-works', 'hero', 'title', 'How It Works', 'text', 0),
  ('how-it-works', 'hero', 'subtitle', 'Getting your garments altered has never been easier', 'text', 0),
  ('how-it-works', 'steps', 'step_1_title', 'Book Online', 'text', 1),
  ('how-it-works', 'steps', 'step_1_description', 'Choose your alteration service and schedule a collection time', 'text', 1),
  ('how-it-works', 'steps', 'step_2_title', 'We Collect', 'text', 2),
  ('how-it-works', 'steps', 'step_2_description', 'Our expert runner visits your home to collect items and take measurements', 'text', 2),
  ('how-it-works', 'steps', 'step_3_title', 'We Alter', 'text', 3),
  ('how-it-works', 'steps', 'step_3_description', 'Professional tailors work on your garments with care and precision', 'text', 3),
  ('how-it-works', 'steps', 'step_4_title', 'We Deliver', 'text', 4),
  ('how-it-works', 'steps', 'step_4_description', 'Your perfectly altered items are delivered back to your door', 'text', 4);

-- Pricing page
INSERT INTO public.site_content (page, section, content_key, content_value, content_type) VALUES
  ('pricing', 'hero', 'title', 'Simple, Transparent Pricing', 'text'),
  ('pricing', 'hero', 'subtitle', 'Quality alterations at fair prices. No hidden fees.', 'text'),
  ('pricing', 'info', 'delivery_fee_note', 'All prices include expert craftsmanship. A £7 delivery fee applies per order.', 'text');

-- Apply pages
INSERT INTO public.site_content (page, section, content_key, content_value, content_type) VALUES
  ('apply-runner', 'hero', 'title', 'Become a Runner', 'text'),
  ('apply-runner', 'hero', 'subtitle', 'Join our team of trusted professionals collecting and delivering garments across Nottingham', 'text'),
  ('apply-runner', 'benefits', 'benefit_1', 'Flexible working hours', 'text'),
  ('apply-runner', 'benefits', 'benefit_2', 'Competitive pay per delivery', 'text'),
  ('apply-runner', 'benefits', 'benefit_3', 'Work in your local area', 'text'),
  ('apply-tailor', 'hero', 'title', 'Become a Tailor', 'text'),
  ('apply-tailor', 'hero', 'subtitle', 'Join our network of expert tailors and grow your alteration business', 'text'),
  ('apply-tailor', 'benefits', 'benefit_1', 'Steady stream of work', 'text'),
  ('apply-tailor', 'benefits', 'benefit_2', 'Work from your own workshop', 'text'),
  ('apply-tailor', 'benefits', 'benefit_3', 'Fair pricing for your skills', 'text');

-- =============================================
-- SEED DATA - Site Settings
-- =============================================

INSERT INTO public.site_settings (key, value, description, category) VALUES
  ('delivery_fee', '{"amount": 7, "currency": "GBP"}', 'Delivery fee per order', 'pricing'),
  ('service_area', '{"postcodes": ["NG1", "NG2", "NG3", "NG5", "NG7", "NG9"], "city": "Nottingham"}', 'Service coverage area', 'business'),
  ('business_hours', '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}', 'Operating hours', 'business'),
  ('contact_info', '{"email": "hello@tailorspace.co.uk", "phone": "+44 115 123 4567", "address": "Nottingham, UK"}', 'Contact information', 'business'),
  ('turnaround_time', '{"standard": "5-7 days", "express": "2-3 days"}', 'Standard turnaround times', 'business'),
  ('features_enabled', '{"reviews": true, "applications": true, "notifications": true, "real_time_tracking": true}', 'Feature toggles', 'features'),
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back soon."}', 'Maintenance mode settings', 'general');

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
