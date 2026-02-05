-- Create storage bucket for MT5 bot files
INSERT INTO storage.buckets (id, name, public)
VALUES ('mt5-bot-files', 'mt5-bot-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for MT5 bot files bucket
CREATE POLICY "Admins can upload MT5 bot files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'mt5-bot-files' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view their own MT5 bot files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mt5-bot-files' AND
  (
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Users can view files in their order folder
    EXISTS (
      SELECT 1 FROM public.mt5_orders
      WHERE user_id = auth.uid()
      AND (storage.foldername(name))[1] = id::text
    )
  )
);

CREATE POLICY "Admins can update MT5 bot files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'mt5-bot-files' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete MT5 bot files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'mt5-bot-files' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);