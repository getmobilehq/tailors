-- Photo Storage Setup
-- Run this in Supabase SQL Editor

-- Create storage bucket for order item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-photos', 'order-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order-photos bucket

-- Allow anyone (including anonymous users) to upload photos
CREATE POLICY "Anyone can upload photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'order-photos'
);

-- Allow authenticated users to view all photos
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-photos');

-- Allow anyone to delete recent uploads (within 1 hour)
CREATE POLICY "Anyone can delete recent uploads"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'order-photos'
  AND created_at > NOW() - INTERVAL '1 hour'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Photo storage bucket created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket: order-photos (public)';
  RAISE NOTICE 'Anyone (including guests) can upload photos during booking';
  RAISE NOTICE 'Photos are publicly accessible';
  RAISE NOTICE 'Anyone can delete uploads within 1 hour';
END $$;
