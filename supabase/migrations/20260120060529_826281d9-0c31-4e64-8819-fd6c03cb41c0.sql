-- Create master_email_list table
CREATE TABLE public.master_email_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  source TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(email, source_table)
);

-- Indexes for fast lookups
CREATE INDEX idx_master_email_list_email ON public.master_email_list(email);
CREATE INDEX idx_master_email_list_source ON public.master_email_list(source);
CREATE INDEX idx_master_email_list_created_at ON public.master_email_list(created_at DESC);

-- Enable RLS
ALTER TABLE public.master_email_list ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view master email list"
ON public.master_email_list FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create reusable function to add emails
CREATE OR REPLACE FUNCTION public.add_to_master_email_list(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'unknown',
  p_source_table TEXT DEFAULT 'unknown',
  p_source_id TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.master_email_list (email, first_name, last_name, full_name, source, source_table, source_id)
  VALUES (LOWER(TRIM(p_email)), p_first_name, p_last_name, p_full_name, p_source, p_source_table, p_source_id)
  ON CONFLICT (email, source_table) 
  DO UPDATE SET 
    first_name = COALESCE(EXCLUDED.first_name, master_email_list.first_name),
    last_name = COALESCE(EXCLUDED.last_name, master_email_list.last_name),
    full_name = COALESCE(EXCLUDED.full_name, master_email_list.full_name);
END;
$$;

-- Trigger function for launch_giveaway_entries
CREATE OR REPLACE FUNCTION public.trigger_master_email_launch_giveaway()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NULL, 'launch_giveaway', 'launch_giveaway_entries', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_launch_giveaway_insert
AFTER INSERT ON public.launch_giveaway_entries
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_launch_giveaway();

-- Trigger function for treasure_hunt_entries
CREATE OR REPLACE FUNCTION public.trigger_master_email_treasure_hunt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NULL, 'treasure_hunt', 'treasure_hunt_entries', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_treasure_hunt_insert
AFTER INSERT ON public.treasure_hunt_entries
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_treasure_hunt();

-- Trigger function for promo_email_subscribers
CREATE OR REPLACE FUNCTION public.trigger_master_email_promo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NEW.name, 'promo_subscriber', 'promo_email_subscribers', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_promo_subscriber_insert
AFTER INSERT ON public.promo_email_subscribers
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_promo();

-- Trigger function for profiles (linked to auth.users)
CREATE OR REPLACE FUNCTION public.trigger_master_email_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  IF user_email IS NOT NULL THEN
    PERFORM add_to_master_email_list(user_email, NEW.first_name, NEW.last_name, NULL, 'user_signup', 'profiles', NEW.user_id::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_profile();

-- Trigger function for marketing_leads
CREATE OR REPLACE FUNCTION public.trigger_master_email_marketing_leads()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NEW.name, 'marketing_lead', 'marketing_leads', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_marketing_leads_insert
AFTER INSERT ON public.marketing_leads
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_marketing_leads();

-- Trigger function for marketing_leads_v2
CREATE OR REPLACE FUNCTION public.trigger_master_email_marketing_leads_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NEW.contact_name, 'marketing_lead_v2', 'marketing_leads_v2', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_marketing_leads_v2_insert
AFTER INSERT ON public.marketing_leads_v2
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_marketing_leads_v2();

-- Trigger function for customer_queries
CREATE OR REPLACE FUNCTION public.trigger_master_email_customer_queries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL THEN
    PERFORM add_to_master_email_list(NEW.customer_email, NULL, NULL, NEW.customer_name, 'customer_query', 'customer_queries', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_customer_queries_insert
AFTER INSERT ON public.customer_queries
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_customer_queries();

-- Trigger function for marketing_support_tickets
CREATE OR REPLACE FUNCTION public.trigger_master_email_support_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL THEN
    PERFORM add_to_master_email_list(NEW.customer_email, NULL, NULL, NEW.customer_name, 'support_ticket', 'marketing_support_tickets', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_support_tickets_insert
AFTER INSERT ON public.marketing_support_tickets
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_support_tickets();

-- Trigger function for admin_agents
CREATE OR REPLACE FUNCTION public.trigger_master_email_admin_agents()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NEW.name, 'admin_agent', 'admin_agents', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_admin_agents_insert
AFTER INSERT ON public.admin_agents
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_admin_agents();

-- Trigger function for agent_clients
CREATE OR REPLACE FUNCTION public.trigger_master_email_agent_clients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NEW.name, 'agent_client', 'agent_clients', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_agent_clients_insert
AFTER INSERT ON public.agent_clients
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_agent_clients();

-- Trigger function for mt5_users
CREATE OR REPLACE FUNCTION public.trigger_master_email_mt5_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM add_to_master_email_list(NEW.email, NULL, NULL, NULL, 'mt5_user', 'mt5_users', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mt5_users_insert
AFTER INSERT ON public.mt5_users
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_mt5_users();

-- Trigger function for kickstarter_verifications
CREATE OR REPLACE FUNCTION public.trigger_master_email_kickstarter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.user_email, NULL, NULL, NULL, 'kickstarter', 'kickstarter_verifications', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_kickstarter_insert
AFTER INSERT ON public.kickstarter_verifications
FOR EACH ROW EXECUTE FUNCTION public.trigger_master_email_kickstarter();

-- BACKFILL EXISTING DATA

-- From profiles/auth.users
INSERT INTO public.master_email_list (email, first_name, last_name, source, source_table, source_id)
SELECT LOWER(TRIM(u.email)), p.first_name, p.last_name, 'user_signup', 'profiles', p.user_id::TEXT
FROM auth.users u
JOIN public.profiles p ON u.id = p.user_id
WHERE u.email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From launch_giveaway_entries
INSERT INTO public.master_email_list (email, source, source_table, source_id)
SELECT LOWER(TRIM(email)), 'launch_giveaway', 'launch_giveaway_entries', id::TEXT
FROM public.launch_giveaway_entries
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From treasure_hunt_entries
INSERT INTO public.master_email_list (email, source, source_table, source_id)
SELECT LOWER(TRIM(email)), 'treasure_hunt', 'treasure_hunt_entries', id::TEXT
FROM public.treasure_hunt_entries
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From promo_email_subscribers
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(email)), name, 'promo_subscriber', 'promo_email_subscribers', id::TEXT
FROM public.promo_email_subscribers
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From marketing_leads
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(email)), name, 'marketing_lead', 'marketing_leads', id::TEXT
FROM public.marketing_leads
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From marketing_leads_v2
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(email)), contact_name, 'marketing_lead_v2', 'marketing_leads_v2', id::TEXT
FROM public.marketing_leads_v2
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From customer_queries
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(customer_email)), customer_name, 'customer_query', 'customer_queries', id::TEXT
FROM public.customer_queries
WHERE customer_email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From marketing_support_tickets
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(customer_email)), customer_name, 'support_ticket', 'marketing_support_tickets', id::TEXT
FROM public.marketing_support_tickets
WHERE customer_email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From admin_agents
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(email)), name, 'admin_agent', 'admin_agents', id::TEXT
FROM public.admin_agents
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From agent_clients
INSERT INTO public.master_email_list (email, full_name, source, source_table, source_id)
SELECT LOWER(TRIM(email)), name, 'agent_client', 'agent_clients', id::TEXT
FROM public.agent_clients
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From mt5_users
INSERT INTO public.master_email_list (email, source, source_table, source_id)
SELECT LOWER(TRIM(email)), 'mt5_user', 'mt5_users', id::TEXT
FROM public.mt5_users
WHERE email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;

-- From kickstarter_verifications
INSERT INTO public.master_email_list (email, source, source_table, source_id)
SELECT LOWER(TRIM(user_email)), 'kickstarter', 'kickstarter_verifications', id::TEXT
FROM public.kickstarter_verifications
WHERE user_email IS NOT NULL
ON CONFLICT (email, source_table) DO NOTHING;