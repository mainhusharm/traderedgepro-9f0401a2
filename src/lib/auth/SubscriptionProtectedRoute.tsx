import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';

interface SubscriptionProtectedRouteProps {
  children: ReactNode;
  requiresSubscription?: boolean;
}

const SubscriptionProtectedRoute = ({ children, requiresSubscription = true }: SubscriptionProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isActive, isLoading: subLoading, isTrial, trialExpired, membership } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if trial has expired - redirect to trial expired page
  if (isTrial && trialExpired) {
    return <Navigate to="/trial-expired" state={{ from: location }} replace />;
  }

  // For trial users, also check expires_at in real-time
  if (membership?.isTrial && membership?.expiresAt) {
    const isExpiredNow = new Date(membership.expiresAt) < new Date();
    if (isExpiredNow) {
      return <Navigate to="/trial-expired" state={{ from: location }} replace />;
    }
  }

  if (requiresSubscription && !isActive) {
    return <Navigate to="/membership" state={{ from: location, message: 'Please subscribe to access this feature' }} replace />;
  }

  return <>{children}</>;
};

export default SubscriptionProtectedRoute;
