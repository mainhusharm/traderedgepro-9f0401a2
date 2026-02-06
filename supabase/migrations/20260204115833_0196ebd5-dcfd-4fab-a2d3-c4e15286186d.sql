-- Add category column to white_glove_support_tickets
ALTER TABLE public.white_glove_support_tickets
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Add user_id to user_signal_actions if not exists
ALTER TABLE public.user_signal_actions
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  vip_signals BOOLEAN DEFAULT true,
  milestones BOOLEAN DEFAULT true,
  badges BOOLEAN DEFAULT true,
  sessions BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Create signal_messages table
CREATE TABLE IF NOT EXISTS public.signal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type TEXT DEFAULT 'admin',
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.signal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view signal messages" ON public.signal_messages FOR SELECT USING (true);
CREATE POLICY "Admins can manage signal messages" ON public.signal_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add missing columns to prop_firm_rules
ALTER TABLE public.prop_firm_rules
  ADD COLUMN IF NOT EXISTS consistency_rule_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS consistency_rule_type TEXT,
  ADD COLUMN IF NOT EXISTS max_open_trades INTEGER,
  ADD COLUMN IF NOT EXISTS max_open_lots NUMERIC,
  ADD COLUMN IF NOT EXISTS max_position_size NUMERIC,
  ADD COLUMN IF NOT EXISTS trading_hours_start TEXT,
  ADD COLUMN IF NOT EXISTS trading_hours_end TEXT,
  ADD COLUMN IF NOT EXISTS prohibited_pairs TEXT[],
  ADD COLUMN IF NOT EXISTS hedging_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS grid_trading_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS martingale_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS overnight_fee_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS weekend_fee_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS scaling_plan JSONB;

-- Create treasure_hunt_config table
CREATE TABLE IF NOT EXISTS public.treasure_hunt_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  is_active BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  prize_amount NUMERIC DEFAULT 0,
  clue_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.treasure_hunt_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read treasure hunt config" ON public.treasure_hunt_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage treasure hunt" ON public.treasure_hunt_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create admin_broadcasts table
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'announcement',
  target_plans TEXT[],
  target_user_ids UUID[],
  sent_by UUID,
  total_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage broadcasts" ON public.admin_broadcasts FOR ALL USING (public.has_role(auth.uid(), 'admin'));