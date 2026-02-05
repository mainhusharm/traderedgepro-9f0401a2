import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

// VIP alert sound - more premium sounding notification
const VIP_SOUND_URL = 'data:audio/wav;base64,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';

export const useVIPSignalSound = () => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isEnabledRef = useRef(true);

  // Load sound preference from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem('notification_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        isEnabledRef.current = parsed.sound !== false;
      } catch (e) {
        console.error('Error parsing notification settings:', e);
      }
    }

    // Create audio element
    audioRef.current = new Audio(VIP_SOUND_URL);
    audioRef.current.volume = 0.7;
  }, []);

  const playVIPSound = useCallback(() => {
    if (!isEnabledRef.current || !audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((err) => {
      console.log('VIP sound playback failed:', err);
    });
  }, []);

  // Subscribe to VIP signals in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vip-signals-sound')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals',
          filter: 'is_vip=eq.true'
        },
        (payload) => {
          const signal = payload.new as any;
          console.log('VIP Signal received for sound:', signal);
          
          // Play sound
          playVIPSound();
          
          // Show toast notification
          toast.success(`⭐ VIP Signal: ${signal.symbol}`, {
            description: `${signal.signal_type} @ ${signal.entry_price}`,
            duration: 10000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playVIPSound]);

  return { playVIPSound };
};

export default useVIPSignalSound;