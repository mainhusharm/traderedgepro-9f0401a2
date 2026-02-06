-- Create economic_calendar table for news event tracking
CREATE TABLE IF NOT EXISTS public.economic_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_value TEXT,
  forecast_value TEXT,
  previous_value TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade_management_events table for logging trade lifecycle events
CREATE TABLE IF NOT EXISTS public.trade_management_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.institutional_signals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  phase TEXT NOT NULL,
  price_at_event DECIMAL,
  sl_before DECIMAL,
  sl_after DECIMAL,
  position_closed_pct DECIMAL,
  pnl_realized DECIMAL,
  r_multiple DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade_daily_stats table for daily performance tracking
CREATE TABLE IF NOT EXISTS public.trade_daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  breakeven_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL DEFAULT 0,
  total_r_multiple DECIMAL DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  bot_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_events_signal ON public.trade_management_events(signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_created ON public.trade_management_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_daily_stats_date ON public.trade_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_economic_calendar_time ON public.economic_calendar(event_time);
CREATE INDEX IF NOT EXISTS idx_economic_calendar_currency ON public.economic_calendar(currency);

-- Enable RLS
ALTER TABLE public.trade_management_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_calendar ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read on trade_management_events"
ON public.trade_management_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read on trade_daily_stats"
ON public.trade_daily_stats
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read on economic_calendar"
ON public.economic_calendar
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to insert for edge functions
CREATE POLICY "Allow anon insert on trade_management_events"
ON public.trade_management_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon all on trade_daily_stats"
ON public.trade_daily_stats
FOR ALL
TO anon
USING (true);

CREATE POLICY "Allow anon insert on economic_calendar"
ON public.economic_calendar
FOR INSERT
TO anon
WITH CHECK (true);