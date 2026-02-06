import { useState, useEffect, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { callEdgeFunction } from '@/config/api';
import { Loader2 } from 'lucide-react';

interface ClientRouteProps {
  children: ReactNode;
}

const ClientRoute = ({ children }: ClientRouteProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const validateSession = async () => {
      const sessionToken = sessionStorage.getItem('client_session_token');
      
      if (!sessionToken) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        const { data, error } = await callEdgeFunction('validate-client-session', { sessionToken });

        if (error || !data?.valid) {
          sessionStorage.removeItem('client_session_token');
          sessionStorage.removeItem('client_info');
          setIsValid(false);
        } else {
          setIsValid(true);
          sessionStorage.setItem('client_info', JSON.stringify(data.client));
        }
      } catch (err) {
        console.error('Client session validation error:', err);
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
    return <Navigate to="/client" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ClientRoute;
