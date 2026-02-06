-- Batch 9: Add remaining missing tables and columns

-- Add challenge_deadline to user_prop_accounts
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS challenge_deadline TIMESTAMPTZ;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS profit_target NUMERIC DEFAULT 0;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS reported_equity NUMERIC DEFAULT 0;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS last_equity_update_at TIMESTAMPTZ;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS require_checklist_before_trading BOOLEAN DEFAULT false;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS consistency_rule_pct NUMERIC DEFAULT 0;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'challenge';
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS highest_equity NUMERIC DEFAULT 0;
ALTER TABLE public.user_prop_accounts ADD COLUMN IF NOT EXISTS current_profit NUMERIC DEFAULT 0;

-- daily_equity_confirmations table
CREATE TABLE IF NOT EXISTS public.daily_equity_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  reported_equity NUMERIC NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_equity_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own confirmations" ON public.daily_equity_confirmations
  FOR ALL USING (auth.uid() = user_id);

-- daily_trading_checklists table
CREATE TABLE IF NOT EXISTS public.daily_trading_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  checklist_items JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_trading_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklists" ON public.daily_trading_checklists
  FOR ALL USING (auth.uid() = user_id);

-- user_daily_stats table
CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  date DATE NOT NULL,
  daily_pnl NUMERIC DEFAULT 0,
  contributed_pct_of_total NUMERIC DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily stats" ON public.user_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage daily stats" ON public.user_daily_stats
  FOR ALL USING (true);

-- account_managers table
CREATE TABLE IF NOT EXISTS public.account_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  specialties TEXT[],
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.account_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view account managers" ON public.account_managers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage account managers" ON public.account_managers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- user_account_manager_assignments table
CREATE TABLE IF NOT EXISTS public.user_account_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_manager_id UUID REFERENCES public.account_managers(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_account_manager_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignment" ON public.user_account_manager_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage assignments" ON public.user_account_manager_assignments
  FOR ALL USING (true);