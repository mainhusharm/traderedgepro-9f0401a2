-- Create user_signal_actions table to track per-user signal usage
CREATE TABLE IF NOT EXISTS public.user_signal_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  signal_id UUID NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'taken', -- 'taken', 'skipped', etc.
  outcome TEXT, -- 'target_hit', 'stop_loss_hit', 'breakeven', 'custom'
  pnl NUMERIC(10, 2),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

-- Enable RLS
ALTER TABLE public.user_signal_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own signal actions" 
ON public.user_signal_actions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signal actions" 
ON public.user_signal_actions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signal actions" 
ON public.user_signal_actions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_signal_actions_user_id ON public.user_signal_actions(user_id);
CREATE INDEX idx_user_signal_actions_signal_id ON public.user_signal_actions(signal_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_signal_actions;