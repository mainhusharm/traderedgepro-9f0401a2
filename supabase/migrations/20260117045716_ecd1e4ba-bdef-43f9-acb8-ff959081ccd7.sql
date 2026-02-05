-- Create signal_messages table for trade management/risk updates
CREATE TABLE public.signal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES public.institutional_signals(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'update', -- 'update', 'risk_alert', 'trade_management', 'breakeven', 'partial_close', 'outcome'
    title TEXT,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signal_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read signal messages
CREATE POLICY "Users can read signal messages"
ON public.signal_messages
FOR SELECT
TO authenticated
USING (true);

-- Only allow inserts via service role (system only)
CREATE POLICY "Service role can insert signal messages"
ON public.signal_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_signal_messages_signal_id ON public.signal_messages(signal_id);
CREATE INDEX idx_signal_messages_created_at ON public.signal_messages(created_at DESC);

-- Enable realtime for signal messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_messages;