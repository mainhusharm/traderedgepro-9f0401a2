-- Add AI coach warning counter and blocked status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_coach_warnings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_coach_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_coach_blocked_at timestamp with time zone;