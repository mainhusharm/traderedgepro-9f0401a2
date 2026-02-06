-- Add content_title and reviewed_at to marketing_compliance_reviews
ALTER TABLE public.marketing_compliance_reviews
  ADD COLUMN IF NOT EXISTS content_title TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create treasure_hunt_entries table
CREATE TABLE IF NOT EXISTS public.treasure_hunt_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  clue_number INTEGER,
  answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.treasure_hunt_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert treasure entries" ON public.treasure_hunt_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own entries" ON public.treasure_hunt_entries FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create user_personal_accounts table
CREATE TABLE IF NOT EXISTS public.user_personal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_name TEXT,
  account_type TEXT,
  broker TEXT,
  account_number TEXT,
  initial_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  trading_locked_until TIMESTAMP WITH TIME ZONE,
  lock_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.user_personal_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own personal accounts" ON public.user_personal_accounts FOR ALL USING (auth.uid() = user_id);

-- Create user_withdrawals table
CREATE TABLE IF NOT EXISTS public.user_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  wallet_address TEXT,
  transaction_id TEXT,
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.user_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own withdrawals" ON public.user_withdrawals FOR ALL USING (auth.uid() = user_id);

-- Create user_deposits table
CREATE TABLE IF NOT EXISTS public.user_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  deposited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.user_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own deposits" ON public.user_deposits FOR ALL USING (auth.uid() = user_id);

-- Add trial columns to mt5_users
ALTER TABLE public.mt5_users
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Add action_type and taken_at to user_signal_actions
ALTER TABLE public.user_signal_actions
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS taken_at TIMESTAMP WITH TIME ZONE;

-- Add activity_details and user_agent to user_activity_log
ALTER TABLE public.user_activity_log
  ADD COLUMN IF NOT EXISTS activity_details JSONB,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;