-- Create account_managers table for dedicated account manager assignments
CREATE TABLE public.account_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_account_manager_assignments table
CREATE TABLE public.user_account_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_manager_id UUID NOT NULL REFERENCES public.account_managers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id)
);

-- Create strategy_customizations table
CREATE TABLE public.strategy_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  strategy_name TEXT NOT NULL DEFAULT 'My Strategy',
  risk_per_trade DECIMAL(5,2) DEFAULT 1.0,
  max_daily_trades INTEGER DEFAULT 5,
  max_daily_drawdown DECIMAL(5,2) DEFAULT 5.0,
  preferred_sessions TEXT[] DEFAULT ARRAY['London', 'New York'],
  preferred_pairs TEXT[] DEFAULT ARRAY['EURUSD', 'GBPUSD'],
  min_rr_ratio DECIMAL(3,1) DEFAULT 1.5,
  signal_filters JSONB DEFAULT '{"minConfidence": 70, "excludeHighImpact": false}'::jsonb,
  auto_trade_settings JSONB DEFAULT '{"enabled": false}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create white_glove_support_tickets table for priority support
CREATE TABLE public.white_glove_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  assigned_manager_id UUID REFERENCES public.account_managers(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'high' CHECK (priority IN ('high', 'urgent', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_user', 'resolved', 'closed')),
  category TEXT,
  response_sla_hours INTEGER DEFAULT 6,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create white_glove_ticket_messages table
CREATE TABLE public.white_glove_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.white_glove_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'manager', 'system')),
  message TEXT NOT NULL,
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_account_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_glove_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_glove_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_managers (public read for assigned users)
CREATE POLICY "Users can view their assigned manager"
ON public.account_managers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_account_manager_assignments 
    WHERE account_manager_id = id AND user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for user_account_manager_assignments
CREATE POLICY "Users can view their own assignment"
ON public.user_account_manager_assignments FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for strategy_customizations
CREATE POLICY "Users can view their own strategy"
ON public.strategy_customizations FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own strategy"
ON public.strategy_customizations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own strategy"
ON public.strategy_customizations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own strategy"
ON public.strategy_customizations FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for white_glove_support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.white_glove_support_tickets FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create tickets"
ON public.white_glove_support_tickets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
ON public.white_glove_support_tickets FOR UPDATE
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for white_glove_ticket_messages
CREATE POLICY "Users can view messages in their tickets"
ON public.white_glove_ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.white_glove_support_tickets 
    WHERE id = ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can send messages to their tickets"
ON public.white_glove_ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.white_glove_support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'WG-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger for ticket number
CREATE TRIGGER set_ticket_number
BEFORE INSERT ON public.white_glove_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();

-- Add triggers for updated_at
CREATE TRIGGER update_account_managers_updated_at
BEFORE UPDATE ON public.account_managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategy_customizations_updated_at
BEFORE UPDATE ON public.strategy_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_white_glove_tickets_updated_at
BEFORE UPDATE ON public.white_glove_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for support tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.white_glove_support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.white_glove_ticket_messages;