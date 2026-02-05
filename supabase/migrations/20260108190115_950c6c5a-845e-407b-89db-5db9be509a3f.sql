-- Fix client_sessions - Session Token Exposure Risk
DROP POLICY IF EXISTS "Service role can manage client sessions" ON client_sessions;

-- Create proper policies for client_sessions
CREATE POLICY "Clients can view their own sessions"
ON client_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agent_clients 
    WHERE agent_clients.id = client_sessions.client_id 
    AND agent_clients.email = auth.email()
  )
);

CREATE POLICY "Service role manages client sessions"
ON client_sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');