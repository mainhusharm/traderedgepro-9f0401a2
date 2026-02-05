-- Create MT5 users table (separate from main users)
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

-- Create MT5 orders table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MT5 support tickets
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

-- Create MT5 ticket messages
CREATE TABLE public.mt5_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.mt5_support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL, -- 'user' or 'admin'
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MT5 payments table
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

-- Enable RLS
ALTER TABLE public.mt5_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_payments ENABLE ROW LEVEL SECURITY;

-- MT5 Users policies
CREATE POLICY "Users can view own mt5 profile" ON public.mt5_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mt5 profile" ON public.mt5_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mt5 profile" ON public.mt5_users FOR UPDATE USING (auth.uid() = user_id);

-- MT5 Orders policies
CREATE POLICY "Users can view own orders" ON public.mt5_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.mt5_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.mt5_orders FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for MT5 tables
CREATE POLICY "Admins can view all mt5_users" ON public.mt5_users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update mt5_users" ON public.mt5_users FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all mt5_orders" ON public.mt5_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage mt5_payments" ON public.mt5_payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Support ticket policies
CREATE POLICY "Users can view own tickets" ON public.mt5_support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.mt5_support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.mt5_support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ticket messages policies
CREATE POLICY "Users can view own ticket messages" ON public.mt5_ticket_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.mt5_support_tickets WHERE id = ticket_id AND user_id = auth.uid()));
CREATE POLICY "Users can send messages" ON public.mt5_ticket_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.mt5_support_tickets WHERE id = ticket_id AND user_id = auth.uid()));
CREATE POLICY "Admins can manage messages" ON public.mt5_ticket_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Payment policies
CREATE POLICY "Users can view own mt5 payments" ON public.mt5_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create mt5 payments" ON public.mt5_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add portal_type to profiles to distinguish users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portal_type TEXT DEFAULT 'main';

-- Update trigger for mt5_orders
CREATE TRIGGER update_mt5_orders_updated_at BEFORE UPDATE ON public.mt5_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for mt5_support_tickets
CREATE TRIGGER update_mt5_tickets_updated_at BEFORE UPDATE ON public.mt5_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();