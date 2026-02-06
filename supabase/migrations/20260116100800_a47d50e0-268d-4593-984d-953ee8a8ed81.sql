-- Phase 1: Journal Auto-Population - Add columns to trade_journal
ALTER TABLE trade_journal ADD COLUMN IF NOT EXISTS signal_id UUID REFERENCES institutional_signals(id);
ALTER TABLE trade_journal ADD COLUMN IF NOT EXISTS allocation_id UUID REFERENCES user_trade_allocations(id);
ALTER TABLE trade_journal ADD COLUMN IF NOT EXISTS session_taken TEXT;
ALTER TABLE trade_journal ADD COLUMN IF NOT EXISTS auto_calculated_rr DECIMAL(10,4);
ALTER TABLE trade_journal ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;
ALTER TABLE trade_journal ADD COLUMN IF NOT EXISTS mistake_tags TEXT[] DEFAULT '{}';

-- Phase 2: Mistake Pattern Detection Table
CREATE TABLE IF NOT EXISTS trading_mistake_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES user_prop_accounts(id),
  week_start DATE NOT NULL,
  mistake_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  total_pnl_impact DECIMAL(10,2) DEFAULT 0,
  avg_pnl_when_mistake DECIMAL(10,2) DEFAULT 0,
  win_rate_with_mistake DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, account_id, week_start, mistake_type)
);

-- Enable RLS on trading_mistake_patterns
ALTER TABLE trading_mistake_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for trading_mistake_patterns
CREATE POLICY "Users can view own mistake patterns" ON trading_mistake_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages mistake patterns" ON trading_mistake_patterns
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Phase 3: Enhanced Correlation Blocker - Add columns to user_prop_accounts
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS max_correlated_exposure_pct DECIMAL(5,2) DEFAULT 3.0;
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS hard_block_correlation BOOLEAN DEFAULT false;

-- Phase 6: Checklist Enforcement
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS require_checklist_before_trading BOOLEAN DEFAULT false;

-- Phase 9: Post-Trade Rating System
CREATE TABLE IF NOT EXISTS trade_post_mortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES trade_journal(id),
  allocation_id UUID REFERENCES user_trade_allocations(id),
  followed_plan BOOLEAN,
  emotional_state TEXT,
  lesson_learned TEXT,
  would_take_again BOOLEAN,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on trade_post_mortems
ALTER TABLE trade_post_mortems ENABLE ROW LEVEL SECURITY;

-- RLS policies for trade_post_mortems
CREATE POLICY "Users can manage own post mortems" ON trade_post_mortems
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mistake_patterns_user_week ON trading_mistake_patterns(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_post_mortems_user ON trade_post_mortems(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_auto_generated ON trade_journal(is_auto_generated) WHERE is_auto_generated = true;