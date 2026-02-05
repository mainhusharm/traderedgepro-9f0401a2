-- Recreate user_trade_allocations properly
CREATE TABLE IF NOT EXISTS public.user_trade_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_id UUID,
  account_id UUID,
  lot_size NUMERIC DEFAULT 0,
  entry_price NUMERIC DEFAULT 0,
  stop_loss NUMERIC DEFAULT 0,
  take_profit NUMERIC DEFAULT 0,
  risk_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  pnl NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  r_multiple NUMERIC DEFAULT 0,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_trade_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own allocations" ON public.user_trade_allocations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all allocations" ON public.user_trade_allocations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add missing columns to user_prop_accounts
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS avg_lot_size NUMERIC DEFAULT 0;

-- trade_consistency_alerts table
CREATE TABLE IF NOT EXISTS public.trade_consistency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  current_value NUMERIC,
  expected_value NUMERIC,
  message TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trade_consistency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts" ON public.trade_consistency_alerts
  FOR ALL USING (auth.uid() = user_id);

-- trading_mistake_patterns table
CREATE TABLE IF NOT EXISTS public.trading_mistake_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  mistake_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  total_pnl_impact NUMERIC DEFAULT 0,
  avg_pnl_when_mistake NUMERIC DEFAULT 0,
  win_rate_with_mistake NUMERIC DEFAULT 0,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trading_mistake_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns" ON public.trading_mistake_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage patterns" ON public.trading_mistake_patterns
  FOR ALL USING (true);