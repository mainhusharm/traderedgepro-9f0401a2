-- Create bot_status table for tracking signal bots
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

-- Create support_tickets table
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

-- Create admin_activity_log for audit trail
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Bot status policies (only admins can manage)
CREATE POLICY "Admins can manage bot status" ON public.bot_status
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view bot status" ON public.bot_status
FOR SELECT USING (true);

-- Support tickets policies
CREATE POLICY "Users can create their own tickets" ON public.support_tickets
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin activity log policies
CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_log
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Insert default bot statuses
INSERT INTO public.bot_status (bot_type, is_running) VALUES
('forex', false),
('crypto', false),
('futures', false);

-- Create triggers for updated_at
CREATE TRIGGER update_bot_status_updated_at
BEFORE UPDATE ON public.bot_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for signals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;