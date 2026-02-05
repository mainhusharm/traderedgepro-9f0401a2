import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CalendarDays, CheckCircle, Clock, Eye, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

type GuidanceNotificationType = 'session_update' | 'new_message' | 'message_seen';

type GuidanceNotification = {
  id: string;
  type: GuidanceNotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  meta?: {
    sessionId?: string;
    messageId?: string;
  };
};

const NotificationsTab = () => {
  const { user } = useAuth();
  const [guidanceNotifs, setGuidanceNotifs] = useState<GuidanceNotification[]>([]);
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  const unreadCount = useMemo(() => guidanceNotifs.filter(n => !n.read).length, [guidanceNotifs]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('guidance_sessions')
        .select('id')
        .eq('user_id', user.id);

      if (!error && data) setSessionIds(data.map(s => s.id));
    };

    void load();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const sessionsChannel = supabase
      .channel(`user-guidance-sessions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guidance_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const s = payload.new;
          setGuidanceNotifs(prev => [
            {
              id: `session-${payload.eventType}-${s.id}-${Date.now()}`,
              type: 'session_update',
              title: 'Session updated',
              message: `${s.session_number || 'Session'} • Status: ${s.status}`,
              created_at: new Date().toISOString(),
              read: false,
              meta: { sessionId: s.id },
            },
            ...prev,
          ]);

          // refresh ids in case a new session was created
          if (payload.eventType === 'INSERT') {
            setSessionIds(prevIds => (prevIds.includes(s.id) ? prevIds : [...prevIds, s.id]));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (sessionIds.length === 0) return;

    const filter = `session_id=in.(${sessionIds.join(',')})`;

    const messagesChannel = supabase
      .channel(`user-guidance-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guidance_messages',
          filter,
        },
        (payload: any) => {
          const m = payload.new;
          // Only notify for inbound messages
          if (m?.sender_type === 'user') return;

          setGuidanceNotifs(prev => [
            {
              id: `msg-in-${m.id}`,
              type: 'new_message',
              title: 'New guidance message',
              message: (m.content || '').slice(0, 120) || 'New message received',
              created_at: m.created_at || new Date().toISOString(),
              read: false,
              meta: { sessionId: m.session_id, messageId: m.id },
            },
            ...prev,
          ]);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guidance_messages',
          filter,
        },
        (payload: any) => {
          const m = payload.new;
          if (!m) return;

          // Read receipts for user's messages
          if (m.sender_id === user.id && m.is_read) {
            setGuidanceNotifs(prev => {
              if (prev.some(n => n.id === `msg-seen-${m.id}`)) return prev;
              return [
                {
                  id: `msg-seen-${m.id}`,
                  type: 'message_seen',
                  title: 'Message seen',
                  message: 'Your message was seen by the expert.',
                  created_at: new Date().toISOString(),
                  read: false,
                  meta: { sessionId: m.session_id, messageId: m.id },
                },
                ...prev,
              ];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, sessionIds.join(',')]);

  const markAllAsRead = () => {
    setGuidanceNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setGuidanceNotifs(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const iconFor = (type: GuidanceNotificationType) => {
    switch (type) {
      case 'session_update':
        return <CalendarDays className="w-5 h-5 text-primary" />;
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-primary" />;
      case 'message_seen':
        return <Eye className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-primary" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 px-2 py-0.5" variant="default">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">Notification Center</h2>
            <p className="text-sm text-muted-foreground">Real-time guidance updates</p>
          </div>
        </div>

        <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Guidance</CardTitle>
          <CardDescription>New messages, read receipts, and session status updates.</CardDescription>
        </CardHeader>
        <CardContent>
          {guidanceNotifs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No guidance updates yet.</div>
          ) : (
            <ScrollArea className="h-[28rem] pr-2">
              <div className="space-y-3">
                {guidanceNotifs.map((n, index) => (
                  <motion.button
                    key={n.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.2) }}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      n.read ? 'border-white/10 bg-white/5' : 'border-primary/30 bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {iconFor(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold">{n.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
