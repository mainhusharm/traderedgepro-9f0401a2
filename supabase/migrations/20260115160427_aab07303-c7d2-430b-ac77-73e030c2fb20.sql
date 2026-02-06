-- Add timeframe column to institutional_signals
ALTER TABLE public.institutional_signals 
ADD COLUMN IF NOT EXISTS timeframe TEXT DEFAULT '15m',
ADD COLUMN IF NOT EXISTS htf_timeframe TEXT DEFAULT '1H',
ADD COLUMN IF NOT EXISTS ltf_timeframe TEXT DEFAULT '15m',
ADD COLUMN IF NOT EXISTS risk_reward_ratio NUMERIC,
ADD COLUMN IF NOT EXISTS pips_to_sl NUMERIC,
ADD COLUMN IF NOT EXISTS pips_to_tp1 NUMERIC;