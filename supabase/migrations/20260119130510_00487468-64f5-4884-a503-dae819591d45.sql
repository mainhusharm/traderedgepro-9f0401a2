-- Create table for promotional email subscribers
CREATE TABLE public.promo_email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'manual',
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow admins/agents to manage subscribers
CREATE POLICY "Agents can manage promo subscribers" 
ON public.promo_email_subscribers 
FOR ALL 
USING (public.is_active_agent(auth.uid()));

-- Insert the 30 email subscribers
INSERT INTO public.promo_email_subscribers (email, source) VALUES
  ('suryakantrout16@gmail.com', 'manual_import'),
  ('info@quarchi.com', 'manual_import'),
  ('alexmarco752@gmail.com', 'manual_import'),
  ('reachtathata@gmail.com', 'manual_import'),
  ('mbayeabdou029@gmail.com', 'manual_import'),
  ('stuctureparadise31@gmail.com', 'manual_import'),
  ('raz@in-4.co.uk', 'manual_import'),
  ('rakeshrathva115@gmail.com', 'manual_import'),
  ('jadduboyyy@gmail.com', 'manual_import'),
  ('john.wphotography2.0@gmail.com', 'manual_import'),
  ('wahid.ulul2006@gmail.com', 'manual_import'),
  ('mohitchadeliya1@gmail.com', 'manual_import'),
  ('ogunsanyaisaiah0@gmail.com', 'manual_import'),
  ('ibzfx17@gmail.com', 'manual_import'),
  ('alexisricaud3@gmail.com', 'manual_import'),
  ('canalminhatatuagem@gmail.com', 'manual_import'),
  ('emersemersonariellara@gmail.com', 'manual_import'),
  ('alleycsam.diniz@aliancaempresas.com.br', 'manual_import'),
  ('abhishekpatil1055@gmail.cfom', 'manual_import'),
  ('lfmoura@gmail.com', 'manual_import'),
  ('hkawawa88@gmail.com', 'manual_import'),
  ('tech@jakscomputerparts.com', 'manual_import'),
  ('lfowler@lockforce.co.uk', 'manual_import'),
  ('rizaldiiakmal@gmail.com', 'manual_import'),
  ('investyclubb@gmail.com', 'manual_import'),
  ('sarojarun2008@gmail.com', 'manual_import'),
  ('Muhdmahmud435@gmail.com', 'manual_import'),
  ('tenpips41@gmail.com', 'manual_import'),
  ('srisricaterersrohtak@gmal.com', 'manual_import'),
  ('thegreatgujjar8958@gmail.com', 'manual_import')
ON CONFLICT (email) DO NOTHING;