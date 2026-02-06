-- Add trading lock fields to user_personal_accounts table
ALTER TABLE public.user_personal_accounts
ADD COLUMN trading_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN lock_reason TEXT;