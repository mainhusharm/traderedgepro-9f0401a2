import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  Circle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface LiveMessage {
  id: string;
  session_id: string;
  sender_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  session_number?: string;
  topic?: string;
}

interface LiveChatMonitorProps {
  onSelectSession?: (sessionId: string) => void;
}

const LiveChatMonitor = ({ onSelectSession }: LiveChatMonitorProps) => {
  const [recentMessages, setRecentMessages] = useState<LiveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentMessages();

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel('admin-live-chat-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guidance_messages',
        },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as LiveMessage;

            // Fetch session info
            const { data: session } = await supabase
              .from('guidance_sessions')
              .select('session_number, topic')
              .eq('id', newMsg.session_id)
              .single();

            const enrichedMsg: LiveMessage = {
              ...newMsg,
              session_number: session?.session_number,
              topic: session?.topic,
            };

            setRecentMessages(prev => [enrichedMsg, ...prev.slice(0, 19)]);
          }

          if (payload.eventType === 'UPDATE') {
            // Update is_read status
            setRecentMessages(prev =>
              prev.map(m =>
                m.id === payload.new.id ? { ...m, is_read: payload.new.is_read } : m
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('guidance_messages')
        .select('*, guidance_sessions!inner(session_number, topic)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const messages: LiveMessage[] = (data || []).map((m: any) => ({
        id: m.id,
        session_id: m.session_id,
        sender_type: m.sender_type,
        content: m.content,
        is_read: m.is_read,
        created_at: m.created_at,
        session_number: m.guidance_sessions?.session_number,
        topic: m.guidance_sessions?.topic,
      }));

      setRecentMessages(messages);
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadUserMessages = recentMessages.filter(
    m => m.sender_type === 'user' && !m.is_read
  ).length;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Live Chat Activity
          </div>
          {unreadUserMessages > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadUserMessages} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {recentMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent messages</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {recentMessages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-3 hover:bg-white/5 cursor-pointer transition-colors ${
                      msg.sender_type === 'user' && !msg.is_read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => onSelectSession?.(msg.session_id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender_type === 'user'
                            ? 'bg-primary/10'
                            : 'bg-accent/10'
                        }`}
                      >
                        <User
                          className={`w-4 h-4 ${
                            msg.sender_type === 'user'
                              ? 'text-primary'
                              : 'text-accent'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">
                            {msg.sender_type === 'user' ? 'User' : 'Agent'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {msg.topic}
                          </span>
                          {msg.sender_type === 'user' && (
                            <span className="ml-auto">
                              {msg.is_read ? (
                                <CheckCircle className="w-3 h-3 text-success" />
                              ) : (
                                <Circle className="w-3 h-3 text-warning fill-warning" />
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {msg.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveChatMonitor;
