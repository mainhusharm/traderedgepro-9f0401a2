-- Create user_activity table and other missing tables/columns - Batch 1

-- 1. user_activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_details JSONB,
  metadata JSONB,
  page TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. prop_firm_requests table
CREATE TABLE IF NOT EXISTS public.prop_firm_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  prop_firm_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.prop_firm_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on prop_firm_requests" ON public.prop_firm_requests FOR ALL USING (true);

-- 3. marketing_engagement_queue table
CREATE TABLE IF NOT EXISTS public.marketing_engagement_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  target_url TEXT,
  target_user TEXT,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.marketing_engagement_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on marketing_engagement_queue" ON public.marketing_engagement_queue FOR ALL USING (true);

-- 4. marketing_engagement_history table
CREATE TABLE IF NOT EXISTS public.marketing_engagement_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  target_url TEXT,
  target_user TEXT,
  status TEXT DEFAULT 'completed',
  result JSONB,
  metadata JSONB,
  executed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.marketing_engagement_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on marketing_engagement_history" ON public.marketing_engagement_history FOR ALL USING (true);

-- 5. marketing_tasks_v2 table
CREATE TABLE IF NOT EXISTS public.marketing_tasks_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.marketing_tasks_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on marketing_tasks_v2" ON public.marketing_tasks_v2 FOR ALL USING (true);

-- 6. marketing_support_tickets table
CREATE TABLE IF NOT EXISTS public.marketing_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  subject TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  ai_confidence NUMERIC,
  messages JSONB DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.marketing_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on marketing_support_tickets" ON public.marketing_support_tickets FOR ALL USING (true);