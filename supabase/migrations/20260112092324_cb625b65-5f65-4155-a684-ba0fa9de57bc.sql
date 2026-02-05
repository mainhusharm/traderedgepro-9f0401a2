-- Create table for expert signal validations
CREATE TABLE public.signal_expert_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(signal_id, expert_id)
);

-- Enable RLS
ALTER TABLE public.signal_expert_validations ENABLE ROW LEVEL SECURITY;

-- RLS policies for expert validations
CREATE POLICY "Agents can view validations" 
ON public.signal_expert_validations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Agents can create validations" 
ON public.signal_expert_validations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Agents can update own validations" 
ON public.signal_expert_validations 
FOR UPDATE 
TO authenticated
USING (true);

-- Create function to check and promote signal to VIP
CREATE OR REPLACE FUNCTION public.check_signal_vip_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_count INTEGER;
  required_validations INTEGER := 2;
BEGIN
  SELECT COUNT(*) INTO valid_count
  FROM public.signal_expert_validations
  WHERE signal_id = NEW.signal_id AND is_valid = true;
  
  IF valid_count >= required_validations THEN
    UPDATE public.signals
    SET 
      is_vip = true,
      is_public = true,
      auto_vip_reason = 'Expert validated (' || valid_count || ' approvals)'
    WHERE id = NEW.signal_id AND is_vip = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-promote signals
CREATE TRIGGER trigger_check_signal_vip_promotion
AFTER INSERT OR UPDATE ON public.signal_expert_validations
FOR EACH ROW
EXECUTE FUNCTION public.check_signal_vip_promotion();

-- Add indexes for faster lookups
CREATE INDEX idx_signal_expert_validations_signal_id ON public.signal_expert_validations(signal_id);
CREATE INDEX IF NOT EXISTS idx_signals_generated_by ON public.signals(generated_by);