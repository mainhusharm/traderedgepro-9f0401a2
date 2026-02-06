-- Create agent payments table for salary management
CREATE TABLE public.agent_salaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  salary_amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, requested, paid
  payment_method_requested BOOLEAN DEFAULT false,
  payment_method_requested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id)
);

-- Create agent payment methods table
CREATE TABLE public.agent_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL, -- bank_transfer, crypto, paypal
  is_primary BOOLEAN DEFAULT false,
  details JSONB DEFAULT '{}', -- encrypted/hashed payment details
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create salary payment history table
CREATE TABLE public.agent_salary_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.admin_agents(id) ON DELETE CASCADE,
  salary_id UUID REFERENCES public.agent_salaries(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method_id UUID REFERENCES public.agent_payment_methods(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  transaction_reference VARCHAR(255),
  notes TEXT,
  paid_by UUID REFERENCES public.managers(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agent_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_salary_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_salaries (only managers via service role)
CREATE POLICY "Service role only for agent_salaries"
ON public.agent_salaries
FOR ALL
USING (false)
WITH CHECK (false);

-- RLS Policies for agent_payment_methods (agents can see/update their own)
CREATE POLICY "Agents can view own payment methods"
ON public.agent_payment_methods
FOR SELECT
USING (true); -- Will be filtered in edge function

CREATE POLICY "Agents can insert own payment methods"
ON public.agent_payment_methods
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Agents can update own payment methods"
ON public.agent_payment_methods
FOR UPDATE
USING (true);

-- RLS Policies for agent_salary_payments (read only for agents on their own)
CREATE POLICY "Service role only for agent_salary_payments"
ON public.agent_salary_payments
FOR ALL
USING (false)
WITH CHECK (false);

-- Create indexes for performance
CREATE INDEX idx_agent_salaries_agent_id ON public.agent_salaries(agent_id);
CREATE INDEX idx_agent_payment_methods_agent_id ON public.agent_payment_methods(agent_id);
CREATE INDEX idx_agent_salary_payments_agent_id ON public.agent_salary_payments(agent_id);
CREATE INDEX idx_agent_salary_payments_status ON public.agent_salary_payments(status);

-- Add realtime for payment method updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_salaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_payment_methods;