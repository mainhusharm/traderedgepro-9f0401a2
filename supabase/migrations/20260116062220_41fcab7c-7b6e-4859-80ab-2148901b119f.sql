-- =====================================================
-- PROP FIRM COMPLIANCE SYSTEM - COMPLETE SCHEMA
-- =====================================================

-- 1. User Prop Firm Accounts - Track each user's prop firm challenge/funded account
CREATE TABLE IF NOT EXISTS public.user_prop_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Prop Firm Info
  prop_firm_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'challenge_phase1', -- challenge_phase1, challenge_phase2, funded, evaluation
  account_size NUMERIC NOT NULL,
  account_label TEXT, -- User-friendly label like "FTMO 100k Challenge #1"
  
  -- Current Status
  starting_balance NUMERIC NOT NULL,
  current_equity NUMERIC NOT NULL,
  highest_equity NUMERIC NOT NULL, -- For trailing DD calculation
  realized_pnl NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  
  -- Drawdown Tracking
  daily_starting_equity NUMERIC, -- Reset daily at midnight
  daily_pnl NUMERIC DEFAULT 0,
  daily_drawdown_used_pct NUMERIC DEFAULT 0,
  max_drawdown_used_pct NUMERIC DEFAULT 0,
  trailing_dd_floor NUMERIC, -- For trailing drawdown firms (like MyFundedFX)
  
  -- Drawdown Limits (from prop firm rules)
  daily_dd_limit_pct NUMERIC NOT NULL DEFAULT 5,
  max_dd_limit_pct NUMERIC NOT NULL DEFAULT 10,
  is_trailing_dd BOOLEAN DEFAULT false,
  
  -- Challenge Progress
  profit_target NUMERIC,
  current_profit NUMERIC DEFAULT 0,
  profit_target_pct NUMERIC,
  days_traded INTEGER DEFAULT 0,
  min_trading_days INTEGER DEFAULT 0,
  max_trading_days INTEGER, -- NULL if unlimited
  challenge_start_date DATE,
  challenge_deadline DATE,
  
  -- Rule Flags
  news_trading_allowed BOOLEAN DEFAULT true,
  weekend_holding_allowed BOOLEAN DEFAULT true,
  max_lot_size NUMERIC,
  max_risk_per_trade_pct NUMERIC DEFAULT 2,
  consistency_rule_pct NUMERIC, -- Max % of profit in single day (NULL if not applicable)
  martingale_allowed BOOLEAN DEFAULT false,
  hedging_allowed BOOLEAN DEFAULT true,
  ea_trading_allowed BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, passed, failed, payout_eligible, payout_requested, payout_received
  failure_reason TEXT,
  passed_at TIMESTAMPTZ,
  payout_requested_at TIMESTAMPTZ,
  payout_amount NUMERIC,
  
  -- Scaling Plan
  scaling_week INTEGER DEFAULT 1, -- For gradual risk increase
  current_risk_multiplier NUMERIC DEFAULT 0.5, -- Start at 50% of normal risk
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User Daily Stats - Track daily performance for consistency rules
CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Equity tracking
  starting_equity NUMERIC NOT NULL,
  ending_equity NUMERIC,
  highest_equity NUMERIC,
  lowest_equity NUMERIC,
  
  -- P&L
  daily_pnl NUMERIC DEFAULT 0,
  daily_pnl_pct NUMERIC DEFAULT 0,
  trades_taken INTEGER DEFAULT 0,
  trades_won INTEGER DEFAULT 0,
  trades_lost INTEGER DEFAULT 0,
  trades_breakeven INTEGER DEFAULT 0,
  
  -- Drawdown tracking
  max_daily_dd_reached_pct NUMERIC DEFAULT 0,
  max_dd_at_close_pct NUMERIC DEFAULT 0,
  
  -- Consistency metrics
  is_profitable BOOLEAN DEFAULT false,
  contributed_pct_of_total NUMERIC DEFAULT 0, -- For consistency rule
  is_trading_day BOOLEAN DEFAULT false,
  
  -- Risk metrics
  total_risk_taken NUMERIC DEFAULT 0,
  largest_position_size NUMERIC DEFAULT 0,
  avg_r_multiple NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, account_id, date)
);

