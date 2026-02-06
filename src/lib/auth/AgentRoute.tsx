import { useState, useEffect, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { callEdgeFunction } from '@/config/api';
import { Loader2 } from 'lucide-react';

interface AgentRouteProps {
  children: ReactNode;
}

interface AgentInfo {
  id: string;
  name: string;
  email: string;
  permissions: Record<string, boolean>;
  status: string;
}

const AgentRoute = ({ children }: AgentRouteProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const location = useLocation();

  useEffect(() => {
    const validateSession = async () => {
      const sessionToken = sessionStorage.getItem('agent_session_token');
      
      if (!sessionToken) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        const { data, error } = await callEdgeFunction('validate-agent-session', { sessionToken });

        if (error || !data?.valid) {
          // Clear invalid session
          sessionStorage.removeItem('agent_session_token');
          sessionStorage.removeItem('agent_info');
          setIsValid(false);
        } else {
          setIsValid(true);
          setAgentInfo(data.agent);
          // Update stored agent info
          sessionStorage.setItem('agent_info', JSON.stringify(data.agent));
        }
      } catch (err) {
        console.error('Session validation error:', err);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [location.pathname]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/agent" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default AgentRoute;

// Export a hook to get agent info
export const useAgentSession = () => {
  const [agent, setAgent] = useState<AgentInfo | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('agent_info');
    if (stored) {
      try {
        setAgent(JSON.parse(stored));
      } catch {
        setAgent(null);
      }
    }
  }, []);

  const logout = async () => {
    sessionStorage.removeItem('agent_session_token');
    sessionStorage.removeItem('agent_info');
    window.location.href = '/agent';
  };

  return { agent, logout };
};
