import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminSession = () => {
      try {
        const sessionData = sessionStorage.getItem('admin_session');
        
        if (!sessionData) {
          setIsAuthorized(false);
          return;
        }

        const session = JSON.parse(sessionData);
        const expiresAt = new Date(session.expiresAt);
        
        // Check if session is expired
        if (expiresAt < new Date()) {
          sessionStorage.removeItem('admin_session');
          setIsAuthorized(false);
          return;
        }

        // Valid session
        setIsAuthorized(true);
      } catch (err) {
        console.error('Error checking admin session:', err);
        sessionStorage.removeItem('admin_session');
        setIsAuthorized(false);
      }
    };

    checkAdminSession();
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
