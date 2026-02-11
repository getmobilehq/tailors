-- Update contact email to support@tailorspace.uk
-- Run this in Supabase SQL Editor

UPDATE public.site_settings
SET value = '{"email": "support@tailorspace.uk", "phone": "+44 757 506 5774", "address": "Nottingham, UK"}'
WHERE key = 'contact_info';
