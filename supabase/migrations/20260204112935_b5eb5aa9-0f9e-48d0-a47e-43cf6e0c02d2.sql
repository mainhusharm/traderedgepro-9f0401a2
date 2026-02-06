-- =============================================
-- BATCH 4: MT5, NOTIFICATIONS, EMAIL TABLES
-- =============================================

-- MT5 users
CREATE TABLE public.mt5_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  license_key TEXT UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'starter',
  is_active BOOLEAN DEFAULT false,
  payment_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.mt5_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mt5 profile" ON public.mt5_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mt5 profile" ON public.mt5_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mt5 profile" ON public.mt5_users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all mt5_users" ON public.mt5_users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update mt5_users" ON public.mt5_users FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- MT5 orders
CREATE TABLE public.mt5_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  bot_name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  admin_status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  assigned_to UUID,
  trading_strategy JSONB,
  risk_management JSONB,
  technical_specs JSONB,
  performance_targets JSONB,
  additional_requirements JSONB,
  claude_prompt TEXT,
  source_code_url TEXT,
  compiled_bot_url TEXT,
  backtest_report_url TEXT,
  revisions INTEGER DEFAULT 0,
  revision_requests JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mt5_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.mt5_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.mt5_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.mt5_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all mt5_orders" ON public.mt5_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mt5_orders_updated_at BEFORE UPDATE ON public.mt5_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MT5 support tickets
CREATE TABLE public.mt5_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.mt5_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON public.mt5_support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.mt5_support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.mt5_support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mt5_tickets_updated_at BEFORE UPDATE ON public.mt5_support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MT5 ticket messages
CREATE TABLE public.mt5_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.mt5_support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mt5_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ticket messages" ON public.mt5_ticket_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.mt5_support_tickets WHERE id = ticket_id AND user_id = auth.uid()));
CREATE POLICY "Users can send messages" ON public.mt5_ticket_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.mt5_support_tickets WHERE id = ticket_id AND user_id = auth.uid()));
CREATE POLICY "Admins can manage messages" ON public.mt5_ticket_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- MT5 payments
CREATE TABLE public.mt5_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.mt5_orders(id),
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mt5_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mt5 payments" ON public.mt5_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create mt5 payments" ON public.mt5_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage mt5_payments" ON public.mt5_payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- MT5 notifications
CREATE TABLE public.mt5_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.mt5_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mt5_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.mt5_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.mt5_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.mt5_notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow insert for authenticated users" ON public.mt5_notifications FOR INSERT WITH CHECK (true);

-- User notifications
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(user_id, is_read);
CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Email logs
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resend_id TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_resend_id ON public.email_logs(resend_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_to_email ON public.email_logs(to_email);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update email logs" ON public.email_logs FOR UPDATE USING (true);

CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON public.email_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();