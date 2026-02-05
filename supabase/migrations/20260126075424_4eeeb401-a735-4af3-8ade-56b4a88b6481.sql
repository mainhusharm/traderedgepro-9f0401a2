-- Create table to store prop firm affiliate requests
CREATE TABLE public.prop_firm_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  prop_firm_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.prop_firm_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit prop firm requests"
ON public.prop_firm_requests
FOR INSERT
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view prop firm requests"
ON public.prop_firm_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for master email list
CREATE OR REPLACE FUNCTION public.trigger_master_email_prop_firm_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM add_to_master_email_list(NEW.user_email, NULL, NULL, NEW.user_name, 'prop_firm_request', 'prop_firm_requests', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_master_email_prop_firm_requests
AFTER INSERT ON public.prop_firm_requests
FOR EACH ROW
EXECUTE FUNCTION public.trigger_master_email_prop_firm_requests();