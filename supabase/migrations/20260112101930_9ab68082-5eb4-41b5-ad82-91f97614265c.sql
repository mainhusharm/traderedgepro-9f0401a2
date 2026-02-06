-- Add columns for real-time signal tracking
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS entry_triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS entry_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_price NUMERIC,
ADD COLUMN IF NOT EXISTS highest_price NUMERIC,
ADD COLUMN IF NOT EXISTS lowest_price NUMERIC,
ADD COLUMN IF NOT EXISTS trailing_stop NUMERIC,
ADD COLUMN IF NOT EXISTS breakeven_triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS partial_tp_triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS signal_status TEXT DEFAULT 'pending' CHECK (signal_status IN ('pending', 'active', 'won', 'lost', 'breakeven', 'expired'));

-- Create index for faster win rate calculations
CREATE INDEX IF NOT EXISTS idx_signals_outcome ON public.signals(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signals_status ON public.signals(signal_status);
CREATE INDEX IF NOT EXISTS idx_signals_entry_triggered ON public.signals(entry_triggered) WHERE entry_triggered = true;

-- Enable realtime for signals table
ALTER TABLE public.signals REPLICA IDENTITY FULL;