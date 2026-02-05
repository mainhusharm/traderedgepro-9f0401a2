import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface WebPushState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
}

export const useWebPushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<WebPushState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
  });
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    checkSupport();
    fetchVapidKey();
  }, [user]);

  const fetchVapidKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error) throw error;
      if (data?.publicKey) {
        setVapidPublicKey(data.publicKey);
      }
    } catch (error) {
      console.error('Error fetching VAPID key:', error);
    }
  };

  const checkSupport = async () => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (!isSupported) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    const permission = Notification.permission;
    
    // Check if already subscribed
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState({
        isSupported: true,
        isSubscribed: !!subscription,
        permission,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking push subscription:', error);
      setState(prev => ({ ...prev, isSupported, permission, isLoading: false }));
    }
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to enable push notifications',
        variant: 'destructive',
      });
      return false;
    }

    if (!vapidPublicKey) {
      toast({
        title: 'Configuration error',
        description: 'Push notifications are not configured yet. Please try again later.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission, isLoading: false }));
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Save subscription to database via edge function
      const { error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          subscription: subscription.toJSON(),
          userId: user.id,
        },
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        isLoading: false,
      }));

      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications',
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Subscription failed',
        description: 'Failed to enable push notifications',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, vapidPublicKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        if (user) {
          await supabase.functions.invoke('remove-push-subscription', {
            body: { userId: user.id },
          });
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications',
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Error',
        description: 'Failed to disable push notifications',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) {
      toast({
        title: 'Not subscribed',
        description: 'Please enable push notifications first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await supabase.functions.invoke('send-web-push', {
        body: {
          userId: user?.id,
          title: 'Test Notification',
          body: '🚀 Push notifications are working!',
          data: { url: '/dashboard' },
        },
      });

      toast({
        title: 'Test sent',
        description: 'Check for the push notification',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    }
  }, [state.isSubscribed, user, toast]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};

export default useWebPushNotifications;
