-- Add missing columns to user_prop_accounts
ALTER TABLE public.user_prop_accounts 
  ADD COLUMN IF NOT EXISTS challenge_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_trailing_dd BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS scaling_week INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_risk_multiplier NUMERIC DEFAULT 1;

-- Add missing columns to user_trade_allocations
ALTER TABLE public.user_trade_allocations
  ADD COLUMN IF NOT EXISTS unrealized_pnl NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id UUID;

-- Add missing columns to user_signal_actions
ALTER TABLE public.user_signal_actions
  ADD COLUMN IF NOT EXISTS outcome TEXT;

-- Create strategy_customizations table
CREATE TABLE IF NOT EXISTS public.strategy_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  strategy_name TEXT,
  risk_per_trade NUMERIC DEFAULT 1,
  max_daily_trades INTEGER DEFAULT 3,
  max_daily_drawdown NUMERIC DEFAULT 5,
  preferred_sessions TEXT[],
  preferred_pairs TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.strategy_customizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own strategy" ON public.strategy_customizations FOR ALL USING (auth.uid() = user_id);

-- Create prop_firm_rule_acknowledgments table
CREATE TABLE IF NOT EXISTS public.prop_firm_rule_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  rule_version TEXT,
  rule_version_acknowledged TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.prop_firm_rule_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own acknowledgments" ON public.prop_firm_rule_acknowledgments FOR ALL USING (auth.uid() = user_id);

-- Create account_statement_uploads table  
CREATE TABLE IF NOT EXISTS public.account_statement_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  file_url TEXT NOT NULL,
  file_type TEXT,
  parsing_status TEXT DEFAULT 'pending',
  parsed_data JSONB,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.account_statement_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own uploads" ON public.account_statement_uploads FOR ALL USING (auth.uid() = user_id);

-- Add specialty column to account_managers (singular version for backward compatibility)
ALTER TABLE public.account_managers
  ADD COLUMN IF NOT EXISTS specialty TEXT;