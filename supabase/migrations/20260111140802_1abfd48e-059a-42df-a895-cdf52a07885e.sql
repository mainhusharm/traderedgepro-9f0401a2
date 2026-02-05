-- Add agent_id to signals table to track which agent created the signal
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.admin_agents(id) ON DELETE SET NULL;

-- Add agent_notes column for agent comments/exit signals
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS agent_notes TEXT DEFAULT NULL;

-- Add duplicate_of column to track if this signal is a duplicate of another
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES public.signals(id) ON DELETE SET NULL;

-- Add auto_vip_reason to track why a signal became VIP automatically
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS auto_vip_reason TEXT DEFAULT NULL;

-- Create agent_signal_comments table for ongoing comments/updates on signals
CREATE TABLE IF NOT EXISTS public.agent_signal_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_type TEXT DEFAULT 'update', -- 'update', 'exit_now', 'hold', 'partial_close', 'move_sl', 'warning'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on agent_signal_comments
ALTER TABLE public.agent_signal_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can view all comments
CREATE POLICY "Agents can view all signal comments" 
ON public.agent_signal_comments 
FOR SELECT 
USING (true);

-- Policy: Agents can insert their own comments
CREATE POLICY "Agents can add comments" 
ON public.agent_signal_comments 
FOR INSERT 
WITH CHECK (true);

-- Policy: Agents can delete their own comments
CREATE POLICY "Agents can delete their comments" 
ON public.agent_signal_comments 
FOR DELETE 
USING (true);

-- Create agent_stats view or table for tracking agent performance
CREATE TABLE IF NOT EXISTS public.agent_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE UNIQUE,
  total_signals_posted INTEGER DEFAULT 0,
  winning_signals INTEGER DEFAULT 0,
  losing_signals INTEGER DEFAULT 0,
  breakeven_signals INTEGER DEFAULT 0,
  clients_handled INTEGER DEFAULT 0,
  last_signal_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on agent_stats
ALTER TABLE public.agent_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view agent stats
CREATE POLICY "Anyone can view agent stats" 
ON public.agent_stats 
FOR SELECT 
USING (true);

-- Policy: System can update agent stats
CREATE POLICY "System can manage agent stats" 
ON public.agent_stats 
FOR ALL 
USING (true);

-- Enable realtime for agent_signal_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_signal_comments;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_signals_agent_id ON public.signals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_signal_comments_signal_id ON public.agent_signal_comments(signal_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_agent_id ON public.agent_stats(agent_id);