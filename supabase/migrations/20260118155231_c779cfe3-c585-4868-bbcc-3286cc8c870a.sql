-- Create treasure hunt entries table
CREATE TABLE public.treasure_hunt_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  twitter_handle TEXT NOT NULL,
  partner_followed BOOLEAN DEFAULT false,
  traderedge_followed BOOLEAN DEFAULT false,
  current_stage INTEGER DEFAULT 1,
  stage_1_answer TEXT,
  stage_2_score INTEGER,
  stage_3_score INTEGER,
  stage_3_time INTEGER,
  hints_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_winner BOOLEAN DEFAULT false,
  winner_position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_treasure_hunt_email UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.treasure_hunt_entries ENABLE ROW LEVEL SECURITY;

-- Allow public to insert new entries
CREATE POLICY "Anyone can create treasure hunt entry"
ON public.treasure_hunt_entries
FOR INSERT
WITH CHECK (true);

-- Allow reading own entry by email (stored in localStorage)
CREATE POLICY "Anyone can read treasure hunt entries"
ON public.treasure_hunt_entries
FOR SELECT
USING (true);

-- Allow updating own entry
CREATE POLICY "Anyone can update treasure hunt entries"
ON public.treasure_hunt_entries
FOR UPDATE
USING (true);

-- Enable realtime for live winner count
ALTER PUBLICATION supabase_realtime ADD TABLE public.treasure_hunt_entries;

-- Create index for faster winner queries
CREATE INDEX idx_treasure_hunt_winners ON public.treasure_hunt_entries (is_winner, winner_position);
CREATE INDEX idx_treasure_hunt_completed ON public.treasure_hunt_entries (completed_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_treasure_hunt_entries_updated_at
BEFORE UPDATE ON public.treasure_hunt_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();