import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MT5ProtectedRouteProps {
  children: ReactNode;
  requiresPayment?: boolean;
}

const MT5ProtectedRoute = ({ children, requiresPayment = true }: MT5ProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Check MT5 user status and payment verification
  const { data: mt5User, isLoading: mt5Loading } = useQuery({
    queryKey: ['mt5-user', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('mt5_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading || mt5Loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/mt5-signin" state={{ from: location }} replace />;
  }

  // Check if MT5 trial has expired
  if (mt5User?.is_trial && mt5User?.trial_expires_at) {
    const isExpired = new Date(mt5User.trial_expires_at) < new Date();
    if (isExpired) {
      return <Navigate to="/mt5-trial-expired" state={{ from: location }} replace />;
    }
  }

  // If payment verification is required and not verified
  if (requiresPayment && (!mt5User || !mt5User.payment_verified)) {
    return <Navigate to="/mt5-payment" state={{ from: location, message: 'Please complete payment to access the dashboard' }} replace />;
  }

  return <>{children}</>;
};

export default MT5ProtectedRoute;
