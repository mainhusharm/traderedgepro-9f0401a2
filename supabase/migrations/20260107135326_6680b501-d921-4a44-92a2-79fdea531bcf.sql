-- Create MT5 notifications table for order updates
CREATE TABLE public.mt5_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.mt5_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'status_update', 'file_upload', 'revision_response'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add revisions column to mt5_orders for revision requests
ALTER TABLE public.mt5_orders 
ADD COLUMN IF NOT EXISTS revision_requests JSONB DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE public.mt5_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.mt5_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.mt5_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications" ON public.mt5_notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));