-- 3. User Trade Allocations - Track which signals each user took and their personalized risk
CREATE TABLE IF NOT EXISTS public.user_trade_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.institutional_signals(id) ON DELETE CASCADE,
  
  -- Personalized position sizing
  lot_size NUMERIC NOT NULL,
  risk_amount NUMERIC NOT NULL,
  risk_pct NUMERIC NOT NULL,
  
  -- Entry details
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profit_1 NUMERIC NOT NULL,
  take_profit_2 NUMERIC,
  take_profit_3 NUMERIC,
  
  -- Pre-trade validation
  validation_passed BOOLEAN DEFAULT true,
  validation_warnings TEXT[],
  daily_dd_at_entry NUMERIC,
  max_dd_at_entry NUMERIC,
  
  -- Trade status
  status TEXT DEFAULT 'pending', -- pending, active, partial, closed
  
  -- P&L tracking
  realized_pnl NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  r_multiple NUMERIC,
  
  -- Partial closes
  tp1_closed BOOLEAN DEFAULT false,
  tp1_pnl NUMERIC,
  tp2_closed BOOLEAN DEFAULT false,
  tp2_pnl NUMERIC,
  tp3_closed BOOLEAN DEFAULT false,
  tp3_pnl NUMERIC,
  
  -- Exit
  exit_price NUMERIC,
  exit_reason TEXT,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Risk Validation Log - Track all pre-trade validations
CREATE TABLE IF NOT EXISTS public.risk_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.institutional_signals(id) ON DELETE SET NULL,
  
  -- Validation result
  allowed BOOLEAN NOT NULL,
  blockers TEXT[],
  warnings TEXT[],
  
  -- Context at validation time
  daily_dd_used_pct NUMERIC,
  max_dd_used_pct NUMERIC,
  daily_dd_remaining NUMERIC,
  max_dd_remaining NUMERIC,
  
  -- Requested vs allowed
  requested_lot_size NUMERIC,
  max_allowed_lot_size NUMERIC,
  adjusted_lot_size NUMERIC,
  
  -- News check
  news_blocked BOOLEAN DEFAULT false,
  news_event_name TEXT,
  news_event_time TIMESTAMPTZ,
  
  -- Consistency check
  consistency_blocked BOOLEAN DEFAULT false,
  current_day_contribution_pct NUMERIC,
  
  -- Correlation check
  correlation_blocked BOOLEAN DEFAULT false,
  correlated_positions TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Drawdown Alerts - Track warnings sent to users
CREATE TABLE IF NOT EXISTS public.drawdown_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL, -- daily_dd_50, daily_dd_70, daily_dd_90, max_dd_50, max_dd_70, max_dd_90, breach
  threshold_pct NUMERIC NOT NULL,
  current_dd_pct NUMERIC NOT NULL,
  equity_at_alert NUMERIC NOT NULL,
  
  -- Actions taken
  signals_paused BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Payout Requests - Track payout eligibility and requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_prop_accounts(id) ON DELETE CASCADE,
  
  -- Eligibility check snapshot
  profit_target_met BOOLEAN NOT NULL,
  min_days_met BOOLEAN NOT NULL,
  consistency_passed BOOLEAN,
  no_dd_breach BOOLEAN NOT NULL,
  all_trades_closed BOOLEAN NOT NULL,
  
  -- Request details
  eligible BOOLEAN NOT NULL,
  requested_amount NUMERIC,
  prop_firm_share_pct NUMERIC, -- Their profit split
  user_share_amount NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, paid, rejected
  rejection_reason TEXT,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_prop_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trade_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_validation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawdown_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can view own prop accounts" ON public.user_prop_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prop accounts" ON public.user_prop_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prop accounts" ON public.user_prop_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily stats" ON public.user_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trade allocations" ON public.user_trade_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own validation logs" ON public.risk_validation_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own drawdown alerts" ON public.drawdown_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payout requests" ON public.payout_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert payout requests" ON public.payout_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role policies for edge functions
