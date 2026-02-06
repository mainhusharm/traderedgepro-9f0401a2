-- Add is_pinned column to ai_conversations for conversation pinning
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Create index for efficient sorting (pinned first, then by date)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_pinned_date ON public.ai_conversations (user_id, is_pinned DESC, updated_at DESC);