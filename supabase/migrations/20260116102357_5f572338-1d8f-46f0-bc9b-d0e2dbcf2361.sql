-- Add news_buffer_minutes column for configurable news avoidance window
ALTER TABLE user_prop_accounts ADD COLUMN IF NOT EXISTS news_buffer_minutes INTEGER DEFAULT 30;

-- Add comment for documentation
COMMENT ON COLUMN user_prop_accounts.news_buffer_minutes IS 'Minutes before high-impact news events to block trading (default: 30)';