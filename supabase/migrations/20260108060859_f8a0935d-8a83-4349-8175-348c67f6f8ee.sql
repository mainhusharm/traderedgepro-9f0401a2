
-- Add feedback_requested field to guidance_sessions
ALTER TABLE public.guidance_sessions 
ADD COLUMN feedback_requested BOOLEAN DEFAULT false,
ADD COLUMN feedback_requested_at TIMESTAMP WITH TIME ZONE;

-- Create agent_notifications table
CREATE TABLE public.agent_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  session_id UUID REFERENCES public.guidance_sessions(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own notifications
CREATE POLICY "Agents can view their own notifications" 
ON public.agent_notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Agents can update their own notifications" 
ON public.agent_notifications 
FOR UPDATE 
USING (true);

CREATE POLICY "System can insert notifications" 
ON public.agent_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_agent_notifications_agent_id ON public.agent_notifications(agent_id);
CREATE INDEX idx_agent_notifications_is_read ON public.agent_notifications(agent_id, is_read);

-- Enable realtime for agent notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;

-- Create function to notify agent on new session assignment
CREATE OR REPLACE FUNCTION public.notify_agent_on_session_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when assigned_agent_id changes to a non-null value
  IF NEW.assigned_agent_id IS NOT NULL AND (OLD.assigned_agent_id IS NULL OR OLD.assigned_agent_id != NEW.assigned_agent_id) THEN
    INSERT INTO public.agent_notifications (agent_id, type, title, message, session_id)
    VALUES (
      NEW.assigned_agent_id,
      'session_assigned',
      'New Session Assigned',
      'A new guidance session "' || NEW.topic || '" (' || NEW.session_number || ') has been assigned to you.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for session assignment notifications
CREATE TRIGGER on_session_assigned
  AFTER INSERT OR UPDATE ON public.guidance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agent_on_session_assignment();

-- Create function to notify agent on rating received
CREATE OR REPLACE FUNCTION public.notify_agent_on_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_name TEXT;
  v_session_topic TEXT;
  v_rating_label TEXT;
BEGIN
  -- Get session topic
  SELECT topic INTO v_session_topic FROM public.guidance_sessions WHERE id = NEW.session_id;
  
  -- Determine rating label
  v_rating_label := CASE 
    WHEN NEW.rating = 5 THEN 'Excellent'
    WHEN NEW.rating = 4 THEN 'Great'
    WHEN NEW.rating = 3 THEN 'Good'
    WHEN NEW.rating = 2 THEN 'Fair'
    ELSE 'Poor'
  END;
  
  -- Create notification if agent_id exists
  IF NEW.agent_id IS NOT NULL THEN
    INSERT INTO public.agent_notifications (agent_id, type, title, message, session_id)
    VALUES (
      NEW.agent_id,
      'rating_received',
      'New Rating Received',
      'You received a ' || NEW.rating || '-star (' || v_rating_label || ') rating for session "' || COALESCE(v_session_topic, 'Unknown') || '".' || 
      CASE WHEN NEW.feedback IS NOT NULL AND NEW.feedback != '' THEN ' Feedback: "' || LEFT(NEW.feedback, 100) || '"' ELSE '' END,
      NEW.session_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for rating notifications
CREATE TRIGGER on_rating_received
  AFTER INSERT ON public.session_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agent_on_rating();
