-- Create user_personal_accounts table
CREATE TABLE public.user_personal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL,
  account_label TEXT,
  account_number TEXT,
  currency TEXT DEFAULT 'USD',
  starting_balance DECIMAL NOT NULL DEFAULT 0,
  current_balance DECIMAL NOT NULL DEFAULT 0,
  highest_balance DECIMAL DEFAULT 0,
  leverage INTEGER DEFAULT 100,
  account_type TEXT DEFAULT 'standard',
  is_primary BOOLEAN DEFAULT false,
  risk_per_trade_pct DECIMAL DEFAULT 1,
  daily_loss_limit_pct DECIMAL DEFAULT 5,
  monthly_income_goal DECIMAL,
  capital_floor DECIMAL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_withdrawals table
CREATE TABLE public.user_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_personal_accounts(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_type TEXT DEFAULT 'profit_take',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_deposits table
CREATE TABLE public.user_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_personal_accounts(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create personal_capital_daily_stats table
CREATE TABLE public.personal_capital_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.user_personal_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opening_balance DECIMAL,
  closing_balance DECIMAL,
  realized_pnl DECIMAL DEFAULT 0,
  trades_taken INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, date)
);

-- Add trading_mode to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_dashboard_mode TEXT DEFAULT 'prop_firm';

-- Enable RLS on all new tables
ALTER TABLE public.user_personal_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_capital_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_personal_accounts
CREATE POLICY "Users can view their own personal accounts"
ON public.user_personal_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personal accounts"
ON public.user_personal_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal accounts"
ON public.user_personal_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal accounts"
ON public.user_personal_accounts FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.user_withdrawals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
ON public.user_withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawals"
ON public.user_withdrawals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own withdrawals"
ON public.user_withdrawals FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_deposits
CREATE POLICY "Users can view their own deposits"
ON public.user_deposits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits"
ON public.user_deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deposits"
ON public.user_deposits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deposits"
ON public.user_deposits FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for personal_capital_daily_stats
CREATE POLICY "Users can view their own daily stats"
ON public.personal_capital_daily_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily stats"
ON public.personal_capital_daily_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats"
ON public.personal_capital_daily_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_personal_accounts_updated_at
BEFORE UPDATE ON public.user_personal_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for personal accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_personal_accounts;