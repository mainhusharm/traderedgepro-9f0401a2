-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create membership status enum
CREATE TYPE public.membership_status AS ENUM ('active', 'inactive', 'pending', 'cancelled', 'expired');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create signal type enum
CREATE TYPE public.signal_type AS ENUM ('BUY', 'SELL');

-- Create signal outcome enum
CREATE TYPE public.signal_outcome AS ENUM ('pending', 'target_hit', 'stop_loss_hit', 'cancelled');

-- ============================================
-- PROFILES TABLE
-- ============================================
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
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- MEMBERSHIPS TABLE
-- ============================================
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

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Memberships policies
CREATE POLICY "Users can view their own memberships"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships"
  ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
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
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- QUESTIONNAIRES TABLE
-- ============================================
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

-- Enable RLS
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

-- Questionnaires policies
CREATE POLICY "Users can view their own questionnaire"
  ON public.questionnaires FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaire"
  ON public.questionnaires FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaire"
  ON public.questionnaires FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- DASHBOARD DATA TABLE
-- ============================================
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

-- Enable RLS
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

-- Dashboard data policies
CREATE POLICY "Users can view their own dashboard"
  ON public.dashboard_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard"
  ON public.dashboard_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard"
  ON public.dashboard_data FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- SIGNALS TABLE
-- ============================================
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
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Signals policies (public signals visible to all authenticated users)
CREATE POLICY "Users can view public signals"
  ON public.signals FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own signals"
  ON public.signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signals"
  ON public.signals FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all signals
CREATE POLICY "Admins can manage all signals"
  ON public.signals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaires_updated_at
  BEFORE UPDATE ON public.questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_data_updated_at
  BEFORE UPDATE ON public.dashboard_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNCTION TO CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_questionnaires_user_id ON public.questionnaires(user_id);
CREATE INDEX idx_dashboard_data_user_id ON public.dashboard_data(user_id);
CREATE INDEX idx_signals_user_id ON public.signals(user_id);
CREATE INDEX idx_signals_created_at ON public.signals(created_at DESC);
CREATE INDEX idx_signals_symbol ON public.signals(symbol);