-- Create expenses table for future use
CREATE TABLE public.business_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profit sharing config table
CREATE TABLE public.profit_sharing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  partner_role TEXT NOT NULL,
  share_percentage NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default profit sharing configuration
INSERT INTO public.profit_sharing_config (partner_name, partner_role, share_percentage)
VALUES 
  ('Anchal', 'Founder/Admin', 60),
  ('Sahil', 'CEO', 40);

-- Enable RLS
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_sharing_config ENABLE ROW LEVEL SECURITY;

-- No direct access - managed via edge functions with service role
CREATE POLICY "No direct access to expenses" ON public.business_expenses FOR ALL USING (false);
CREATE POLICY "No direct access to profit config" ON public.profit_sharing_config FOR ALL USING (false);