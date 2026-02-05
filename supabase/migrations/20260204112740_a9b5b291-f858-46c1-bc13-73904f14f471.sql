-- =============================================
-- CORE ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.membership_status AS ENUM ('active', 'inactive', 'pending', 'cancelled', 'expired');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.signal_type AS ENUM ('BUY', 'SELL');
CREATE TYPE public.signal_outcome AS ENUM ('pending', 'target_hit', 'stop_loss_hit', 'cancelled');

-- =============================================
-- CORE FUNCTION: update_updated_at_column
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- USER ROLES TABLE (MUST be created first for has_role function)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  country TEXT DEFAULT 'United States',
  avatar_url TEXT,
  agree_to_terms BOOLEAN DEFAULT false,
  agree_to_marketing BOOLEAN DEFAULT false,
  portal_type TEXT DEFAULT 'main',
  email_preferences jsonb DEFAULT '{"marketing": true, "signals": true, "renewal_reminders": true, "order_updates": true, "weekly_summary": true}'::jsonb,
  referral_code TEXT UNIQUE,
  referred_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- MEMBERSHIPS TABLE
-- =============================================
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  plan_price DECIMAL(10,2) NOT NULL,
  billing_period TEXT DEFAULT 'monthly',
  status membership_status DEFAULT 'pending',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships" ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memberships" ON public.memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all memberships" ON public.memberships FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update memberships" ON public.memberships FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT NOT NULL,
  payment_provider TEXT,
  transaction_id TEXT,
  stripe_payment_intent_id TEXT,
  paypal_order_id TEXT,
  status payment_status DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  affiliate_code TEXT,
  affiliate_commission NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payments_user_id ON public.payments(user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- =============================================
-- QUESTIONNAIRES TABLE
-- =============================================
CREATE TABLE public.questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  prop_firm TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_size DECIMAL(12,2) NOT NULL,
  account_number TEXT,
  risk_percentage DECIMAL(5,2) DEFAULT 1.0,
  risk_reward_ratio TEXT DEFAULT '1:2',
  trading_experience TEXT DEFAULT 'beginner',
  trades_per_day TEXT DEFAULT '1-2',
  trading_session TEXT DEFAULT 'any',
  crypto_assets TEXT[],
  forex_assets TEXT[],
  custom_forex_pairs TEXT[],
  challenge_step TEXT DEFAULT 'phase1',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own questionnaire" ON public.questionnaires FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own questionnaire" ON public.questionnaires FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own questionnaire" ON public.questionnaires FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all questionnaires" ON public.questionnaires FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_questionnaires_user_id ON public.questionnaires(user_id);

CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON public.questionnaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DASHBOARD DATA TABLE
-- =============================================
CREATE TABLE public.dashboard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE SET NULL,
  prop_firm TEXT,
  account_type TEXT,
  account_size DECIMAL(12,2) DEFAULT 0,
  current_equity DECIMAL(12,2) DEFAULT 0,
  initial_balance DECIMAL(12,2) DEFAULT 0,
  total_pnl DECIMAL(12,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  average_win DECIMAL(12,2) DEFAULT 0,
  average_loss DECIMAL(12,2) DEFAULT 0,
  profit_factor DECIMAL(5,2) DEFAULT 0,
  max_drawdown DECIMAL(12,2) DEFAULT 0,
  current_drawdown DECIMAL(12,2) DEFAULT 0,
  daily_pnl DECIMAL(12,2) DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dashboard" ON public.dashboard_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own dashboard" ON public.dashboard_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dashboard" ON public.dashboard_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all dashboards" ON public.dashboard_data FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_dashboard_data_user_id ON public.dashboard_data(user_id);

CREATE TRIGGER update_dashboard_data_updated_at BEFORE UPDATE ON public.dashboard_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SIGNALS TABLE
-- =============================================
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_data_id UUID REFERENCES public.dashboard_data(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  signal_type signal_type NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  confidence_score INTEGER DEFAULT 75,
  ai_reasoning TEXT,
  milestone TEXT DEFAULT 'M1',
  taken_by_user BOOLEAN DEFAULT false,
  taken_at TIMESTAMPTZ,
  outcome signal_outcome DEFAULT 'pending',
  pnl DECIMAL(12,2) DEFAULT 0,
  risk_amount DECIMAL(12,2) DEFAULT 0,
  lot_size NUMERIC DEFAULT 0.01,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public signals" ON public.signals FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own signals" ON public.signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own signals" ON public.signals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all signals" ON public.signals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_signals_user_id ON public.signals(user_id);
CREATE INDEX idx_signals_created_at ON public.signals(created_at DESC);
CREATE INDEX idx_signals_symbol ON public.signals(symbol);

ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;

-- =============================================
-- SITE SETTINGS TABLE
-- =============================================
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'We are currently performing scheduled maintenance. Please check back soon.',
  maintenance_started_at TIMESTAMPTZ,
  maintenance_started_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (id) VALUES ('main');

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- FUNCTION: handle_new_user
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: generate_referral_code
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'REF-' || UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();