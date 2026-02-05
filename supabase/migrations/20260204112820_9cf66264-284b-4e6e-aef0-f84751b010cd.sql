-- =============================================
-- BATCH 2: ADMIN, BOT, SUPPORT TABLES
-- =============================================

-- Bot status table
CREATE TABLE public.bot_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_type text NOT NULL CHECK (bot_type IN ('forex', 'crypto', 'futures')),
  is_running boolean DEFAULT false,
  started_at timestamp with time zone,
  stopped_at timestamp with time zone,
  last_signal_at timestamp with time zone,
  signals_sent_today integer DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(bot_type)
);

ALTER TABLE public.bot_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot status" ON public.bot_status FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view bot status" ON public.bot_status FOR SELECT USING (true);

INSERT INTO public.bot_status (bot_type, is_running) VALUES ('forex', false), ('crypto', false), ('futures', false);

CREATE TRIGGER update_bot_status_updated_at BEFORE UPDATE ON public.bot_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  description text NOT NULL,
  assigned_to uuid,
  resolution text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin activity log
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trade journal
CREATE TABLE public.trade_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  lot_size NUMERIC DEFAULT 0.01,
  pnl NUMERIC DEFAULT 0,
  pnl_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_date TIMESTAMP WITH TIME ZONE,
  setup_type TEXT,
  notes TEXT,
  emotions TEXT,
  screenshot_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades" ON public.trade_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trades" ON public.trade_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trades" ON public.trade_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trades" ON public.trade_journal FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trade_journal_updated_at BEFORE UPDATE ON public.trade_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Affiliates
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC DEFAULT 20,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  pending_earnings NUMERIC DEFAULT 0,
  paid_earnings NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  payout_method TEXT,
  payout_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own affiliate" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own affiliate" ON public.affiliates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage affiliates" ON public.affiliates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Affiliate referrals
CREATE TABLE public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  commission_amount NUMERIC DEFAULT 0,
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own referrals" ON public.affiliate_referrals FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage referrals" ON public.affiliate_referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Coupons
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_purchase NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_private BOOLEAN DEFAULT false,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can validate any active coupon by code" ON public.coupons FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

INSERT INTO public.coupons (code, discount_type, discount_value, is_active, is_private) VALUES ('ADMIN_ZERO_PAY', 'percentage', 100, true, true);

-- Referral credits
CREATE TABLE public.referral_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  credit_amount numeric NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'available',
  used_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '1 year'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits" ON public.referral_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can use their own credits" ON public.referral_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all credits" ON public.referral_credits FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Referral clicks
CREATE TABLE public.referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id UUID,
  visitor_ip TEXT,
  visitor_fingerprint TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  converted BOOLEAN DEFAULT false,
  converted_user_id UUID,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_fingerprint ON public.referral_clicks(visitor_fingerprint);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts for tracking" ON public.referral_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their referral clicks" ON public.referral_clicks FOR SELECT USING (referrer_user_id = auth.uid());
CREATE POLICY "Allow conversion updates" ON public.referral_clicks FOR UPDATE USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_clicks;