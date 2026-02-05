-- Add image_url column to signals table for chart screenshots / analysis images
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for signal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('signal-images', 'signal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read signal images
CREATE POLICY "Anyone can view signal images"
ON storage.objects FOR SELECT
USING (bucket_id = 'signal-images');

-- Allow admins and agents to upload signal images
CREATE POLICY "Admins and agents can upload signal images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signal-images');

-- Allow admins and agents to update signal images
CREATE POLICY "Admins and agents can update signal images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signal-images');

-- Allow admins and agents to delete signal images
CREATE POLICY "Admins and agents can delete signal images"
ON storage.objects FOR DELETE
USING (bucket_id = 'signal-images');