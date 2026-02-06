-- Create coupons table for discount codes
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_private BOOLEAN DEFAULT false, -- Private coupons not shown publicly
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Only admins can manage coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can validate coupons (read only for validation)
CREATE POLICY "Anyone can validate coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND is_private = false);

-- Insert the private admin coupon (100% off)
INSERT INTO public.coupons (code, discount_type, discount_value, is_active, is_private)
VALUES ('ADMIN_ZERO_PAY', 'percentage', 100, true, true);

-- Add lot_size column to signals table if not exists
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS lot_size NUMERIC DEFAULT 0.01;

-- Create function to update dashboard_data when signal outcome changes
CREATE OR REPLACE FUNCTION public.update_dashboard_on_signal_outcome()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_pnl NUMERIC;
  v_is_win BOOLEAN;
  v_total_trades INTEGER;
  v_winning_trades INTEGER;
  v_losing_trades INTEGER;
  v_total_pnl NUMERIC;
  v_win_rate NUMERIC;
  v_avg_win NUMERIC;
  v_avg_loss NUMERIC;
  v_profit_factor NUMERIC;
  v_current_equity NUMERIC;
  v_initial_balance NUMERIC;
  v_max_drawdown NUMERIC;
  v_current_drawdown NUMERIC;
BEGIN
  -- Only process when outcome changes from pending to something else
  IF NEW.outcome = 'pending' OR (OLD IS NOT NULL AND OLD.outcome = NEW.outcome) THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_pnl := COALESCE(NEW.pnl, 0);
  v_is_win := NEW.outcome = 'target_hit' OR v_pnl > 0;

  -- Get current dashboard data
  SELECT 
    COALESCE(total_trades, 0),
    COALESCE(winning_trades, 0),
    COALESCE(losing_trades, 0),
    COALESCE(total_pnl, 0),
    COALESCE(current_equity, account_size),
    COALESCE(initial_balance, account_size),
    COALESCE(max_drawdown, 0)
  INTO v_total_trades, v_winning_trades, v_losing_trades, v_total_pnl, v_current_equity, v_initial_balance, v_max_drawdown
  FROM public.dashboard_data
  WHERE user_id = v_user_id;

  -- If no dashboard exists, use questionnaire data
  IF v_initial_balance IS NULL THEN
    SELECT account_size INTO v_initial_balance FROM public.questionnaires WHERE user_id = v_user_id;
    v_initial_balance := COALESCE(v_initial_balance, 10000);
    v_current_equity := v_initial_balance;
  END IF;

  -- Update counters
  v_total_trades := v_total_trades + 1;
  v_total_pnl := v_total_pnl + v_pnl;
  v_current_equity := v_current_equity + v_pnl;

  IF v_is_win THEN
    v_winning_trades := v_winning_trades + 1;
  ELSE
    v_losing_trades := v_losing_trades + 1;
  END IF;

  -- Calculate win rate
  IF v_total_trades > 0 THEN
    v_win_rate := (v_winning_trades::NUMERIC / v_total_trades::NUMERIC) * 100;
  ELSE
    v_win_rate := 0;
  END IF;

  -- Calculate average win and loss
  SELECT 
    COALESCE(AVG(pnl) FILTER (WHERE pnl > 0), 0),
    COALESCE(ABS(AVG(pnl) FILTER (WHERE pnl < 0)), 0)
  INTO v_avg_win, v_avg_loss
  FROM public.signals
  WHERE user_id = v_user_id AND outcome != 'pending';

  -- Calculate profit factor
  IF v_avg_loss > 0 THEN
    v_profit_factor := v_avg_win / v_avg_loss;
  ELSE
    v_profit_factor := v_avg_win;
  END IF;

  -- Calculate drawdown
  IF v_initial_balance > 0 AND v_current_equity < v_initial_balance THEN
    v_current_drawdown := ((v_initial_balance - v_current_equity) / v_initial_balance) * 100;
    IF v_current_drawdown > v_max_drawdown THEN
      v_max_drawdown := v_current_drawdown;
    END IF;
  ELSE
    v_current_drawdown := 0;
  END IF;

  -- Upsert dashboard data
  INSERT INTO public.dashboard_data (
    user_id, total_trades, winning_trades, losing_trades, total_pnl,
    win_rate, average_win, average_loss, profit_factor,
    current_equity, initial_balance, max_drawdown, current_drawdown,
    daily_pnl, updated_at
  ) VALUES (
    v_user_id, v_total_trades, v_winning_trades, v_losing_trades, v_total_pnl,
    v_win_rate, v_avg_win, v_avg_loss, v_profit_factor,
    v_current_equity, v_initial_balance, v_max_drawdown, v_current_drawdown,
    v_pnl, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    total_pnl = EXCLUDED.total_pnl,
    win_rate = EXCLUDED.win_rate,
    average_win = EXCLUDED.average_win,
    average_loss = EXCLUDED.average_loss,
    profit_factor = EXCLUDED.profit_factor,
    current_equity = EXCLUDED.current_equity,
    max_drawdown = EXCLUDED.max_drawdown,
    current_drawdown = EXCLUDED.current_drawdown,
    daily_pnl = EXCLUDED.daily_pnl,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for signal outcome updates
DROP TRIGGER IF EXISTS trigger_update_dashboard_on_signal ON public.signals;
CREATE TRIGGER trigger_update_dashboard_on_signal
  AFTER INSERT OR UPDATE OF outcome, pnl ON public.signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dashboard_on_signal_outcome();