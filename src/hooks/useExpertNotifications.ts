import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { useBrowserPushNotifications } from './useBrowserPushNotifications';

interface ExpertNotificationOptions {
  onExpertOnline?: (agentName: string) => void;
  onNewMessage?: (sessionId: string, messagePreview: string) => void;
}

export const useExpertNotifications = (options?: ExpertNotificationOptions) => {
  const { user } = useAuth();
  const { permission, requestPermission, showNotification, isSupported } = useBrowserPushNotifications();
  const previousOnlineAgentsRef = useRef<Set<string>>(new Set());

  const notifyExpertOnline = useCallback((agentName: string) => {
    // Show toast
    toast.success(`${agentName || 'An expert'} is now online!`, {
      description: 'You can now get live support for your trading questions.',
      duration: 5000,
    });

    // Show browser notification
    if (permission === 'granted') {
      showNotification('Expert Available! 🟢', {
        body: `${agentName || 'A trading expert'} is now online and ready to help.`,
        tag: 'expert-online',
      });
    }

    options?.onExpertOnline?.(agentName);
  }, [permission, showNotification, options]);

  const notifyNewMessage = useCallback((sessionId: string, messagePreview: string, senderName?: string) => {
    // Show toast
    toast.info('New message received', {
      description: messagePreview.substring(0, 60) + (messagePreview.length > 60 ? '...' : ''),
      duration: 5000,
    });

    // Show browser notification
    if (permission === 'granted') {
      showNotification('New Message 💬', {
        body: `${senderName || 'Expert'}: ${messagePreview.substring(0, 100)}`,
        tag: `message-${sessionId}`,
      });
    }

    options?.onNewMessage?.(sessionId, messagePreview);
  }, [permission, showNotification, options]);

  useEffect(() => {
    if (!user || !isSupported) return;

    // Request permission on first load
    if (permission === 'default') {
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, permission, requestPermission]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to agent online status changes
    const agentChannel = supabase
      .channel('expert-online-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_agents',
        },
        (payload) => {
          const newData = payload.new as { id: string; is_online: boolean; name: string | null; status: string };
          const oldData = payload.old as { is_online: boolean };

          // Check if agent just came online
          if (newData.is_online && !oldData.is_online && newData.status === 'active') {
            if (!previousOnlineAgentsRef.current.has(newData.id)) {
              notifyExpertOnline(newData.name || 'Trading Expert');
              previousOnlineAgentsRef.current.add(newData.id);
            }
          } else if (!newData.is_online) {
            previousOnlineAgentsRef.current.delete(newData.id);
          }
        }
      )
      .subscribe();

    // Subscribe to new messages for user's sessions
    const messageChannel = supabase
      .channel('user-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guidance_messages',
        },
        async (payload) => {
          const newMessage = payload.new as { 
            session_id: string; 
            sender_type: string; 
            content: string;
            sender_id: string;
          };

          // Only notify for messages from agents/admins to users
          if (newMessage.sender_type === 'agent' || newMessage.sender_type === 'admin') {
            // Check if this session belongs to the current user
            const { data: session } = await supabase
              .from('guidance_sessions')
              .select('user_id')
              .eq('id', newMessage.session_id)
              .single();

            if (session?.user_id === user.id) {
              notifyNewMessage(newMessage.session_id, newMessage.content);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [user, notifyExpertOnline, notifyNewMessage]);

  return {
    permission,
    requestPermission,
    isSupported,
  };
};

export default useExpertNotifications;
