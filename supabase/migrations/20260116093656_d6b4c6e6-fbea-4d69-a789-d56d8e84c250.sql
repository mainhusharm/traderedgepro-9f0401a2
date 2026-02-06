-- Phase 2-4: Complete Prop Firm Safety System

-- Add missing columns to user_prop_accounts
ALTER TABLE public.user_prop_accounts 
ADD COLUMN IF NOT EXISTS consecutive_winning_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cooling_off_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rule_version_acknowledged TEXT;

-- Add last_loss_at to trade_daily_stats
ALTER TABLE public.trade_daily_stats 
ADD COLUMN IF NOT EXISTS last_loss_at TIMESTAMP WITH TIME ZONE;

-- Create prop firm rule acknowledgments table
CREATE TABLE IF NOT EXISTS public.prop_firm_rule_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  prop_firm TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  previous_rules JSONB,
  new_rules JSONB,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trading psychology logs table
CREATE TABLE IF NOT EXISTS public.trading_psychology_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'cooling_off_started', 'cooling_off_ended', 'recovery_mode_entered', 'recovery_mode_exited'
  trigger_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prop_firm_rule_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_psychology_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for prop_firm_rule_acknowledgments
CREATE POLICY "Users can view own acknowledgments" ON public.prop_firm_rule_acknowledgments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acknowledgments" ON public.prop_firm_rule_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for trading_psychology_logs
CREATE POLICY "Users can view own psychology logs" ON public.trading_psychology_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own psychology logs" ON public.trading_psychology_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rule_acks_user_account ON public.prop_firm_rule_acknowledgments(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_psychology_logs_user ON public.trading_psychology_logs(user_id, created_at DESC);