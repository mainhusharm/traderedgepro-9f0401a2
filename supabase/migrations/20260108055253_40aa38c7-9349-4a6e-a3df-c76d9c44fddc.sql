-- Create session_ratings table for user ratings
CREATE TABLE public.session_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.guidance_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.admin_agents(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint so users can only rate a session once
CREATE UNIQUE INDEX idx_session_ratings_unique ON public.session_ratings(session_id, user_id);

-- Enable RLS
ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own ratings" 
ON public.session_ratings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create ratings for their sessions" 
ON public.session_ratings FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.guidance_sessions 
    WHERE id = session_id 
    AND user_id = auth.uid() 
    AND status = 'completed'
  )
);

-- Agents/admins can view all ratings
CREATE POLICY "Agents can view all ratings" 
ON public.session_ratings FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.admin_agents WHERE user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);