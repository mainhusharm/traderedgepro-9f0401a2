-- Activity tracking table for dispute evidence
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
ON public.user_activity_log
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
ON public.user_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity_log(created_at DESC);

-- Add terms acceptance columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_ip_address TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_email TEXT,
ADD COLUMN IF NOT EXISTS dispute_warning_shown BOOLEAN DEFAULT false;

-- Add activity tracking columns to memberships
ALTER TABLE public.memberships
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signals_received_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Enable realtime for activity log
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_log;