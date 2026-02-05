-- Add real-time tracking columns to institutional_signals for risk management
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS entry_triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS entry_triggered_at TIMESTAMPTZ;
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS signal_status TEXT DEFAULT 'pending';
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS current_price DECIMAL;
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS trailing_stop DECIMAL;
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS breakeven_triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE institutional_signals ADD COLUMN IF NOT EXISTS partial_tp_triggered BOOLEAN DEFAULT FALSE;

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_institutional_signals_status ON institutional_signals(signal_status);
CREATE INDEX IF NOT EXISTS idx_institutional_signals_outcome ON institutional_signals(outcome);