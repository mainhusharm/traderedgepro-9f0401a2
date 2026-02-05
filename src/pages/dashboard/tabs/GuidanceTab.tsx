import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Video,
  Sparkles,
  CalendarDays,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';
import { format } from 'date-fns';
import GuidanceCalendar from '@/components/dashboard/GuidanceCalendar';
import ExpertAvailability from '@/components/dashboard/ExpertAvailability';
import GoogleCalendarSync, { GoogleCalendarCard } from '@/components/dashboard/GoogleCalendarSync';
import SmartBookingSystem from '@/components/dashboard/SmartBookingSystem';
import SessionRatingModal from '@/components/dashboard/SessionRatingModal';
import { useExpertNotifications } from '@/hooks/useExpertNotifications';

interface GuidanceSession {
  id: string;
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

const TOPICS = [
  'Risk Management Strategy',
  'Trading Psychology',
  'Technical Analysis',
  'Prop Firm Rules & Compliance',
  'Trade Journal Review',
  'Account Recovery Plan',
  'Strategy Optimization',
  'Other'
];

const GuidanceTab = () => {
  const { user } = useAuth();
  const features = usePlanFeatures();
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GuidanceSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; session: GuidanceSession | null }>({ isOpen: false, session: null });
  const [userRatings, setUserRatings] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; session: GuidanceSession | null }>({
    open: false,
    session: null,
  });
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Enable expert notifications
  useExpertNotifications();

  // Common timezones
  const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  ];

  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    preferred_date: '',
    preferred_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchUserRatings();
    }
  }, [user]);

  const fetchUserRatings = async () => {
    if (!user) return;
    try {
      const { data } = await (supabase
        .from('session_ratings' as any)
        .select('session_id')
        .eq('user_id', user.id) as any);
      
      if (data) {
        setUserRatings(new Set(data.map((r: any) => r.session_id)));
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
      
      // Subscribe to new messages + read-receipt updates
      const channel = supabase
        .channel(`guidance-messages-${selectedSession.id}`)
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

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('guidance_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('guidance_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages from admin/agent as read
      await supabase
        .from('guidance_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .neq('sender_type', 'user')
        .eq('is_read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const generateSessionNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GS-${timestamp}-${random}`;
  };

  const handleCreateSession = async () => {
    if (!formData.topic) {
      toast.error('Please select a topic');
      return;
    }

    setIsSubmitting(true);
    try {
      const preferredDate = formData.preferred_date && formData.preferred_time
        ? new Date(`${formData.preferred_date}T${formData.preferred_time}`).toISOString()
        : null;

      const { data, error } = await supabase
        .from('guidance_sessions')
        .insert({
          user_id: user?.id,
          session_number: generateSessionNumber(),
          topic: formData.topic,
          description: formData.description || null,
          preferred_date: preferredDate,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setIsDialogOpen(false);
      setFormData({ topic: '', description: '', preferred_date: '', preferred_time: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
      toast.success('Session request submitted! Our expert will contact you soon.');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReschedule = (session: GuidanceSession) => {
    const current = session.scheduled_at ? new Date(session.scheduled_at) : null;
    setRescheduleForm({
      date: current ? format(current, 'yyyy-MM-dd') : '',
      time: current ? format(current, 'HH:mm') : '',
    });
    setRescheduleModal({ open: true, session });
  };

  const handleReschedule = async () => {
    if (!rescheduleModal.session) return;
    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast.error('Please select a date and time');
      return;
    }

    setIsRescheduling(true);
    try {
      const scheduledAt = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`).toISOString();

      const { data, error } = await supabase
        .from('guidance_sessions')
        .update({ scheduled_at: scheduledAt })
        .eq('id', rescheduleModal.session.id)
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => prev.map(s => (s.id === data.id ? data : s)));
      if (selectedSession?.id === data.id) setSelectedSession(data);

      setRescheduleModal({ open: false, session: null });
      toast.success('Session rescheduled');
    } catch (error) {
      console.error('Error rescheduling session:', error);
      toast.error('Failed to reschedule session');
    } finally {
      setIsRescheduling(false);
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
          sender_type: 'user',
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

  const hasAccess = features.personalGuidance;

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="glass-card max-w-lg text-center p-12">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock 1-on-1 Expert Guidance</h2>
          <p className="text-muted-foreground mb-6">
            Get personalized trading guidance from our expert team. Available on Pro and Enterprise plans.
          </p>
          <ul className="text-left space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success" />
              Personal strategy review sessions
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success" />
              Direct chat with trading experts
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success" />
              Customized improvement plans
            </li>
          </ul>
          <Button className="btn-glow" onClick={() => window.location.href = '/membership'}>
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </Card>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <h2 className="font-bold">{selectedSession.topic}</h2>
              {getStatusBadge(selectedSession.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedSession.session_number} • Created {format(new Date(selectedSession.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          {/* Google Calendar Sync */}
          <div className="flex items-center gap-2">
            <GoogleCalendarSync session={selectedSession} />
            {selectedSession.status === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openReschedule(selectedSession)}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/10 border border-white/10'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${msg.sender_type === 'user' ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'}`}>
                      <span className="text-xs">{format(new Date(msg.created_at), 'h:mm a')}</span>
                      {msg.sender_type === 'user' && (
                        <span className="text-xs flex items-center gap-0.5">
                          {msg.is_read ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Seen</span>
                            </>
                          ) : (
                            <span>Sent</span>
                          )}
                        </span>
                      )}
                    </div>
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
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
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
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            1-on-1 Expert Guidance
          </h1>
          <p className="text-muted-foreground">
            Book personalized sessions with our trading experts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-glow">
              <Plus className="w-4 h-4 mr-2" />
              Book Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book Expert Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Topic</Label>
                <Select value={formData.topic} onValueChange={(v) => setFormData({ ...formData, topic: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((topic) => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Briefly describe what you'd like to discuss..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Your Timezone</Label>
                <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  All times will be shown in your selected timezone
                </p>
              </div>
              <Button className="w-full" onClick={handleCreateSession} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expert Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpertAvailability />
        <GoogleCalendarCard />
      </div>

      {/* Tabs for Sessions, Calendar, and Booking */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="booking" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Book Slot
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="booking">
          <SmartBookingSystem onBookingComplete={() => fetchSessions()} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'pending').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'completed').length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Sessions</CardTitle>
              <CardDescription>Click on a session to view messages</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions yet. Book your first expert session!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div 
                          className="flex items-center gap-4 flex-1"
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{session.topic}</span>
                              {getStatusBadge(session.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {session.session_number} • {format(new Date(session.created_at), 'MMM d, yyyy')}
                              {session.scheduled_at && (
                                <span className="ml-2 text-primary">
                                  Scheduled: {format(new Date(session.scheduled_at), 'MMM d, h:mm a')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.status === 'confirmed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReschedule(session);
                              }}
                            >
                              <CalendarDays className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Cancel for pending/confirmed sessions */}
                          {['pending', 'confirmed'].includes(session.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm('Are you sure you want to cancel this session?')) return;
                                await supabase
                                  .from('guidance_sessions')
                                  .update({ status: 'cancelled' })
                                  .eq('id', session.id);
                                fetchSessions();
                                toast.success('Session cancelled');
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {session.status === 'completed' && !userRatings.has(session.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRatingModal({ isOpen: true, session });
                              }}
                              className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10"
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Rate
                            </Button>
                          )}
                          {session.status === 'completed' && userRatings.has(session.id) && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                              Rated
                            </Badge>
                          )}
                          <ChevronRight 
                            className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                            onClick={() => setSelectedSession(session)}
                          />
                        </div>
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
      </Tabs>
    </div>

    {/* Reschedule Modal */}
    <Dialog
      open={rescheduleModal.open}
      onOpenChange={(open) => setRescheduleModal(prev => ({ ...prev, open }))}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRescheduleModal({ open: false, session: null })}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={isRescheduling}>
              {isRescheduling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Rating Modal */}
    {ratingModal.session && (
      <SessionRatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, session: null })}
        sessionId={ratingModal.session.id}
        sessionNumber={ratingModal.session.session_number}
        topic={ratingModal.session.topic}
        agentId={ratingModal.session.admin_id}
        onRatingSubmitted={() => {
          fetchUserRatings();
        }}
      />
    )}
  </>
  );
};

export default GuidanceTab;
