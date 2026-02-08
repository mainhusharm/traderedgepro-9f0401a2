import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

// Define dashboard access roles
export type DashboardRole = 'operations' | 'financial' | 'support' | 'sales' | 'executive' | 'admin';

interface EnterpriseDashboardRouteProps {
  children: ReactNode;
  requiredRoles: DashboardRole[];
}

// Dashboard access configuration - maps roles to allowed dashboards
const ROLE_PERMISSIONS: Record<string, DashboardRole[]> = {
  admin: ['operations', 'financial', 'support', 'sales', 'executive', 'admin'],
  executive: ['operations', 'financial', 'support', 'sales', 'executive'],
  manager: ['operations', 'support', 'sales'],
  accountant: ['financial'],
  support_lead: ['support'],
  sales_lead: ['sales'],
  operations_lead: ['operations'],
};

// Password and MPIN for enterprise dashboard access
// In production, these should be stored securely in environment variables
export const ENTERPRISE_CREDENTIALS = {
  password: 'EntDash2026!',
  mpin: '847291'
};

export const EnterpriseDashboardRoute = ({ children, requiredRoles }: EnterpriseDashboardRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Check session storage for enterprise dashboard session
      const enterpriseSession = sessionStorage.getItem('enterprise_dashboard_session');

      if (!enterpriseSession) {
        setIsAuthorized(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const session = JSON.parse(enterpriseSession);

        // Check if session is expired (24 hour expiry)
        if (Date.now() > session.expiresAt) {
          sessionStorage.removeItem('enterprise_dashboard_session');
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          return;
        }

        // Check if user has required roles
        const userRoles = session.roles as DashboardRole[];
        const hasAccess = requiredRoles.some(role => userRoles.includes(role));

        setIsAuthorized(hasAccess);
      } catch (error) {
        console.error('Enterprise dashboard auth error:', error);
        sessionStorage.removeItem('enterprise_dashboard_session');
        setIsAuthorized(false);
      }

      setIsCheckingAuth(false);
    };

    checkAuthorization();
  }, [requiredRoles, user]);

  if (authLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/enterprise-login" state={{ from: location, requiredRoles }} replace />;
  }

  return <>{children}</>;
};

// Helper function to create enterprise session
export const createEnterpriseSession = (roles: DashboardRole[]) => {
  const session = {
    roles,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  sessionStorage.setItem('enterprise_dashboard_session', JSON.stringify(session));
};

// Helper function to check if user has access to a specific dashboard
export const hasAccessToDashboard = (dashboard: DashboardRole): boolean => {
  const session = sessionStorage.getItem('enterprise_dashboard_session');
  if (!session) return false;

  try {
    const parsed = JSON.parse(session);
    if (Date.now() > parsed.expiresAt) return false;
    return parsed.roles.includes(dashboard);
  } catch {
    return false;
  }
};

// Helper function to get user's accessible dashboards
export const getAccessibleDashboards = (): DashboardRole[] => {
  const session = sessionStorage.getItem('enterprise_dashboard_session');
  if (!session) return [];

  try {
    const parsed = JSON.parse(session);
    if (Date.now() > parsed.expiresAt) return [];
    return parsed.roles;
  } catch {
    return [];
  }
};

export default EnterpriseDashboardRoute;
