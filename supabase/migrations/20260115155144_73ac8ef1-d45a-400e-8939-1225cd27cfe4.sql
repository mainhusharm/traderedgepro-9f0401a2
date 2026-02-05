-- Create institutional_signals table for the Institutional Signal Bot
CREATE TABLE IF NOT EXISTS public.institutional_signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    entry_price NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    take_profit_1 NUMERIC NOT NULL,
    take_profit_2 NUMERIC,
    take_profit_3 NUMERIC,
    confidence NUMERIC NOT NULL DEFAULT 0,
    confluence_score INTEGER NOT NULL DEFAULT 0 CHECK (confluence_score >= 0 AND confluence_score <= 10),
    htf_bias TEXT CHECK (htf_bias IN ('bullish', 'bearish', 'neutral')),
    ltf_entry TEXT CHECK (ltf_entry IN ('buy', 'sell', 'none')),
    analysis_mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (analysis_mode IN ('price_action', 'smc', 'hybrid')),
    price_action_analysis JSONB,
    smc_analysis JSONB,
    ipda_targets JSONB,
    confluence_factors TEXT[] DEFAULT '{}',
    reasoning TEXT,
    kill_zone TEXT,
    session_type TEXT,
    send_to_users BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'target_1_hit', 'target_2_hit', 'target_3_hit', 'sl_hit', 'breakeven', 'manual_close')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_institutional_signals_symbol ON public.institutional_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_institutional_signals_outcome ON public.institutional_signals(outcome);
CREATE INDEX IF NOT EXISTS idx_institutional_signals_created_at ON public.institutional_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_institutional_signals_send_to_users ON public.institutional_signals(send_to_users);

-- Enable Row Level Security
ALTER TABLE public.institutional_signals ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can manage institutional signals"
ON public.institutional_signals
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read signals that are sent to users
CREATE POLICY "Users can view sent signals"
ON public.institutional_signals
FOR SELECT
USING (send_to_users = true);

-- Create trigger to update updated_at
CREATE TRIGGER update_institutional_signals_updated_at
    BEFORE UPDATE ON public.institutional_signals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER TABLE public.institutional_signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.institutional_signals;