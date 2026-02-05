-- Create contracts table for storing signed agreements
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type TEXT NOT NULL DEFAULT 'partnership_agreement',
  contract_version TEXT NOT NULL DEFAULT '1.0',
  owner_name TEXT NOT NULL DEFAULT 'Anchal',
  owner_role TEXT NOT NULL DEFAULT 'Founder & Owner',
  ceo_name TEXT NOT NULL DEFAULT 'Sahil',
  ceo_role TEXT NOT NULL DEFAULT 'CEO (Profit Share Partner)',
  owner_share_pct NUMERIC NOT NULL DEFAULT 60,
  ceo_share_pct NUMERIC NOT NULL DEFAULT 40,
  contract_terms JSONB NOT NULL DEFAULT '{}',
  owner_signature_data TEXT,
  owner_signed_at TIMESTAMPTZ,
  ceo_signature_data TEXT,
  ceo_signed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create brand collaborations table
CREATE TABLE public.brand_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  deal_type TEXT NOT NULL DEFAULT 'sponsorship',
  deal_title TEXT NOT NULL,
  deal_description TEXT,
  upfront_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  revenue_share_pct NUMERIC DEFAULT 0,
  deliverables JSONB DEFAULT '[]',
  contract_start_date DATE,
  contract_end_date DATE,
  payment_status TEXT DEFAULT 'pending',
  payment_received_at TIMESTAMPTZ,
  payment_method TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'negotiating',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_collaborations ENABLE ROW LEVEL SECURITY;

-- RLS policies (managed via edge functions with service role)
CREATE POLICY "Contracts managed via edge functions" ON public.contracts FOR ALL USING (false);
CREATE POLICY "Brand collabs managed via edge functions" ON public.brand_collaborations FOR ALL USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_collaborations_updated_at BEFORE UPDATE ON public.brand_collaborations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();