import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { EconomicEvent } from './useEconomicEvents';

const NOTIFICATION_LEAD_TIME = 30 * 60 * 1000; // 30 minutes before
const NOTIFIED_EVENTS_KEY = 'notified_economic_events';

export const useHighImpactNotifications = (events: EconomicEvent[]) => {
  const notifiedEventsRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load previously notified events from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFIED_EVENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean up old entries (older than 24 hours)
        const now = Date.now();
        const cleaned = parsed.filter((entry: { id: string; timestamp: number }) => 
          now - entry.timestamp < 24 * 60 * 60 * 1000
        );
        notifiedEventsRef.current = new Set(cleaned.map((e: { id: string }) => e.id));
        localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(cleaned));
      }
    } catch (e) {
      console.error('Error loading notified events:', e);
    }
  }, []);

  const saveNotifiedEvent = useCallback((eventId: string) => {
    notifiedEventsRef.current.add(eventId);
    try {
      const stored = localStorage.getItem(NOTIFIED_EVENTS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      parsed.push({ id: eventId, timestamp: Date.now() });
      localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving notified event:', e);
    }
  }, []);

  const sendPushNotification = useCallback(async (event: EconomicEvent) => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return;
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification('⚠️ High-Impact Event Alert', {
        body: `${event.title} (${event.currency}) in 30 minutes!\nForecast: ${event.forecast || 'N/A'} | Previous: ${event.previous || 'N/A'}`,
        icon: '/favicon.ico',
        tag: event.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Also show in-app toast
    toast.warning(`High-Impact Event in 30 mins`, {
      description: `${event.title} (${event.currency})`,
      duration: 10000,
    });
  }, []);

  const checkUpcomingEvents = useCallback(() => {
    const now = Date.now();
    
    events
      .filter(event => event.impact === 'high')
      .forEach(event => {
        const eventTime = event.time.getTime();
        const timeUntilEvent = eventTime - now;
        
        // Check if event is within notification window (25-35 minutes before)
        if (
          timeUntilEvent > 0 &&
          timeUntilEvent <= NOTIFICATION_LEAD_TIME + 5 * 60 * 1000 && // 35 minutes
          timeUntilEvent >= NOTIFICATION_LEAD_TIME - 5 * 60 * 1000 && // 25 minutes
          !notifiedEventsRef.current.has(event.id)
        ) {
          sendPushNotification(event);
          saveNotifiedEvent(event.id);
        }
      });
  }, [events, sendPushNotification, saveNotifiedEvent]);

  useEffect(() => {
    // Check immediately
    checkUpcomingEvents();

    // Check every minute
    checkIntervalRef.current = setInterval(checkUpcomingEvents, 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkUpcomingEvents]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Delay the permission request to avoid being too aggressive
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);
};
