-- Fix OTP verifications table security
-- Remove overly permissive public policies and restrict access

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create OTP verification" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can read OTP for verification" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can update OTP verification" ON public.otp_verifications;

-- Create a rate limiting table for OTP requests
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    request_type TEXT NOT NULL, -- 'send' or 'verify'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_email_type_created 
ON public.otp_rate_limits (email, request_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_ip_type_created 
ON public.otp_rate_limits (ip_address, request_type, created_at DESC);

-- Enable RLS on rate limits table
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access to rate limits table - only service role can access
-- (No policies = no access from anon/authenticated roles)

-- Clean up old OTPs periodically (can be run via cron)
-- This is a helper function to clean expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete expired OTPs
    DELETE FROM public.otp_verifications 
    WHERE expires_at < now() - interval '1 hour';
    
    -- Delete old rate limit records (older than 24 hours)
    DELETE FROM public.otp_rate_limits 
    WHERE created_at < now() - interval '24 hours';
END;
$$;