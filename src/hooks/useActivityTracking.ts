import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface ActivityDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export const useActivityTracking = () => {
  const { user } = useAuth();
  const hasLoggedLogin = useRef(false);

  // Log an activity
  const logActivity = useCallback(async (
    activityType: string,
    details: ActivityDetails = {}
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activity_log')
        .insert([{
          user_id: user.id,
          activity_type: activityType,
          activity_details: details as Json,
          user_agent: navigator.userAgent
        }]);

      if (error) {
        console.warn('Failed to log activity:', error);
      }
    } catch (err) {
      console.warn('Activity logging error:', err);
    }
  }, [user]);

  // Log login activity (only once per session)
  const logLogin = useCallback(async () => {
    if (!user || hasLoggedLogin.current) return;
    
    hasLoggedLogin.current = true;
    
    await logActivity('login', {
      timestamp: new Date().toISOString(),
      platform: navigator.platform,
      language: navigator.language
    });

    // Update first_login_at in memberships if not set
    try {
      await supabase
        .from('memberships')
        .update({ 
          first_login_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .is('first_login_at', null);

      // Always update last_activity_at
      await supabase
        .from('memberships')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (err) {
      console.warn('Failed to update membership activity:', err);
    }
  }, [user, logActivity]);

  // Log signal received
  const logSignalReceived = useCallback(async (signalData: {
    signalId: string;
    symbol: string;
    signalType: string;
  }) => {
    if (!user) return;

    await logActivity('signal_received', signalData);

    // Increment signals_received_count
    try {
      const { data: membership } = await supabase
        .from('memberships')
        .select('signals_received_count')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membership) {
        await supabase
          .from('memberships')
          .update({ 
            signals_received_count: (membership.signals_received_count || 0) + 1,
            last_activity_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('status', 'active');
      }
    } catch (err) {
      console.warn('Failed to update signal count:', err);
    }
  }, [user, logActivity]);

  // Log dashboard view
  const logDashboardView = useCallback(async (tabName: string) => {
    await logActivity('dashboard_view', { tab: tabName });
  }, [logActivity]);

  // Log feature access
  const logFeatureAccess = useCallback(async (featureName: string, details?: ActivityDetails) => {
    await logActivity('feature_access', { feature: featureName, ...details });
  }, [logActivity]);

  // Auto-log login when user is available
  useEffect(() => {
    if (user) {
      logLogin();
    }
  }, [user, logLogin]);

  return {
    logActivity,
    logLogin,
    logSignalReceived,
    logDashboardView,
    logFeatureAccess
  };
};
