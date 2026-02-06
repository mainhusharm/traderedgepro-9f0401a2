-- Add missing columns to user_personal_accounts
ALTER TABLE public.user_personal_accounts
  ADD COLUMN IF NOT EXISTS broker_name TEXT,
  ADD COLUMN IF NOT EXISTS account_label TEXT,
  ADD COLUMN IF NOT EXISTS starting_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS highest_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_pnl NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pnl NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS win_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_factor NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_drawdown NUMERIC DEFAULT 0;

-- Add missing columns to user_withdrawals
ALTER TABLE public.user_withdrawals
  ADD COLUMN IF NOT EXISTS withdrawal_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS withdrawal_type TEXT;

-- Add missing column to user_deposits
ALTER TABLE public.user_deposits
  ADD COLUMN IF NOT EXISTS deposit_date TIMESTAMP WITH TIME ZONE;

-- Add activity tracking columns to memberships
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS signals_received_count INTEGER DEFAULT 0;

-- Add rule_version_acknowledged to user_prop_accounts
ALTER TABLE public.user_prop_accounts
  ADD COLUMN IF NOT EXISTS rule_version_acknowledged TEXT;