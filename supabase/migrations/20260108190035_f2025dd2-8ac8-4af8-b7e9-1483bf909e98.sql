-- Fix agent_sessions table - Session Hijacking Risk
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage agent sessions" ON agent_sessions;

-- Create proper policies for agent_sessions
CREATE POLICY "Agents can view their own sessions"
ON agent_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_agents 
    WHERE admin_agents.id = agent_sessions.agent_id 
    AND admin_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can insert their own sessions"
ON agent_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_agents 
    WHERE admin_agents.id = agent_id 
    AND admin_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can delete their own sessions"
ON agent_sessions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_agents 
    WHERE admin_agents.id = agent_sessions.agent_id 
    AND admin_agents.user_id = auth.uid()
  )
);

-- Add policy for admins to view all profiles (for support)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Fix OTP verifications - only service role should manage
CREATE POLICY "Service role manages OTP verifications"
ON otp_verifications FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix OTP rate limits - only service role should manage  
CREATE POLICY "Service role manages OTP rate limits"
ON otp_rate_limits FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');