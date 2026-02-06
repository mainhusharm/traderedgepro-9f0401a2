import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Loader2,
  Crown,
  X,
  Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Message {
  id: string;
  manager_id: string;
  agent_id: string;
  sender_type: 'manager' | 'agent';
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Manager {
  id: string;
  name: string | null;
  email: string;
  is_online: boolean;
}

interface AgentManagerDMProps {
  agentId: string;
  isFullPage?: boolean;
  onClose?: () => void;
}

const AgentManagerDM = ({ agentId, isFullPage = false, onClose }: AgentManagerDMProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchManagers();
  }, []);

  useEffect(() => {
    if (selectedManager) {
      fetchMessages(selectedManager.id);
      markMessagesAsRead(selectedManager.id);
      
      // Set up realtime subscription for new messages
      const channel = supabase
        .channel(`manager-dm-${agentId}-${selectedManager.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'manager_agent_messages',
            filter: `agent_id=eq.${agentId}`
          },
          (payload) => {
            if ((payload.new as any).manager_id === selectedManager.id) {
              setMessages(prev => [...prev, payload.new as Message]);
              if ((payload.new as any).sender_type === 'manager') {
                markMessagesAsRead(selectedManager.id);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedManager, agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('managers')
        .select('id, name, email, is_online')
        .eq('status', 'active');

      if (error) throw error;
      setManagers(data || []);
      
      // Auto-select first manager if only one
      if (data && data.length === 1) {
        setSelectedManager(data[0]);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (managerId: string) => {
    try {
      const { data, error } = await supabase
        .from('manager_agent_messages')
        .select('*')
        .eq('agent_id', agentId)
        .eq('manager_id', managerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'manager' | 'agent'
      })));
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const markMessagesAsRead = async (managerId: string) => {
    try {
      await supabase
        .from('manager_agent_messages')
        .update({ is_read: true })
        .eq('agent_id', agentId)
        .eq('manager_id', managerId)
        .eq('sender_type', 'manager')
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedManager) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('manager_agent_messages')
        .insert({
          agent_id: agentId,
          manager_id: selectedManager.id,
          sender_type: 'agent',
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const containerClass = isFullPage 
    ? "h-[calc(100vh-200px)]" 
    : "h-[500px]";

  return (
    <Card className={`bg-card/50 border-white/5 flex flex-col ${containerClass}`}>
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-purple-400" />
            Manager Messages
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Manager Selection */}
        {!selectedManager && managers.length > 1 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-muted-foreground">Select a manager to chat with:</p>
            <div className="grid grid-cols-2 gap-2">
              {managers.map((manager) => (
                <Button
                  key={manager.id}
                  variant="outline"
                  className="justify-start border-white/10 hover:bg-purple-500/10"
                  onClick={() => setSelectedManager(manager)}
                >
                  <div className="flex items-center gap-2">
                    <Circle className={`w-2 h-2 ${manager.is_online ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'}`} />
                    <span>{manager.name || manager.email}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedManager && (
          <>
            {/* Selected Manager Info */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">{selectedManager.name || 'Manager'}</p>
                  <p className="text-xs text-muted-foreground">{selectedManager.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Circle className={`w-2 h-2 ${selectedManager.is_online ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'}`} />
                <span className={`text-xs ${selectedManager.is_online ? 'text-green-400' : 'text-gray-400'}`}>
                  {selectedManager.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation with your manager</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.sender_type === 'agent'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-purple-500/20 border border-purple-500/30'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          message.sender_type === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2 mt-4 shrink-0">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="bg-white/5 border-white/10"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="bg-purple-600 hover:bg-purple-500"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}

        {managers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No managers available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentManagerDM;
