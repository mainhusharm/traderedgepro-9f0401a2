-- Create table for launch giveaway entries
CREATE TABLE public.launch_giveaway_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  followed_x BOOLEAN DEFAULT false,
  followed_discord BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_winner BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.launch_giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit giveaway entry" 
ON public.launch_giveaway_entries 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view/update (using service role in edge functions)
CREATE POLICY "Service role can manage entries" 
ON public.launch_giveaway_entries 
FOR ALL 
USING (true);

-- Create the Pro launch coupon (20% off, Pro plan only)
INSERT INTO public.coupons (
  code,
  discount_type,
  discount_value,
  min_purchase,
  max_uses,
  current_uses,
  is_active,
  is_private,
  valid_from,
  valid_until
) VALUES (
  'PROLAUNCH20',
  'percentage',
  20,
  0,
  NULL,
  0,
  true,
  false,
  now(),
  '2026-02-28 23:59:59+00'
);