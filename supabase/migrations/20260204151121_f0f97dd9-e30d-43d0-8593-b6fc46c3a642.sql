-- Add remaining missing columns and tables - Batch 3 (without system_notifications)

-- Create system_notifications table first
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  message_type TEXT,
  metadata JSONB,
  content TEXT,
  title TEXT,
  sender_id UUID,
  sender_type TEXT,
  signal_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on system_notifications" ON public.system_notifications FOR SELECT USING (true);

-- trade_management_events table
CREATE TABLE IF NOT EXISTS public.trade_management_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.trade_management_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on trade_management_events" ON public.trade_management_events FOR ALL USING (true);

-- user_activity_log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
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
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity log" ON public.user_activity_log FOR SELECT USING (auth.uid() = user_id);

-- treasure_hunt_config - add missing columns
ALTER TABLE public.treasure_hunt_config ADD COLUMN IF NOT EXISTS spins_remaining INTEGER DEFAULT 3;
ALTER TABLE public.treasure_hunt_config ADD COLUMN IF NOT EXISTS winners_announced BOOLEAN DEFAULT false;

-- treasure_hunt_entries - add missing column
ALTER TABLE public.treasure_hunt_entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- signal_messages table for institutional bot
CREATE TABLE IF NOT EXISTS public.signal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID,
  message_type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.signal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on signal_messages" ON public.signal_messages FOR SELECT USING (true);
CREATE POLICY "Admin insert on signal_messages" ON public.signal_messages FOR INSERT WITH CHECK (true);