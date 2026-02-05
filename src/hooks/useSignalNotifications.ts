import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useBrowserPushNotifications } from './useBrowserPushNotifications';
import { useNotificationSound } from './useNotificationSound';
import { toast } from 'sonner';

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  confidence_score: number | null;
  created_at: string;
}

export const useSignalNotifications = (minConfidence: number = 70) => {
  const { user } = useAuth();
  const { permission, requestPermission, showNotification, isSupported } = useBrowserPushNotifications();
  const { playNotificationSound } = useNotificationSound();
  const hasRequestedPermission = useRef(false);

  // Request permission on first use
  const enableNotifications = async () => {
    if (!isSupported) {
      toast.error('Your browser does not support notifications');
      return false;
    }

    const granted = await requestPermission();
    if (granted) {
      toast.success('Signal notifications enabled!');
      // Store preference
      localStorage.setItem('signal_notifications_enabled', 'true');
    } else {
      toast.error('Notification permission denied');
    }
    return granted;
  };

  // Check if notifications are enabled
  const isEnabled = useCallback(() => {
    return permission === 'granted' && localStorage.getItem('signal_notifications_enabled') === 'true';
  }, [permission]);

  // Disable notifications
  const disableNotifications = () => {
    localStorage.removeItem('signal_notifications_enabled');
    toast.info('Signal notifications disabled');
  };

  // Get sound enabled state
  const isSoundEnabled = () => {
    return localStorage.getItem('signal_sound_enabled') !== 'false';
  };

  const enableSound = () => {
    localStorage.setItem('signal_sound_enabled', 'true');
    toast.success('Sound notifications enabled');
  };

  const disableSound = () => {
    localStorage.setItem('signal_sound_enabled', 'false');
    toast.info('Sound notifications disabled');
  };

  // Show signal notification
  const notifyNewSignal = useCallback((signal: Signal) => {
    if (!isEnabled()) return;

    const confidence = signal.confidence_score || 0;
    
    // Only notify for high-confidence signals (above threshold)
    if (confidence < minConfidence) return;

    const direction = signal.signal_type === 'BUY' ? '📈' : '📉';
    const confidencePercent = `${confidence.toFixed(0)}%`;
    const isHighConfidence = confidence >= 80;

    // Play sound for high-confidence signals
    if (isSoundEnabled()) {
      playNotificationSound();
    }

    showNotification(`${direction} ${isHighConfidence ? '🔥 HIGH CONFIDENCE ' : ''}${signal.signal_type} Signal: ${signal.symbol}`, {
      body: `Entry: ${signal.entry_price}${signal.stop_loss ? ` | SL: ${signal.stop_loss}` : ''}${signal.take_profit ? ` | TP: ${signal.take_profit}` : ''} | Confidence: ${confidencePercent}`,
      tag: `signal-${signal.id}`,
      requireInteraction: true,
      data: { signalId: signal.id },
    });

    // Also show toast with special styling for high confidence
    if (isHighConfidence) {
      toast.success(`🔥 ${direction} HIGH CONFIDENCE ${signal.signal_type}: ${signal.symbol} @ ${signal.entry_price}`, { 
        duration: 10000,
        description: `${confidencePercent} confidence - Don't miss this opportunity!`,
      });
    } else {
      toast.success(`${direction} New ${signal.signal_type} Signal: ${signal.symbol} @ ${signal.entry_price}`, { 
        duration: 8000,
        description: `Confidence: ${confidencePercent}`,
      });
    }
  }, [isEnabled, minConfidence, playNotificationSound, showNotification]);

  // Subscribe to real-time institutional signals
  useEffect(() => {
    if (!user || !isEnabled()) return;

    console.log('Setting up real-time signal notifications for institutional_signals...');

    const channel = supabase
      .channel('institutional-signals-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'institutional_signals',
        },
        (payload) => {
          const newSignal = payload.new as any;
          // Only notify if sent to users and approved
          if (!newSignal.send_to_users || !newSignal.agent_approved) return;
          
          console.log('New institutional signal received:', payload);
          const mappedSignal: Signal = {
            id: newSignal.id,
            symbol: newSignal.symbol,
            signal_type: newSignal.direction,
            entry_price: newSignal.entry_price,
            stop_loss: newSignal.stop_loss,
            take_profit: newSignal.take_profit_1,
            confidence_score: newSignal.confidence || 75,
            created_at: newSignal.created_at,
          };
          notifyNewSignal(mappedSignal);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'institutional_signals',
        },
        (payload) => {
          const updated = payload.new as any;
          const old = payload.old as any;
          // Notify when signal becomes approved and sent to users
          if (updated.send_to_users && updated.agent_approved && 
              (!old.send_to_users || !old.agent_approved)) {
            console.log('Signal now approved for users:', payload);
            const mappedSignal: Signal = {
              id: updated.id,
              symbol: updated.symbol,
              signal_type: updated.direction,
              entry_price: updated.entry_price,
              stop_loss: updated.stop_loss,
              take_profit: updated.take_profit_1,
              confidence_score: updated.confidence || 75,
              created_at: updated.created_at,
            };
            notifyNewSignal(mappedSignal);
          }
        }
      )
      .subscribe((status) => {
        console.log('Institutional signal notification subscription status:', status);
      });

    return () => {
      console.log('Cleaning up institutional signal notifications subscription...');
      supabase.removeChannel(channel);
    };
  }, [user, permission, isEnabled, notifyNewSignal]);

  return {
    isSupported,
    permission,
    isEnabled: isEnabled(),
    isSoundEnabled: isSoundEnabled(),
    enableNotifications,
    disableNotifications,
    enableSound,
    disableSound,
    notifyNewSignal,
  };
};

export default useSignalNotifications;
