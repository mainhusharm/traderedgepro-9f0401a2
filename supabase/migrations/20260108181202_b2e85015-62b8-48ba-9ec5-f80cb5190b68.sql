-- Add new columns to mt5_orders for AI-generated code and admin workflow
ALTER TABLE public.mt5_orders 
ADD COLUMN IF NOT EXISTS ai_generated_code TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS revisions_remaining INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS ready_for_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE;

-- Update status column comment to reflect new statuses
COMMENT ON COLUMN public.mt5_orders.status IS 'pending, ai-generated, in-review, revision-needed, approved, delivered';

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_mt5_orders_status ON public.mt5_orders(status);
CREATE INDEX IF NOT EXISTS idx_mt5_orders_ready_for_user ON public.mt5_orders(ready_for_user);