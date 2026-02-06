-- Add new columns to user_prop_accounts for enhanced safety features
ALTER TABLE user_prop_accounts 
  ADD COLUMN IF NOT EXISTS personal_daily_loss_limit_pct DECIMAL(5,2) DEFAULT 3.0,
  ADD COLUMN IF NOT EXISTS daily_profit_target DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lock_after_target BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_be_pips INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allowed_trading_hours JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avg_lot_size DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lot_size_variance DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trading_locked_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lock_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS daily_profit_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_loss_locked BOOLEAN DEFAULT false;

-- Add columns to trade_daily_stats for lot size tracking
ALTER TABLE trade_daily_stats 
  ADD COLUMN IF NOT EXISTS avg_lot_size DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_lot_size DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lot_size_variance DECIMAL(10,4) DEFAULT 0;

-- Create scaling_plans table
CREATE TABLE IF NOT EXISTS scaling_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) DEFAULT 'moderate',
  current_week INTEGER DEFAULT 1,
  current_risk_target DECIMAL(5,2) DEFAULT 0.5,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_progression_at TIMESTAMP WITH TIME ZONE,
  last_regression_at TIMESTAMP WITH TIME ZONE,
  total_progressions INTEGER DEFAULT 0,
  total_regressions INTEGER DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trading_circuit_breaker_log for tracking lock events
CREATE TABLE IF NOT EXISTS trading_circuit_breaker_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  breaker_type VARCHAR(50) NOT NULL, -- 'daily_loss', 'profit_lock', 'lot_consistency', 'consecutive_losses'
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE,
  trigger_value DECIMAL(10,4),
  threshold_value DECIMAL(10,4),
  reason TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  auto_resolved BOOLEAN DEFAULT true
);

-- Create position_correlation_rules table
CREATE TABLE IF NOT EXISTS position_correlation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  max_correlated_positions INTEGER DEFAULT 2,
  max_aggregate_risk_pct DECIMAL(5,2) DEFAULT 3.0,
  is_hard_block BOOLEAN DEFAULT true,
  custom_correlations JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trade_consistency_alerts table
CREATE TABLE IF NOT EXISTS trade_consistency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES user_prop_accounts(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'lot_size_spike', 'session_violation', 'profit_target_hit', 'daily_limit_hit'
  severity VARCHAR(20) DEFAULT 'warning', -- 'warning', 'blocked', 'info'
  current_value DECIMAL(10,4),
  expected_value DECIMAL(10,4),
  threshold_pct DECIMAL(5,2),
  was_blocked BOOLEAN DEFAULT false,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE scaling_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_circuit_breaker_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_correlation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_consistency_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scaling_plans
CREATE POLICY "Users can view own scaling plans" ON scaling_plans
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own scaling plans" ON scaling_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own scaling plans" ON scaling_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for trading_circuit_breaker_log
CREATE POLICY "Users can view own circuit breaker logs" ON trading_circuit_breaker_log
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Service role can insert circuit breaker logs" ON trading_circuit_breaker_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for position_correlation_rules
CREATE POLICY "Users can view own correlation rules" ON position_correlation_rules
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage own correlation rules" ON position_correlation_rules
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for trade_consistency_alerts
CREATE POLICY "Users can view own consistency alerts" ON trade_consistency_alerts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Service role can insert consistency alerts" ON trade_consistency_alerts
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scaling_plans_user_account ON scaling_plans(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_scaling_plans_active ON scaling_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_account ON trading_circuit_breaker_log(account_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_unresolved ON trading_circuit_breaker_log(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_correlation_rules_account ON position_correlation_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_consistency_alerts_account_date ON trade_consistency_alerts(account_id, created_at DESC);

-- Trigger to update updated_at on scaling_plans
CREATE TRIGGER update_scaling_plans_timestamp
  BEFORE UPDATE ON scaling_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on position_correlation_rules
CREATE TRIGGER update_correlation_rules_timestamp
  BEFORE UPDATE ON position_correlation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();