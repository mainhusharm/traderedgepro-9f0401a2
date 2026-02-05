-- Add trade_type column to signals table for categorizing trades
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'intraday';

-- Add comment to describe the column
COMMENT ON COLUMN public.signals.trade_type IS 'Type of trade: scalp, intraday, swing, position';

-- Create index for trade_type filtering
CREATE INDEX IF NOT EXISTS idx_signals_trade_type ON public.signals(trade_type);

-- Create a function to auto-delete old signals (older than 7 days, not taken)
CREATE OR REPLACE FUNCTION public.cleanup_old_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.signals
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND (taken_by_user IS NULL OR taken_by_user = false);
END;
$$;

-- Schedule the cleanup to run daily (optional - can be called manually or via cron)
-- This creates a simple way to trigger cleanup
COMMENT ON FUNCTION public.cleanup_old_signals() IS 'Deletes signals older than 7 days that have not been taken by users';