import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Video,
  User,
  Search,
  Filter,
  CalendarDays,
  Shield,
  Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAdminApi } from '@/hooks/useAdminApi';
import { format } from 'date-fns';
import GuidanceCalendar from '@/components/dashboard/GuidanceCalendar';
import AgentManagement from '@/components/admin/AgentManagement';

interface GuidanceSession {
  id: string;
  user_id: string;
  session_number: string;
  topic: string;
  description: string | null;
  preferred_date: string | null;
  status: string;
  admin_id: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const GuidanceManagementTab = () => {
  const { user } = useAuth();
  const { callAdminApi } = useAdminApi();
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GuidanceSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const result = await callAdminApi('get_guidance_sessions', { 
        page: 1, 
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter 
      });

      setSessions(result.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
      
      // Subscribe to new messages + read-receipt updates
      const channel = supabase
        .channel(`admin-guidance-messages-${selectedSession.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'guidance_messages',
            filter: `session_id=eq.${selectedSession.id}`
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              setMessages(prev => [...prev, payload.new as ChatMessage]);
              return;
            }
            if (payload.eventType === 'UPDATE') {
              setMessages(prev => prev.map(m => (m.id === payload.new.id ? (payload.new as ChatMessage) : m)));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('guidance_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark user messages as read
      await supabase
        .from('guidance_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('sender_type', 'user')
        .eq('is_read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: string) => {
    try {
      // First get the session to have user_id for push notification
      const { data: sessionData } = await supabase
        .from('guidance_sessions')
        .select('id, user_id, topic, scheduled_at')
        .eq('id', sessionId)
        .single();

      const updateData: Record<string, unknown> = { 
        status: newStatus,
        admin_id: user?.id
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('guidance_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, ...updateData } as GuidanceSession : s
      ));

      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { ...prev, ...updateData } as GuidanceSession : null);
      }

      toast.success(`Session marked as ${newStatus}`);

      // Send push notification for session status change
      if (sessionData) {
        try {
          await supabase.functions.invoke('send-session-push', {
            body: {
              session: { ...sessionData, status: newStatus },
              event: newStatus,
            },
          });
        } catch (pushErr) {
          console.error('Failed to send session push:', pushErr);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('guidance_messages')
        .insert({
          session_id: selectedSession.id,
          sender_id: user.id,
          sender_type: 'admin',
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-primary border-primary"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-success border-success"><Video className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-muted-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      session.session_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getUnreadCount = (sessionId: string) => {
    // This would require a separate query - simplified for now
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Chat view when session is selected
  if (selectedSession) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold">{selectedSession.topic}</h2>
              {getStatusBadge(selectedSession.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedSession.user_name || selectedSession.user_email} • {selectedSession.session_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select 
              value={selectedSession.status} 
              onValueChange={(v) => handleUpdateStatus(selectedSession.id, v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Session Details */}
        {selectedSession.description && (
          <div className="py-3 px-4 bg-white/5 rounded-lg my-2 text-sm">
            <span className="text-muted-foreground">Description: </span>
            {selectedSession.description}
          </div>
        )}
        {selectedSession.preferred_date && (
          <div className="py-2 px-4 bg-primary/10 rounded-lg mb-2 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Preferred: {format(new Date(selectedSession.preferred_date), 'PPpp')}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Send a message to the user!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/10 border border-white/10'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[44px] max-h-32"
              rows={1}
            />
            <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          1-on-1 Guidance Sessions
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage user guidance requests, agents, and chat with users
        </p>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'pending').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'in_progress').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'completed').length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by session number, topic, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>All Sessions ({filteredSessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No guidance sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSession(session)}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{session.topic}</span>
                              {getStatusBadge(session.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {session.user_name || session.user_email} • {session.session_number}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <GuidanceCalendar 
            sessions={sessions} 
            onSelectSession={(session) => {
              const fullSession = sessions.find(s => s.id === session.id);
              if (fullSession) setSelectedSession(fullSession);
            }}
          />
        </TabsContent>

        <TabsContent value="agents">
          <AgentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuidanceManagementTab;
