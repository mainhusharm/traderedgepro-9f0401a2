-- Add more missing columns to strategy_customizations
ALTER TABLE public.strategy_customizations
  ADD COLUMN IF NOT EXISTS min_rr_ratio NUMERIC DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS signal_filters JSONB,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add more missing columns to account_statement_uploads
ALTER TABLE public.account_statement_uploads
  ADD COLUMN IF NOT EXISTS equity_extracted NUMERIC,
  ADD COLUMN IF NOT EXISTS balance_extracted NUMERIC;

-- Add more missing columns to user_prop_accounts
ALTER TABLE public.user_prop_accounts
  ADD COLUMN IF NOT EXISTS allowed_trading_hours JSONB,
  ADD COLUMN IF NOT EXISTS news_buffer_minutes INTEGER DEFAULT 15;

-- Create white_glove_support_tickets table
CREATE TABLE IF NOT EXISTS public.white_glove_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_number TEXT UNIQUE,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.white_glove_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own white glove tickets" ON public.white_glove_support_tickets FOR ALL USING (auth.uid() = user_id);

-- Create white_glove_ticket_messages table
CREATE TABLE IF NOT EXISTS public.white_glove_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.white_glove_support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.white_glove_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view ticket messages" ON public.white_glove_ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.white_glove_support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "Users can insert ticket messages" ON public.white_glove_ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.white_glove_support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

-- Create launch_giveaway_entries table
CREATE TABLE IF NOT EXISTS public.launch_giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  name TEXT,
  referral_code TEXT,
  entries_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.launch_giveaway_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert giveaway entries" ON public.launch_giveaway_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own entries" ON public.launch_giveaway_entries FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);