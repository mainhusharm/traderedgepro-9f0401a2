-- Add VIP signal columns
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_by text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vip_notes text DEFAULT NULL;

-- Create index for VIP signals
CREATE INDEX IF NOT EXISTS idx_signals_is_vip ON public.signals (is_vip);

-- Add breakeven outcome option (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'breakeven' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'signal_outcome')) THEN
    ALTER TYPE signal_outcome ADD VALUE 'breakeven';
  END IF;
END $$;