-- =====================================================
-- PROFESSIONAL TRADE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1. Add trade management columns to institutional_signals
ALTER TABLE public.institutional_signals 
ADD COLUMN IF NOT EXISTS atr_14 NUMERIC,
ADD COLUMN IF NOT EXISTS atr_multiplier NUMERIC DEFAULT 2,
ADD COLUMN IF NOT EXISTS volatility_regime TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS trade_state TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_hold_hours INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS initial_position_size NUMERIC,
ADD COLUMN IF NOT EXISTS remaining_position_pct NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_sl NUMERIC,
ADD COLUMN IF NOT EXISTS original_sl NUMERIC,
ADD COLUMN IF NOT EXISTS tp1_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tp1_closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tp1_pnl NUMERIC,
ADD COLUMN IF NOT EXISTS tp1_r_multiple NUMERIC,
ADD COLUMN IF NOT EXISTS tp2_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tp2_closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tp2_pnl NUMERIC,
ADD COLUMN IF NOT EXISTS tp2_r_multiple NUMERIC,
ADD COLUMN IF NOT EXISTS runner_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS runner_closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS runner_pnl NUMERIC,
ADD COLUMN IF NOT EXISTS trailing_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trailing_atr_multiple NUMERIC DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS highest_price NUMERIC,
ADD COLUMN IF NOT EXISTS lowest_price NUMERIC,
ADD COLUMN IF NOT EXISTS max_adverse_excursion NUMERIC,
ADD COLUMN IF NOT EXISTS max_favorable_excursion NUMERIC,
ADD COLUMN IF NOT EXISTS time_to_tp1_minutes INTEGER,
ADD COLUMN IF NOT EXISTS time_in_trade_minutes INTEGER,
ADD COLUMN IF NOT EXISTS final_pnl NUMERIC,
ADD COLUMN IF NOT EXISTS final_r_multiple NUMERIC,
ADD COLUMN IF NOT EXISTS exit_reason TEXT,
ADD COLUMN IF NOT EXISTS entry_spread NUMERIC,
ADD COLUMN IF NOT EXISTS news_within_30min BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS correlation_warning TEXT,
ADD COLUMN IF NOT EXISTS daily_exposure_pct NUMERIC;

-- 2. Create trade management events log table
CREATE TABLE IF NOT EXISTS public.trade_management_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.institutional_signals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  phase TEXT,
  price_at_event NUMERIC,
  sl_before NUMERIC,
  sl_after NUMERIC,
  position_closed_pct NUMERIC,
  pnl_realized NUMERIC,
  r_multiple NUMERIC,
  atr_at_event NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create trade management configuration table
CREATE TABLE IF NOT EXISTS public.trade_management_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_risk_pct NUMERIC DEFAULT 1,
  max_risk_pct NUMERIC DEFAULT 2,
  volatility_scaling BOOLEAN DEFAULT true,
  tp1_close_pct NUMERIC DEFAULT 33,
  tp2_close_pct NUMERIC DEFAULT 33,
  runner_pct NUMERIC DEFAULT 34,
  trailing_atr_multiple NUMERIC DEFAULT 1.5,
  trailing_start_after_tp INTEGER DEFAULT 2,
  max_hold_hours INTEGER DEFAULT 48,
  close_before_weekend BOOLEAN DEFAULT true,
  weekend_close_hour INTEGER DEFAULT 16,
  avoid_news_minutes INTEGER DEFAULT 30,
  close_before_high_impact BOOLEAN DEFAULT true,
  max_daily_trades INTEGER DEFAULT 5,
  max_correlated_positions INTEGER DEFAULT 2,
  max_currency_exposure_pct NUMERIC DEFAULT 3,
  daily_loss_limit_pct NUMERIC DEFAULT 3,
  pause_after_consecutive_losses INTEGER DEFAULT 3,
  reduce_size_after_losses INTEGER DEFAULT 2,
  reduction_factor NUMERIC DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create currency exposure tracking table
CREATE TABLE IF NOT EXISTS public.currency_exposure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL UNIQUE,
  net_exposure NUMERIC DEFAULT 0,
  position_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 5. Create daily trade statistics table
CREATE TABLE IF NOT EXISTS public.trade_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  breakeven_trades INTEGER DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  total_r_multiple NUMERIC DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  max_drawdown_pct NUMERIC DEFAULT 0,
  bot_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable RLS on new tables
ALTER TABLE public.trade_management_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_management_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_exposure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_daily_stats ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for service role access (edge functions)
CREATE POLICY "Service role full access to trade_management_events" 
ON public.trade_management_events FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to trade_management_config" 
ON public.trade_management_config FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to currency_exposure" 
ON public.currency_exposure FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to trade_daily_stats" 
ON public.trade_daily_stats FOR ALL 
USING (true) WITH CHECK (true);

-- 8. Insert default configuration
INSERT INTO public.trade_management_config (
  base_risk_pct, max_risk_pct, volatility_scaling,
  tp1_close_pct, tp2_close_pct, runner_pct,
  trailing_atr_multiple, trailing_start_after_tp,
  max_hold_hours, close_before_weekend, weekend_close_hour,
  avoid_news_minutes, close_before_high_impact,
  max_daily_trades, max_correlated_positions, max_currency_exposure_pct,
  daily_loss_limit_pct, pause_after_consecutive_losses,
  reduce_size_after_losses, reduction_factor, is_active
) VALUES (
  1, 2, true,
  33, 33, 34,
  1.5, 2,
  48, true, 16,
  30, true,
  5, 2, 3,
  3, 3,
  2, 0.5, true
) ON CONFLICT DO NOTHING;

-- 9. Initialize currency exposures
INSERT INTO public.currency_exposure (currency, net_exposure, position_count)
VALUES 
  ('EUR', 0, 0), ('USD', 0, 0), ('GBP', 0, 0), ('JPY', 0, 0),
  ('CHF', 0, 0), ('AUD', 0, 0), ('NZD', 0, 0), ('CAD', 0, 0),
  ('XAU', 0, 0)
ON CONFLICT (currency) DO NOTHING;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_events_signal_id ON public.trade_management_events(signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_created_at ON public.trade_management_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_institutional_signals_trade_state ON public.institutional_signals(trade_state);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.trade_daily_stats(date DESC);

-- 11. Enable realtime for trade events
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_management_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_daily_stats;