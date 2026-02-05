-- Add missing columns to user_prop_accounts
ALTER TABLE public.user_prop_accounts 
  ADD COLUMN IF NOT EXISTS account_size NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_traded INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_trading_days INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_trading_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS payout_split NUMERIC DEFAULT 80,
  ADD COLUMN IF NOT EXISTS payout_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_drawdown_used_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_drawdown_used_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_profit_target NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lock_after_target BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS personal_daily_loss_limit_pct NUMERIC DEFAULT 5;

-- Add missing columns to trade_consistency_alerts
ALTER TABLE public.trade_consistency_alerts
  ADD COLUMN IF NOT EXISTS threshold_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS was_blocked BOOLEAN DEFAULT false;

-- Add missing columns to user_trade_allocations
ALTER TABLE public.user_trade_allocations
  ADD COLUMN IF NOT EXISTS take_profit_1 NUMERIC,
  ADD COLUMN IF NOT EXISTS take_profit_2 NUMERIC,
  ADD COLUMN IF NOT EXISTS take_profit_3 NUMERIC;

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.user_signal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_signal_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own signal actions" ON public.user_signal_actions
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.trade_post_mortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trade_id UUID,
  reflection TEXT,
  lessons_learned TEXT,
  emotion_before TEXT,
  emotion_after TEXT,
  would_take_again BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trade_post_mortems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own post mortems" ON public.trade_post_mortems
  FOR ALL USING (auth.uid() = user_id);