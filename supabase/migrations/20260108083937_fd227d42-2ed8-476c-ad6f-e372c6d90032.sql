-- Create push notification delivery logs table for tracking
CREATE TABLE public.push_notification_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all logs
CREATE POLICY "Admins can view all push logs" 
ON public.push_notification_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Policy for admins to insert logs
CREATE POLICY "Service role can insert push logs" 
ON public.push_notification_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_push_logs_created_at ON public.push_notification_logs(created_at DESC);
CREATE INDEX idx_push_logs_status ON public.push_notification_logs(status);
CREATE INDEX idx_push_logs_type ON public.push_notification_logs(notification_type);