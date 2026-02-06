import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useDashboardMode } from '@/lib/context/DashboardModeContext';

export interface TradingLockState {
  isLocked: boolean;
  lockUntil: Date | null;
  lockReason: string | null;
  accountId: string | null;
  isLoading: boolean;
}

export function useTradingLock() {
  const { user } = useAuth();
  const { mode } = useDashboardMode();
  const [lockState, setLockState] = useState<TradingLockState>({
    isLocked: false,
    lockUntil: null,
    lockReason: null,
    accountId: null,
    isLoading: true,
  });

  const fetchLockStatus = useCallback(async () => {
    if (!user) {
      setLockState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      if (mode === 'prop_firm') {
        // Fetch from user_prop_accounts
        const { data, error } = await supabase
          .from('user_prop_accounts' as any)
          .select('id, trading_locked_until, lock_reason')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const lockUntil = (data as any).trading_locked_until ? new Date((data as any).trading_locked_until) : null;
          const isLocked = lockUntil ? lockUntil > new Date() : false;

          setLockState({
            isLocked,
            lockUntil: isLocked ? lockUntil : null,
            lockReason: isLocked ? (data as any).lock_reason : null,
            accountId: (data as any).id,
            isLoading: false,
          });
        } else {
          setLockState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        // Fetch from user_personal_accounts
        const { data, error } = await supabase
          .from('user_personal_accounts')
          .select('id, trading_locked_until, lock_reason')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const lockUntil = data.trading_locked_until ? new Date(data.trading_locked_until) : null;
          const isLocked = lockUntil ? lockUntil > new Date() : false;

          setLockState({
            isLocked,
            lockUntil: isLocked ? lockUntil : null,
            lockReason: isLocked ? data.lock_reason : null,
            accountId: data.id,
            isLoading: false,
          });
        } else {
          setLockState(prev => ({ ...prev, isLoading: false }));
        }
      }
    } catch (error) {
      console.error('Error fetching trading lock status:', error);
      setLockState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, mode]);

  // Set up real-time subscription for lock changes
  useEffect(() => {
    if (!user) return;

    fetchLockStatus();

    const tableName = mode === 'prop_firm' ? 'user_prop_accounts' : 'user_personal_accounts';
    
    const channel = supabase
      .channel(`trading-lock-${mode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const lockUntil = updated.trading_locked_until ? new Date(updated.trading_locked_until) : null;
          const isLocked = lockUntil ? lockUntil > new Date() : false;

          setLockState({
            isLocked,
            lockUntil: isLocked ? lockUntil : null,
            lockReason: isLocked ? updated.lock_reason : null,
            accountId: updated.id,
            isLoading: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, mode, fetchLockStatus]);

  // Auto-refresh when lock expires
  useEffect(() => {
    if (!lockState.lockUntil) return;

    const timeUntilExpiry = lockState.lockUntil.getTime() - Date.now();
    if (timeUntilExpiry <= 0) {
      fetchLockStatus();
      return;
    }

    const timer = setTimeout(() => {
      fetchLockStatus();
    }, timeUntilExpiry + 1000); // Add 1 second buffer

    return () => clearTimeout(timer);
  }, [lockState.lockUntil, fetchLockStatus]);

  return {
    ...lockState,
    refetch: fetchLockStatus,
  };
}
