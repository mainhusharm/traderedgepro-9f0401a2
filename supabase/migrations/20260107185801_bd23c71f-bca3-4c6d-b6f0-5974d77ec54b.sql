-- Create guidance sessions table
CREATE TABLE public.guidance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_number TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guidance chat messages table
CREATE TABLE public.guidance_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.guidance_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL, -- 'user' or 'admin'
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guidance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for guidance_sessions
CREATE POLICY "Users can view their own sessions"
ON public.guidance_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.guidance_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.guidance_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all sessions"
ON public.guidance_sessions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for guidance_messages
CREATE POLICY "Users can view messages for their sessions"
ON public.guidance_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guidance_sessions
    WHERE guidance_sessions.id = guidance_messages.session_id
    AND guidance_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages for their sessions"
ON public.guidance_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guidance_sessions
    WHERE guidance_sessions.id = guidance_messages.session_id
    AND guidance_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update read status for their messages"
ON public.guidance_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.guidance_sessions
    WHERE guidance_sessions.id = guidance_messages.session_id
    AND guidance_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all messages"
ON public.guidance_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can send messages"
ON public.guidance_messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update messages"
ON public.guidance_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_guidance_sessions_updated_at
BEFORE UPDATE ON public.guidance_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();