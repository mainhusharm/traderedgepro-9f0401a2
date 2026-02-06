-- Create table for agent VIP votes on reviewed signals
CREATE TABLE public.signal_vip_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.institutional_signals(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  is_vip_worthy BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(signal_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.signal_vip_votes ENABLE ROW LEVEL SECURITY;

-- Policy for agents to vote
CREATE POLICY "Agents can manage VIP votes"
ON public.signal_vip_votes
FOR ALL
USING (true)
WITH CHECK (true);

-- Add column to track VIP vote count and reviewer info
ALTER TABLE public.institutional_signals 
ADD COLUMN IF NOT EXISTS vip_vote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vip_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewer_names TEXT[];

-- Function to auto-promote to VIP when 3+ votes
CREATE OR REPLACE FUNCTION public.check_vip_promotion()
RETURNS TRIGGER AS $$
DECLARE
  vote_count INTEGER;
  reviewer_list TEXT[];
BEGIN
  -- Count positive VIP votes for this signal
  SELECT COUNT(*), ARRAY_AGG(aa.name)
  INTO vote_count, reviewer_list
  FROM public.signal_vip_votes svv
  JOIN public.admin_agents aa ON aa.id = svv.agent_id
  WHERE svv.signal_id = NEW.signal_id AND svv.is_vip_worthy = true;
  
  -- Update the signal with vote count and reviewer names
  UPDATE public.institutional_signals
  SET 
    vip_vote_count = vote_count,
    reviewer_names = reviewer_list,
    is_vip = CASE WHEN vote_count >= 3 THEN true ELSE is_vip END,
    vip_approved_at = CASE WHEN vote_count >= 3 AND vip_approved_at IS NULL THEN now() ELSE vip_approved_at END
  WHERE id = NEW.signal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for VIP promotion check
CREATE TRIGGER check_vip_promotion_trigger
AFTER INSERT OR UPDATE ON public.signal_vip_votes
FOR EACH ROW
EXECUTE FUNCTION public.check_vip_promotion();

-- Enable realtime for the votes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_vip_votes;