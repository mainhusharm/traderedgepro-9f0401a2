-- Fix push_notification_logs - restrict insert to service role only
DROP POLICY IF EXISTS "Service role can insert push logs" ON push_notification_logs;

CREATE POLICY "Service role can insert push logs"
ON push_notification_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Fix referral_clicks - allow authenticated or anonymous tracking but with validation
DROP POLICY IF EXISTS "Allow public inserts for tracking" ON referral_clicks;

-- Allow anyone to insert for tracking purposes (this is intentional for anonymous referral tracking)
-- But add validation that referral_code is not empty
CREATE POLICY "Allow referral click tracking"
ON referral_clicks FOR INSERT
WITH CHECK (referral_code IS NOT NULL AND referral_code != '');