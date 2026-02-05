-- Create system performance logs table
CREATE TABLE public.system_performance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient querying
CREATE INDEX idx_performance_logs_recorded_at ON public.system_performance_logs(recorded_at DESC);
CREATE INDEX idx_performance_logs_metric_type ON public.system_performance_logs(metric_type);

-- Enable RLS
ALTER TABLE public.system_performance_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view performance logs
CREATE POLICY "Admins can view performance logs"
ON public.system_performance_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only system (via service role) can insert logs
CREATE POLICY "Service role can insert performance logs"
ON public.system_performance_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_performance_logs;