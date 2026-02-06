-- Create treasure hunt configuration table
CREATE TABLE public.treasure_hunt_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hunt_name TEXT NOT NULL DEFAULT 'Treasure Hunt',
  reveal_date TIMESTAMPTZ NOT NULL DEFAULT '2026-01-24 00:00:00+00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  winners_announced BOOLEAN NOT NULL DEFAULT false,
  spins_remaining INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treasure_hunt_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for countdown timer)
CREATE POLICY "Anyone can view hunt config" 
ON public.treasure_hunt_config 
FOR SELECT 
USING (true);

-- Add new columns to treasure_hunt_entries
ALTER TABLE public.treasure_hunt_entries 
ADD COLUMN IF NOT EXISTS pending_winner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS announcement_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS winner_position INTEGER,
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Insert initial config for the hunt
INSERT INTO public.treasure_hunt_config (hunt_name, reveal_date, is_active, winners_announced, spins_remaining)
VALUES ('January 2026 Treasure Hunt', '2026-01-24 00:00:00+00', true, false, 3);

-- Enable realtime for config updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.treasure_hunt_config;