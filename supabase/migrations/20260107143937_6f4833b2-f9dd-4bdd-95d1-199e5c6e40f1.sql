-- Add email preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_preferences jsonb DEFAULT '{"marketing": true, "signals": true, "renewal_reminders": true, "order_updates": true, "weekly_summary": true}'::jsonb;

-- Create referral credits table
CREATE TABLE public.referral_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  credit_amount numeric NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'available',
  used_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '1 year'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_credits
CREATE POLICY "Users can view their own credits" 
ON public.referral_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can use their own credits" 
ON public.referral_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can manage all credits
CREATE POLICY "Admins can manage all credits" 
ON public.referral_credits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add referral_code to profiles for sharing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Add referred_by to track who referred a user
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'REF-' || UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral code
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.profiles;
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create function to grant referral credit when a referred user makes first payment
CREATE OR REPLACE FUNCTION public.grant_referral_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  referrer_id uuid;
  referred_profile_id uuid;
BEGIN
  -- Only process completed payments
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get the referred_by user from profiles
    SELECT referred_by, user_id INTO referrer_id, referred_profile_id
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- If user was referred and this is their first completed payment
    IF referrer_id IS NOT NULL THEN
      -- Check if credit was already granted for this referral
      IF NOT EXISTS (
        SELECT 1 FROM public.referral_credits 
        WHERE user_id = referrer_id AND referred_user_id = NEW.user_id
      ) THEN
        -- Grant $20 credit to referrer
        INSERT INTO public.referral_credits (user_id, referred_user_id, credit_amount)
        VALUES (referrer_id, NEW.user_id, 20);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for granting referral credits
DROP TRIGGER IF EXISTS grant_referral_credit_trigger ON public.payments;
CREATE TRIGGER grant_referral_credit_trigger
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.grant_referral_credit();