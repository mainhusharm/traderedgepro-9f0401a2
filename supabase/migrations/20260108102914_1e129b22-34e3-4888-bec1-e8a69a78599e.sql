-- Create site_settings table for maintenance mode and other global settings
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'We are currently performing scheduled maintenance. Please check back soon.',
  maintenance_started_at TIMESTAMPTZ,
  maintenance_started_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.site_settings (id) VALUES ('main');

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for maintenance check)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create prop_firms table to store prop firm data
CREATE TABLE public.prop_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  scrape_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prop_firms ENABLE ROW LEVEL SECURITY;

-- Anyone can read prop firms
CREATE POLICY "Anyone can read prop firms"
  ON public.prop_firms
  FOR SELECT
  USING (true);

-- Only admins can manage prop firms
CREATE POLICY "Admins can manage prop firms"
  ON public.prop_firms
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create prop_firm_rules table to store extracted rules
CREATE TABLE public.prop_firm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_firm_id UUID REFERENCES public.prop_firms(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  account_sizes JSONB DEFAULT '[]',
  max_daily_loss_percent NUMERIC,
  max_total_drawdown_percent NUMERIC,
  profit_target_percent NUMERIC,
  min_trading_days INTEGER,
  max_trading_days INTEGER,
  news_trading_allowed BOOLEAN,
  weekend_holding_allowed BOOLEAN,
  ea_allowed BOOLEAN,
  copy_trading_allowed BOOLEAN,
  scaling_plan JSONB,
  additional_rules JSONB DEFAULT '[]',
  raw_content TEXT,
  source_url TEXT,
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prop_firm_rules ENABLE ROW LEVEL SECURITY;

-- Anyone can read rules
CREATE POLICY "Anyone can read prop firm rules"
  ON public.prop_firm_rules
  FOR SELECT
  USING (true);

-- Only admins can manage rules
CREATE POLICY "Admins can manage prop firm rules"
  ON public.prop_firm_rules
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create prop_firm_rule_changes table to track rule changes
CREATE TABLE public.prop_firm_rule_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_firm_id UUID REFERENCES public.prop_firms(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prop_firm_rule_changes ENABLE ROW LEVEL SECURITY;

-- Admins can view changes
CREATE POLICY "Admins can view rule changes"
  ON public.prop_firm_rule_changes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage changes
CREATE POLICY "Admins can manage rule changes"
  ON public.prop_firm_rule_changes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on prop_firms
CREATE TRIGGER update_prop_firms_updated_at
  BEFORE UPDATE ON public.prop_firms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on prop_firm_rules
CREATE TRIGGER update_prop_firm_rules_updated_at
  BEFORE UPDATE ON public.prop_firm_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();