-- Photo Storage Setup
-- Run this in Supabase SQL Editor

-- Create storage bucket for order item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-photos', 'order-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order-photos bucket

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-photos'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to view all photos
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-photos');

-- Allow users to delete their own photos (within 24 hours)
CREATE POLICY "Users can delete their recent uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Photo storage bucket created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket: order-photos (public)';
  RAISE NOTICE 'Users can upload photos during booking';
  RAISE NOTICE 'Photos are publicly accessible';
  RAISE NOTICE 'Users can delete their uploads within 24 hours';
END $$;
