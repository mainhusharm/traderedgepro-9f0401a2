-- Add enhanced rule columns to prop_firm_rules for hidden rules extraction
ALTER TABLE prop_firm_rules 
ADD COLUMN IF NOT EXISTS consistency_rule_percent numeric,
ADD COLUMN IF NOT EXISTS consistency_rule_type text,
ADD COLUMN IF NOT EXISTS max_position_size numeric,
ADD COLUMN IF NOT EXISTS max_open_trades integer,
ADD COLUMN IF NOT EXISTS max_open_lots numeric,
ADD COLUMN IF NOT EXISTS hedging_allowed boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS martingale_allowed boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS stop_loss_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS min_stop_loss_pips numeric,
ADD COLUMN IF NOT EXISTS max_leverage numeric,
ADD COLUMN IF NOT EXISTS payout_split numeric,
ADD COLUMN IF NOT EXISTS payout_frequency text,
ADD COLUMN IF NOT EXISTS first_payout_delay integer,
ADD COLUMN IF NOT EXISTS prohibited_instruments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prohibited_strategies jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trading_time_restrictions jsonb,
ADD COLUMN IF NOT EXISTS inactivity_rule_days integer,
ADD COLUMN IF NOT EXISTS reset_fee numeric,
ADD COLUMN IF NOT EXISTS refund_policy text;

-- Add missing columns to user_prop_accounts for enhanced tracking
ALTER TABLE user_prop_accounts
ADD COLUMN IF NOT EXISTS max_open_trades integer,
ADD COLUMN IF NOT EXISTS max_open_lots numeric,
ADD COLUMN IF NOT EXISTS stop_loss_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS min_stop_loss_pips numeric,
ADD COLUMN IF NOT EXISTS prohibited_instruments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS first_payout_eligible_at timestamptz,
ADD COLUMN IF NOT EXISTS payout_split numeric,
ADD COLUMN IF NOT EXISTS inactivity_deadline_at timestamptz,
ADD COLUMN IF NOT EXISTS last_trade_at timestamptz;