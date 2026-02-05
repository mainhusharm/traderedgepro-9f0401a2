-- Create storage bucket for social media images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('social-images', 'social-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view social images"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload social images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'social-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete social images"
ON storage.objects FOR DELETE
USING (bucket_id = 'social-images');