-- Add capital_floor and status to user_personal_accounts
ALTER TABLE public.user_personal_accounts
  ADD COLUMN IF NOT EXISTS capital_floor NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add columns to push_notification_logs
ALTER TABLE public.push_notification_logs
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS endpoint TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add confidence to institutional_signals
ALTER TABLE public.institutional_signals
  ADD COLUMN IF NOT EXISTS confidence NUMERIC;

-- Add reveal_date to treasure_hunt_config
ALTER TABLE public.treasure_hunt_config
  ADD COLUMN IF NOT EXISTS reveal_date TIMESTAMP WITH TIME ZONE;

-- Add more columns to treasure_hunt_entries
ALTER TABLE public.treasure_hunt_entries
  ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
  ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS winner_position INTEGER,
  ADD COLUMN IF NOT EXISTS announcement_status TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;