CREATE POLICY "Service role full access to prop accounts" ON public.user_prop_accounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to daily stats" ON public.user_daily_stats
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to trade allocations" ON public.user_trade_allocations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to validation logs" ON public.risk_validation_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to drawdown alerts" ON public.drawdown_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to payout requests" ON public.payout_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
CREATE INDEX idx_user_prop_accounts_user_id ON public.user_prop_accounts(user_id);
CREATE INDEX idx_user_prop_accounts_status ON public.user_prop_accounts(status);
CREATE INDEX idx_user_daily_stats_account_date ON public.user_daily_stats(account_id, date);
CREATE INDEX idx_user_trade_allocations_signal ON public.user_trade_allocations(signal_id);
CREATE INDEX idx_user_trade_allocations_account ON public.user_trade_allocations(account_id);
CREATE INDEX idx_risk_validation_log_account ON public.risk_validation_log(account_id);
CREATE INDEX idx_drawdown_alerts_account ON public.drawdown_alerts(account_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_prop_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drawdown_alerts;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_prop_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_user_prop_accounts_timestamp
  BEFORE UPDATE ON public.user_prop_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_prop_account_timestamp();

CREATE TRIGGER update_user_daily_stats_timestamp
  BEFORE UPDATE ON public.user_daily_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_prop_account_timestamp();

CREATE TRIGGER update_user_trade_allocations_timestamp
  BEFORE UPDATE ON public.user_trade_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_prop_account_timestamp();

CREATE TRIGGER update_payout_requests_timestamp
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_prop_account_timestamp();

-- Function to calculate and update drawdown on equity change
CREATE OR REPLACE FUNCTION public.calculate_drawdown()
RETURNS TRIGGER AS $$
DECLARE
  daily_dd NUMERIC;
  max_dd NUMERIC;
  trailing_dd NUMERIC;
BEGIN
  -- Calculate daily drawdown
  IF NEW.daily_starting_equity IS NOT NULL AND NEW.daily_starting_equity > 0 THEN
    daily_dd := ((NEW.daily_starting_equity - NEW.current_equity) / NEW.daily_starting_equity) * 100;
    NEW.daily_drawdown_used_pct := GREATEST(daily_dd, 0);
  END IF;
  
  -- Calculate max drawdown (from highest equity for trailing, from starting for static)
  IF NEW.is_trailing_dd THEN
    -- Trailing DD: measure from highest equity
    IF NEW.highest_equity > 0 THEN
      trailing_dd := ((NEW.highest_equity - NEW.current_equity) / NEW.starting_balance) * 100;
      NEW.max_drawdown_used_pct := GREATEST(trailing_dd, 0);
    END IF;
    -- Update trailing floor
    IF NEW.current_equity > NEW.highest_equity THEN
      NEW.highest_equity := NEW.current_equity;
      NEW.trailing_dd_floor := NEW.current_equity * (1 - NEW.max_dd_limit_pct / 100);
    END IF;
  ELSE
    -- Static DD: measure from starting balance
    IF NEW.starting_balance > 0 THEN
      max_dd := ((NEW.starting_balance - NEW.current_equity) / NEW.starting_balance) * 100;
      NEW.max_drawdown_used_pct := GREATEST(max_dd, 0);
    END IF;
  END IF;
  
  -- Update current profit
  NEW.current_profit := NEW.current_equity - NEW.starting_balance;
  
  -- Check for failure conditions
  IF NEW.daily_drawdown_used_pct >= NEW.daily_dd_limit_pct THEN
    NEW.status := 'failed';
    NEW.failure_reason := 'Daily drawdown limit breached (' || ROUND(NEW.daily_drawdown_used_pct, 2) || '%)';
  ELSIF NEW.max_drawdown_used_pct >= NEW.max_dd_limit_pct THEN
    NEW.status := 'failed';
    NEW.failure_reason := 'Max drawdown limit breached (' || ROUND(NEW.max_drawdown_used_pct, 2) || '%)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_drawdown_on_equity_change
  BEFORE UPDATE OF current_equity ON public.user_prop_accounts
  FOR EACH ROW EXECUTE FUNCTION public.calculate_drawdown();

-- Function to check and update pass status
CREATE OR REPLACE FUNCTION public.check_challenge_pass()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check active accounts
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;
  
  -- Check if passed
  IF NEW.current_profit >= NEW.profit_target 
     AND NEW.days_traded >= NEW.min_trading_days
     AND NEW.daily_drawdown_used_pct < NEW.daily_dd_limit_pct
     AND NEW.max_drawdown_used_pct < NEW.max_dd_limit_pct THEN
    
    -- Check consistency rule if applicable
    IF NEW.consistency_rule_pct IS NULL THEN
      NEW.status := 'passed';
      NEW.passed_at := now();
    END IF;
    -- Note: Consistency rule check needs to be done at app level with daily stats
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_pass_on_update
  BEFORE UPDATE ON public.user_prop_accounts
  FOR EACH ROW EXECUTE FUNCTION public.check_challenge_pass();