-- Create AI automation configuration table
CREATE TABLE public.marketing_ai_automation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  last_error TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_ai_automation ENABLE ROW LEVEL SECURITY;

-- Create policies (admin only for now - marketing dashboard is admin-only)
CREATE POLICY "Allow all operations for marketing automation"
  ON public.marketing_ai_automation
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_marketing_ai_automation_updated_at
  BEFORE UPDATE ON public.marketing_ai_automation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default automation configs for each agent
INSERT INTO public.marketing_ai_automation (agent_id, agent_name, interval_minutes, config) VALUES
  ('sage', 'SAGE', 360, '{"type": "blog", "autoPublish": false}'),
  ('maya', 'MAYA', 180, '{"platforms": ["twitter"], "autoPost": true}'),
  ('echo', 'ECHO', 15, '{"maxRepliesPerRun": 5, "autoReply": true}'),
  ('blake', 'BLAKE', 240, '{"source": "linkedin", "maxLeadsPerRun": 10}'),
  ('zoe', 'ZOE', 30, '{"autoRespond": true, "escalateAfter": 2}'),
  ('lexi', 'LEXI', 480, '{"autoReview": true}'),
  ('aria', 'ARIA', 120, '{"digestEmail": true}'),
  ('nova', 'NOVA', 60, '{"greeting": "Welcome to TraderEdge!"}')