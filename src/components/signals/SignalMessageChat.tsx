import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SignalMessage {
  id: string;
  signal_id: string;
  message_type: string;
  title: string | null;
  content: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface SignalMessageChatProps {
  signalId: string;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

const MESSAGE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  update: { 
    icon: <Activity className="w-3 h-3" />, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10' 
  },
  risk_alert: { 
    icon: <AlertTriangle className="w-3 h-3" />, 
    color: 'text-warning', 
    bgColor: 'bg-warning/10' 
  },
  trade_management: { 
    icon: <Shield className="w-3 h-3" />, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10' 
  },
  breakeven: { 
    icon: <Shield className="w-3 h-3" />, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/10' 
  },
  partial_close: { 
    icon: <Target className="w-3 h-3" />, 
    color: 'text-success', 
    bgColor: 'bg-success/10' 
  },
  outcome: { 
    icon: <CheckCircle className="w-3 h-3" />, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10' 
  },
  entry_triggered: { 
    icon: <TrendingUp className="w-3 h-3" />, 
    color: 'text-success', 
    bgColor: 'bg-success/10' 
  },
  sl_adjusted: { 
    icon: <Shield className="w-3 h-3" />, 
    color: 'text-warning', 
    bgColor: 'bg-warning/10' 
  },
  tp_hit: { 
    icon: <Target className="w-3 h-3" />, 
    color: 'text-success', 
    bgColor: 'bg-success/10' 
  },
  sl_hit: { 
    icon: <XCircle className="w-3 h-3" />, 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10' 
  },
};

export const SignalMessageChat = ({ signalId, isExpanded, onToggle, className = '' }: SignalMessageChatProps) => {
  const [messages, setMessages] = useState<SignalMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastViewedRef = useRef<string | null>(null);

  // Fetch messages for this signal
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('signal_messages')
        .select('*')
        .eq('signal_id', signalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const typedData = (data || []).map(m => ({
        ...m,
        metadata: (m.metadata as Record<string, any>) || null,
      }));
      setMessages(typedData);
      
      // Calculate unread count
      const stored = localStorage.getItem(`signal_read_${signalId}`);
      if (stored && typedData) {
        const unread = data.filter(m => new Date(m.created_at) > new Date(stored)).length;
        setUnreadCount(unread);
      } else if (data) {
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching signal messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`signal-messages-${signalId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signal_messages',
          filter: `signal_id=eq.${signalId}`,
        },
        (payload) => {
          const newMessage = payload.new as SignalMessage;
          setMessages(prev => [...prev, newMessage]);
          if (!isExpanded) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [signalId]);

  // Mark as read when expanded
  useEffect(() => {
    if (isExpanded && messages.length > 0) {
      const latestTime = messages[messages.length - 1].created_at;
      localStorage.setItem(`signal_read_${signalId}`, latestTime);
      setUnreadCount(0);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [isExpanded, messages.length, signalId]);

  const getMessageConfig = (type: string) => {
    return MESSAGE_TYPE_CONFIG[type] || MESSAGE_TYPE_CONFIG.update;
  };

  // Collapsed view - just show unread badge
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-white/10 hover:bg-white/5 transition-colors ${className}`}
      >
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Messages</span>
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs">
            {unreadCount}
          </Badge>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  // Expanded view - show chat
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`border border-white/10 rounded-lg bg-card/30 overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Trade Updates</span>
          <Badge variant="outline" className="text-xs">
            {messages.length} messages
          </Badge>
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="max-h-64 p-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No updates yet
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const config = getMessageConfig(message.message_type);
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-2.5 rounded-lg ${config.bgColor} border border-white/5`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      {message.title && (
                        <p className={`text-sm font-medium ${config.color}`}>
                          {message.title}
                        </p>
                      )}
                      <p className="text-sm text-foreground/90">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(message.created_at), 'MMM d, HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      {/* System only notice */}
      <div className="px-4 py-2 bg-muted/20 border-t border-white/5">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Bell className="w-3 h-3" />
          System updates only • Real-time trade management
        </p>
      </div>
    </motion.div>
  );
};

// Hook to manage signal messages for a list of signals
export const useSignalMessages = (signalIds: string[]) => {
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (signalIds.length === 0) return;

    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      
      // Get all messages for these signals
      const { data, error } = await supabase
        .from('signal_messages')
        .select('signal_id, created_at')
        .in('signal_id', signalIds);

      if (error) {
        console.error('Error fetching message counts:', error);
        return;
      }

      // Count unread per signal
      signalIds.forEach(id => {
        const stored = localStorage.getItem(`signal_read_${id}`);
        const signalMessages = (data || []).filter(m => m.signal_id === id);
        
        if (stored) {
          counts[id] = signalMessages.filter(m => new Date(m.created_at) > new Date(stored)).length;
        } else {
          counts[id] = signalMessages.length;
        }
      });

      setMessageCounts(counts);
    };

    fetchCounts();

    // Subscribe to new messages for all signals
    const channel = supabase
      .channel('signal-messages-counts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signal_messages',
        },
        (payload) => {
          const newMessage = payload.new as SignalMessage;
          if (signalIds.includes(newMessage.signal_id)) {
            setMessageCounts(prev => ({
              ...prev,
              [newMessage.signal_id]: (prev[newMessage.signal_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [signalIds.join(',')]);

  return messageCounts;
};

export default SignalMessageChat;
