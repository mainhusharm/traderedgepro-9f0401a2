-- Create agent_availability table for storing agent work schedules
CREATE TABLE public.agent_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read agent availability (for booking UI)
CREATE POLICY "Anyone can view agent availability"
  ON public.agent_availability
  FOR SELECT
  USING (true);

-- Allow agents to manage their own availability
CREATE POLICY "Agents can manage own availability"
  ON public.agent_availability
  FOR ALL
  USING (true);

-- Enable realtime for agent_availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_availability;