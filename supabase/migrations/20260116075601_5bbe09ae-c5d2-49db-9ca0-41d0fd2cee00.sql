-- Add connection and sync columns to user_prop_accounts
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'manual';
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS metaapi_account_id text;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'not_connected';
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS recovery_mode_active boolean DEFAULT false;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS recovery_mode_started_at timestamptz;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS last_inactivity_warning_at timestamptz;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS last_equity_update_at timestamptz;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS reported_equity numeric;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS theoretical_equity numeric;

-- Create statement uploads table
CREATE TABLE IF NOT EXISTS account_statement_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('html', 'csv', 'screenshot', 'pdf')),
  parsed_at timestamptz,
  parsed_data jsonb,
  equity_extracted numeric,
  balance_extracted numeric,
  trades_extracted jsonb,
  parsing_status text DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE account_statement_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for statement uploads
CREATE POLICY "Users can view own statement uploads"
  ON account_statement_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statement uploads"
  ON account_statement_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statement uploads"
  ON account_statement_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statement uploads"
  ON account_statement_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create daily equity confirmations table
CREATE TABLE IF NOT EXISTS daily_equity_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  reported_equity numeric NOT NULL,
  reported_balance numeric,
  open_pnl numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id, date)
);

-- Enable RLS
ALTER TABLE daily_equity_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own equity confirmations"
  ON daily_equity_confirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equity confirmations"
  ON daily_equity_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equity confirmations"
  ON daily_equity_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

-- Create daily trading checklists table
CREATE TABLE IF NOT EXISTS daily_trading_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  calendar_reviewed boolean DEFAULT false,
  drawdown_checked boolean DEFAULT false,
  positions_verified boolean DEFAULT false,
  rules_confirmed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_id, date)
);

-- Enable RLS
ALTER TABLE daily_trading_checklists ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own checklists"
  ON daily_trading_checklists FOR ALL
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_equity_confirmations_user_date ON daily_equity_confirmations(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_statement_uploads_user ON account_statement_uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_user_date ON daily_trading_checklists(user_id, date DESC);