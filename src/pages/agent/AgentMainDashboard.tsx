import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  Loader2,
  LogOut,
  Circle,
  Calendar,
  ArrowLeft,
  Power,
  CalendarDays,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  CalendarClock,
  Star,
  Bell,
  X,
  UserCheck
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { callEdgeFunction } from '@/config/api';
import { format, addDays, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import AgentPerformanceDashboard from '@/components/agent/AgentPerformanceDashboard';
import AgentVIPSignals from '@/components/agent/AgentVIPSignals';
import ClientManagement from '@/components/agent/ClientManagement';
import AgentSignalManagement from '@/components/agent/AgentSignalManagement';
import AgentOverviewTab from '@/components/agent/AgentOverviewTab';
import AgentBotSignalsReview from '@/components/agent/AgentBotSignalsReview';
import AgentManagerDM from '@/components/agent/AgentManagerDM';
import AgentPaymentSetup from '@/components/agent/AgentPaymentSetup';
import { useAgentPushNotifications } from '@/hooks/useAgentPushNotifications';

interface GuidanceSession {
  id: string;
  session_number: string;
  topic: string;
  description: string | null;
  status: string;
  user_id: string;
  scheduled_at: string | null;
  preferred_date: string | null;
  created_at: string;
  feedback_requested?: boolean;
  feedback_requested_at?: string | null;
}

interface AgentNotification {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  message: string;
  session_id: string | null;
  is_read: boolean;
  created_at: string;
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

interface AgentPermissions {
  can_chat: boolean;
  can_schedule: boolean;
  can_view_all_sessions: boolean;
  can_send_signals: boolean;
}

interface AgentAvailability {
  [day: string]: { start: string; end: string } | null;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100'
];

const TRADE_TYPES = [
  { value: 'scalp', label: 'Scalp Trade' },
  { value: 'intraday', label: 'Intraday' },
  { value: 'swing', label: 'Swing Trade' },
  { value: 'position', label: 'Position' },
];

const EXPERT_COUNTS = [1, 2, 3, 4];

const AgentMainDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'sessions';
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GuidanceSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'sessions';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Permissions
  const [permissions, setPermissions] = useState<AgentPermissions>({
    can_chat: true,
    can_schedule: true,
    can_view_all_sessions: false,
    can_send_signals: false
  });

  // Scheduling state
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [schedulingSession, setSchedulingSession] = useState<GuidanceSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Availability state
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [availability, setAvailability] = useState<AgentAvailability>({
    Monday: { start: '09:00', end: '17:00' },
    Tuesday: { start: '09:00', end: '17:00' },
    Wednesday: { start: '09:00', end: '17:00' },
    Thursday: { start: '09:00', end: '17:00' },
    Friday: { start: '09:00', end: '17:00' },
    Saturday: null,
    Sunday: null
  });

  // Signal sending state
  const [isSignalDialogOpen, setIsSignalDialogOpen] = useState(false);
  const [signalData, setSignalData] = useState({
    symbol: 'EURUSD',
    signal_type: 'BUY' as 'BUY' | 'SELL',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    ai_reasoning: '',
    is_vip: false,
    trade_type: 'intraday',
    confidence_score: '75',
    experts_count: '1',
  });
  const [isSubmittingSignal, setIsSubmittingSignal] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Push notifications
  const { permission, requestPermission, showNotification, isSupported } = useAgentPushNotifications(agentId);

  // Load agent ID from session and sync online status
  useEffect(() => {
    const init = async () => {
      // Check for new session-based auth first
      const agentInfoStr = sessionStorage.getItem('agent_info');
      if (agentInfoStr) {
        try {
          const agentInfo = JSON.parse(agentInfoStr);
          if (agentInfo?.id) {
            setAgentId(agentInfo.id);
            sessionStorage.setItem('agent_id', agentInfo.id);
            if (agentInfo.permissions) {
              setPermissions(agentInfo.permissions);
              sessionStorage.setItem('agent_permissions', JSON.stringify(agentInfo.permissions));
            }
            loadAgentOnlineStatus(agentInfo.id);
            loadAgentAvailability(agentInfo.id);
            fetchNotifications(agentInfo.id);
            return;
          }
        } catch {
          // Fall through to legacy check
        }
      }

      // Legacy fallback: check for old session storage keys
      const storedAgentId = sessionStorage.getItem('agent_id');
      const storedAgentToken = sessionStorage.getItem('agent_token');

      if (storedAgentId) {
        setAgentId(storedAgentId);
        loadAgentOnlineStatus(storedAgentId);
        loadAgentAvailability(storedAgentId);
        fetchNotifications(storedAgentId);
      } else if (storedAgentToken) {
        // Fallback: resolve agent_id from invitation token
        const { data: agent, error } = await supabase
          .from('admin_agents')
          .select('id')
          .eq('invitation_token', storedAgentToken)
          .single();

        if (!error && agent?.id) {
          sessionStorage.setItem('agent_id', agent.id);
          setAgentId(agent.id);
          loadAgentOnlineStatus(agent.id);
          loadAgentAvailability(agent.id);
          fetchNotifications(agent.id);
        }
      }

      // Request push notification permission
      if (isSupported && permission === 'default') {
        requestPermission();
      }
    };

    void init();
  }, [isSupported, permission]);

  // Auto-set online when entering dashboard and heartbeat to stay online
  useEffect(() => {
    if (!agentId) return;

    // Set online immediately when entering dashboard
    const setOnline = async () => {
      await supabase
        .from('admin_agents')
        .update({ 
          is_online: true, 
          last_seen_at: new Date().toISOString() 
        })
        .eq('id', agentId);
      setIsOnline(true);
    };
    setOnline();

    // Heartbeat every 30 seconds to update last_seen_at
    const heartbeatInterval = setInterval(async () => {
      if (isOnline) {
        await supabase
          .from('admin_agents')
          .update({ 
            is_online: true, 
            last_seen_at: new Date().toISOString() 
          })
          .eq('id', agentId);
      }
    }, 30000);

    // Cleanup: set offline when leaving
    return () => {
      clearInterval(heartbeatInterval);
      // Set offline on unmount
      supabase
        .from('admin_agents')
        .update({ is_online: false })
        .eq('id', agentId);
    };
  }, [agentId]);

  // Set agent offline when browser/tab closes
  useEffect(() => {
    if (!agentId) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline update when page unloads
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/admin_agents?id=eq.${agentId}`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'return=minimal'
      };
      const body = JSON.stringify({ is_online: false });
      
      // sendBeacon doesn't support headers, so use fetch with keepalive
      fetch(url, {
        method: 'PATCH',
        headers,
        body,
        keepalive: true
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized - update last_seen but stay "online"
        supabase
          .from('admin_agents')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', agentId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [agentId, isOnline]);

  const loadAgentOnlineStatus = async (id: string) => {
    const { data } = await supabase
      .from('admin_agents')
      .select('is_online')
      .eq('id', id)
      .single();
    
    if (data) {
      setIsOnline(data.is_online || false);
    }
  };

  const loadAgentAvailability = async (id: string) => {
    // Use type assertion since agent_availability table was just created
    const { data } = await supabase
      .from('agent_availability' as any)
      .select('*')
      .eq('agent_id', id) as { data: Array<{
        agent_id: string;
        day_of_week: string;
        is_available: boolean;
        start_time: string | null;
        end_time: string | null;
      }> | null };
    
    if (data && data.length > 0) {
      const newAvailability: AgentAvailability = { ...availability };
      data.forEach((slot) => {
        if (slot.is_available && slot.start_time && slot.end_time) {
          newAvailability[slot.day_of_week] = {
            start: slot.start_time.slice(0, 5),
            end: slot.end_time.slice(0, 5)
          };
        } else {
          newAvailability[slot.day_of_week] = null;
        }
      });
      setAvailability(newAvailability);
    }
  };

  const fetchNotifications = async (id: string) => {
    const { data } = await supabase
      .from('agent_notifications' as any)
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(20) as { data: AgentNotification[] | null };
    
    if (data) {
      setNotifications(data);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    await supabase
      .from('agent_notifications' as any)
      .update({ is_read: true })
      .eq('id', notificationId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const markAllNotificationsRead = async () => {
    if (!agentId) return;
    
    await supabase
      .from('agent_notifications' as any)
      .update({ is_read: true })
      .eq('agent_id', agentId)
      .eq('is_read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const updateOnlineStatus = async (online: boolean) => {
    if (!agentId) return;
    
    await supabase
      .from('admin_agents')
      .update({ 
        is_online: online, 
        last_seen_at: new Date().toISOString() 
      })
      .eq('id', agentId);
  };

  useEffect(() => {
    fetchSessions();
    loadAgentPermissions();
    
    const sessionsChannel = supabase
      .channel('agent-sessions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guidance_sessions' },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  // Subscribe to notifications in real-time
  useEffect(() => {
    if (!agentId) return;

    const notificationsChannel = supabase
      .channel(`agent-notifications-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_notifications',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          const newNotif = payload.new as AgentNotification;
          setNotifications(prev => [newNotif, ...prev]);
          toast.info(newNotif.title, { description: newNotif.message.slice(0, 100) });
          
          // Show browser push notification
          showNotification(newNotif.title, {
            body: newNotif.message,
            tag: newNotif.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [agentId]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
      
      const channel = supabase
        .channel(`agent-messages-${selectedSession.id}`)
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

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAgentPermissions = async () => {
    // Load permissions from session storage (set during login)
    const stored = sessionStorage.getItem('agent_permissions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPermissions(parsed);
      } catch {
        // Use defaults
      }
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('guidance_sessions')
        .select('*')
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

      // Mark user messages as read (through agent-api so it works even without user auth)
      await callEdgeFunction('agent-api', {
        action: 'mark_read_user_messages',
        data: {
          agentToken: sessionStorage.getItem('agent_token'),
          agentId,
          sessionId,
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchBookedSlots = async (date: Date) => {
    try {
      const startOfSelectedDay = startOfDay(date);
      const endOfSelectedDay = startOfDay(addDays(date, 1));

      const { data, error } = await supabase
        .from('guidance_sessions')
        .select('scheduled_at')
        .gte('scheduled_at', startOfSelectedDay.toISOString())
        .lt('scheduled_at', endOfSelectedDay.toISOString())
        .not('scheduled_at', 'is', null);

      if (error) throw error;

      const bookedTimes = (data || []).map(s => {
        const d = new Date(s.scheduled_at!);
        return format(d, 'HH:mm');
      });

      setBookedSlots(bookedTimes);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;
    if (!agentId) {
      toast.error('Agent session not initialized. Please refresh and log in again.');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await callEdgeFunction('agent-api', {
        action: 'send_message',
        data: {
          agentToken: sessionStorage.getItem('agent_token'),
          agentId,
          sessionId: selectedSession.id,
          content: newMessage.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      // First get the session to have user_id for push notification
      const { data: sessionData } = await supabase
        .from('guidance_sessions')
        .select('id, user_id, topic, scheduled_at, assigned_agent_id')
        .eq('id', sessionId)
        .single();

      const { error } = await supabase
        .from('guidance_sessions')
        .update({ 
          status,
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success(`Session ${status.replace('_', ' ')}`);
      fetchSessions();
      
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { ...prev, status } : null);
      }

      // Update agent stats when session is completed
      if (status === 'completed' && agentId) {
        await updateAgentSessionStats(agentId);
      }

      // Send push notification for session status change
      if (sessionData) {
        try {
          await callEdgeFunction('send-session-push', {
            session: { ...sessionData, status },
            event: status,
          });
        } catch (pushErr) {
          console.error('Failed to send session push:', pushErr);
        }
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  // Helper to update agent stats for sessions
  const updateAgentSessionStats = async (agentId: string) => {
    try {
      // Count completed sessions for this agent
      const { data: sessions } = await supabase
        .from('guidance_sessions')
        .select('id')
        .eq('assigned_agent_id', agentId)
        .eq('status', 'completed');

      const completedCount = sessions?.length || 0;

      // Check if stats exist
      const { data: existing } = await supabase
        .from('agent_stats')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (existing) {
        await supabase
          .from('agent_stats')
          .update({
            clients_handled: completedCount,
            updated_at: new Date().toISOString()
          })
          .eq('agent_id', agentId);
      } else {
        await supabase
          .from('agent_stats')
          .insert({
            agent_id: agentId,
            clients_handled: completedCount,
            total_signals_posted: 0,
            winning_signals: 0,
            losing_signals: 0,
            breakeven_signals: 0
          });
      }
    } catch (err) {
      console.error('Error updating agent session stats:', err);
    }
  };

  const handleScheduleSession = async () => {
    if (!schedulingSession || !selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

    if (isBefore(scheduledAt, new Date())) {
      toast.error('Cannot schedule in the past');
      return;
    }

    try {
      const { error } = await supabase
        .from('guidance_sessions')
        .update({ 
          scheduled_at: scheduledAt.toISOString(),
          status: 'confirmed'
        })
        .eq('id', schedulingSession.id);

      if (error) throw error;

      toast.success('Session scheduled successfully!');
      setIsScheduleDialogOpen(false);
      setSchedulingSession(null);
      setSelectedDate(undefined);
      setSelectedTime('');
      fetchSessions();
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error('Failed to schedule session');
    }
  };

  const handleSendSignal = async () => {
    if (!signalData.entry_price || !signalData.stop_loss || !signalData.take_profit) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingSignal(true);
    try {
      const signalPayload = {
        symbol: signalData.symbol,
        signal_type: signalData.signal_type,
        entry_price: parseFloat(signalData.entry_price),
        stop_loss: parseFloat(signalData.stop_loss),
        take_profit: parseFloat(signalData.take_profit),
        ai_reasoning: signalData.ai_reasoning || null,
        is_public: true,
        is_vip: signalData.is_vip,
        trade_type: signalData.trade_type,
        confidence_score: parseInt(signalData.confidence_score) || 75,
        experts_count: signalData.is_vip ? (parseInt(signalData.experts_count) || 1) : null
      };

      const { error } = await supabase
        .from('signals')
        .insert(signalPayload);

      if (error) throw error;

      // Send email notifications to subscribed users
      try {
        await callEdgeFunction('send-signal-notification', signalPayload);
        
        // If VIP, also send VIP push notifications
        if (signalData.is_vip) {
          await callEdgeFunction('send-vip-signal-push', signalPayload);
        }
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
      }

      toast.success(signalData.is_vip ? 'VIP Signal sent!' : 'Signal sent successfully!');
      setIsSignalDialogOpen(false);
      setSignalData({
        symbol: 'EURUSD',
        signal_type: 'BUY',
        entry_price: '',
        stop_loss: '',
        take_profit: '',
        ai_reasoning: '',
        is_vip: false,
        trade_type: 'intraday',
        confidence_score: '75',
        experts_count: '1',
      });
    } catch (error) {
      console.error('Error sending signal:', error);
      toast.error('Failed to send signal');
    } finally {
      setIsSubmittingSignal(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!agentId) {
      toast.error('Agent ID not found');
      return;
    }

    try {
      // Delete existing availability for this agent (use type assertion)
      await (supabase
        .from('agent_availability' as any)
        .delete()
        .eq('agent_id', agentId) as any);

      // Insert new availability
      const availabilityRecords = DAYS_OF_WEEK.map(day => ({
        agent_id: agentId,
        day_of_week: day,
        is_available: availability[day] !== null,
        start_time: availability[day]?.start ? `${availability[day]!.start}:00` : null,
        end_time: availability[day]?.end ? `${availability[day]!.end}:00` : null
      }));

      const { error } = await (supabase
        .from('agent_availability' as any)
        .insert(availabilityRecords) as any);

      if (error) throw error;

      toast.success('Availability saved!');
      setIsAvailabilityOpen(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    }
  };

  const handleLogout = async () => {
    // Set agent offline before logging out
    if (agentId) {
      await supabase
        .from('admin_agents')
        .update({ is_online: false })
        .eq('id', agentId);
    }
    
    // Clear all session storage
    sessionStorage.removeItem('agent_verified');
    sessionStorage.removeItem('agent_verified_at');
    sessionStorage.removeItem('agent_permissions');
    sessionStorage.removeItem('agent_id');
    sessionStorage.removeItem('agent_session_token');
    sessionStorage.removeItem('agent_info');
    navigate('/agent');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-primary border-primary"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-success border-success"><Circle className="w-3 h-3 mr-1 fill-success" />Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-muted-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const activeSessions = sessions.filter(s => ['confirmed', 'in_progress'].includes(s.status));
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/[0.08] bg-background/50 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Agent Portal</h3>
                <p className="text-xs text-muted-foreground">Trading Expert</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Notifications Bell */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl z-50"
                    >
                      <div className="p-3 border-b border-white/10 flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllNotificationsRead}>
                              Mark all read
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNotifications(false)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="max-h-72">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                className={`p-3 hover:bg-white/5 cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                                onClick={() => {
                                  markNotificationRead(notif.id);
                                  if (notif.session_id) {
                                    const session = sessions.find(s => s.id === notif.session_id);
                                    if (session) {
                                      setSelectedSession(session);
                                      handleTabChange('sessions');
                                    }
                                  }
                                  setShowNotifications(false);
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    notif.type === 'rating_received' ? 'bg-yellow-500' : 'bg-primary'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{notif.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                                    </p>
                                  </div>
                                  {!notif.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Online Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Power className={`w-4 h-4 ${isOnline ? 'text-success' : 'text-muted-foreground'}`} />
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
          </div>
        </div>

        {/* Quick Actions based on permissions */}
        <div className="p-4 border-b border-white/[0.08] space-y-2">
          {permissions.can_send_signals && (
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setIsSignalDialogOpen(true)}
            >
              <Activity className="w-4 h-4 mr-2 text-primary" />
              Send Signal
            </Button>
          )}
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => setIsAvailabilityOpen(true)}
          >
            <CalendarClock className="w-4 h-4 mr-2 text-primary" />
            Set Availability
          </Button>
        </div>

        {/* Stats */}
        {permissions.can_chat && (
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-white/[0.08]">
            <div className="text-center p-2 rounded-lg bg-warning/10">
              <p className="text-lg font-bold text-warning">{pendingSessions.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-primary/10">
              <p className="text-lg font-bold text-primary">{activeSessions.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-success/10">
              <p className="text-lg font-bold text-success">{completedSessions.length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            {permissions.can_chat && <TabsTrigger value="sessions" className="flex-1">Sessions</TabsTrigger>}
            {permissions.can_send_signals && <TabsTrigger value="signals" className="flex-1">Signals</TabsTrigger>}
            {permissions.can_send_signals && <TabsTrigger value="bot-review" className="flex-1">Bot Review</TabsTrigger>}
            {permissions.can_send_signals && <TabsTrigger value="vip" className="flex-1">VIP</TabsTrigger>}
            <TabsTrigger value="clients" className="flex-1">Clients</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
            <TabsTrigger value="manager-dm" className="flex-1">Manager</TabsTrigger>
          </TabsList>

          {permissions.can_chat && (
            <TabsContent value="sessions" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-[calc(100vh-420px)]">
                <div className="p-2 space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No sessions yet
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          selectedSession?.id === session.id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate">{session.topic}</span>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{session.session_number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(session.created_at), 'MMM d, h:mm a')}</p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {permissions.can_schedule && (
            <TabsContent value="schedule" className="flex-1 overflow-hidden m-0 p-4">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Upcoming Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sessions
                      .filter(s => s.scheduled_at && s.status !== 'completed')
                      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                      .slice(0, 5)
                      .map((session) => (
                        <div key={session.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <div className="text-center">
                            <p className="text-sm font-bold">{format(new Date(session.scheduled_at!), 'HH:mm')}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{session.topic}</p>
                            <p className="text-xs text-muted-foreground">{session.session_number}</p>
                          </div>
                        </div>
                      ))}
                    {sessions.filter(s => s.scheduled_at && s.status !== 'completed').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No scheduled sessions</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {permissions.can_send_signals && (
            <TabsContent value="vip" className="flex-1 overflow-hidden m-0 p-4">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    VIP Signals Management
                  </CardTitle>
                  <CardDescription>View and manage signals from the main panel</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          )}

        </Tabs>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        {activeTab === 'overview' ? (
          <div className="p-6">
            <AgentOverviewTab />
          </div>
        ) : activeTab === 'signals' && agentId ? (
          <div className="p-6">
            <AgentSignalManagement agentId={agentId} />
          </div>
        ) : activeTab === 'stats' ? (
          <div className="p-6">
            <AgentPerformanceDashboard />
          </div>
        ) : activeTab === 'clients' && agentId ? (
          <div className="p-6">
            <ClientManagement agentId={agentId} />
          </div>
        ) : activeTab === 'vip' && permissions.can_send_signals ? (
          <div className="p-6">
            <AgentVIPSignals />
          </div>
        ) : activeTab === 'bot-review' && permissions.can_send_signals && agentId ? (
          <div className="p-6">
            <AgentBotSignalsReview agentId={agentId} />
          </div>
        ) : activeTab === 'manager-dm' && agentId ? (
          <div className="p-6 space-y-6">
            <AgentManagerDM agentId={agentId} isFullPage={true} />
            <AgentPaymentSetup agentId={agentId} />
          </div>
        ) : permissions.can_chat && selectedSession ? (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-background/50">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)} className="lg:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{selectedSession.topic}</h2>
                    {getStatusBadge(selectedSession.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedSession.session_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedSession.status === 'pending' && permissions.can_schedule && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSchedulingSession(selectedSession);
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                    <Button size="sm" onClick={() => updateSessionStatus(selectedSession.id, 'confirmed')}>
                      Confirm
                    </Button>
                  </>
                )}
                {selectedSession.status === 'confirmed' && (
                  <Button size="sm" onClick={() => updateSessionStatus(selectedSession.id, 'in_progress')}>
                    Start Session
                  </Button>
                )}
                {selectedSession.status === 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={() => updateSessionStatus(selectedSession.id, 'completed')}>
                    Complete
                  </Button>
                )}
              </div>
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
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
                      className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.sender_type === 'user'
                            ? 'bg-white/10 border border-white/10'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                          {msg.sender_type !== 'user' && (
                            <span className="ml-2">
                              {msg.is_read ? 'Seen' : 'Sent'}
                            </span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-white/[0.08] bg-background/50">
              <div className="flex flex-col gap-2 max-w-3xl mx-auto">
                {selectedSession.status === 'completed' && !selectedSession.feedback_requested && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="self-start mb-2"
                    onClick={async () => {
                      try {
                        // Update session to mark feedback as requested
                        await (supabase
                          .from('guidance_sessions' as any)
                          .update({ 
                            feedback_requested: true,
                            feedback_requested_at: new Date().toISOString()
                          } as any)
                          .eq('id', selectedSession.id) as any);
                        
                        // Send the feedback request message (through agent-api)
                        await supabase.functions.invoke('agent-api', {
                          body: {
                            action: 'send_message',
                            data: {
                              agentToken: sessionStorage.getItem('agent_token'),
                              agentId,
                              sessionId: selectedSession.id,
                              content: '⭐ We hope you found this session valuable! Please take a moment to rate your experience and share any feedback. Your input helps us improve our service. You can rate this session from your Guidance tab in the dashboard.',
                            },
                          },
                        });
                        
                        // Update local state
                        setSelectedSession(prev => prev ? { ...prev, feedback_requested: true } : null);
                        fetchSessions();
                        
                        toast.success('Feedback request sent to user');
                      } catch (error) {
                        console.error('Error sending feedback request:', error);
                        toast.error('Failed to send feedback request');
                      }
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Request Feedback
                  </Button>
                )}
                {selectedSession.status === 'completed' && selectedSession.feedback_requested && (
                  <Badge variant="outline" className="self-start mb-2 text-muted-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Feedback Requested
                  </Badge>
                )}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              {permissions.can_chat ? (
                <>
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Select a Session</h3>
                  <p className="text-sm">Choose a session from the sidebar to view messages</p>
                </>
              ) : permissions.can_send_signals ? (
                <>
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Signal Dashboard</h3>
                  <p className="text-sm mb-4">You have access to send trading signals</p>
                  <Button onClick={() => setIsSignalDialogOpen(true)}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Send New Signal
                  </Button>
                </>
              ) : (
                <>
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Agent Portal</h3>
                  <p className="text-sm">Contact admin for additional permissions</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {schedulingSession && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-medium">{schedulingSession.topic}</p>
                <p className="text-sm text-muted-foreground">{schedulingSession.session_number}</p>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Select Date</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="rounded-md border border-white/10"
              />
            </div>

            {selectedDate && (
              <div>
                <Label className="mb-2 block">Select Time Slot</Label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedTime === slot;
                    
                    return (
                      <button
                        key={slot}
                        onClick={() => !isBooked && setSelectedTime(slot)}
                        disabled={isBooked}
                        className={`p-2 text-sm rounded-lg border transition-all ${
                          isBooked
                            ? 'bg-muted/20 text-muted-foreground border-transparent cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleScheduleSession} disabled={!selectedDate || !selectedTime}>
              Confirm Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Set Your Availability
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure your working hours for each day of the week.
            </p>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                  <div className="w-24">
                    <Switch
                      checked={availability[day] !== null}
                      onCheckedChange={(checked) => {
                        setAvailability(prev => ({
                          ...prev,
                          [day]: checked ? { start: '09:00', end: '17:00' } : null
                        }));
                      }}
                    />
                  </div>
                  <span className="w-24 font-medium">{day}</span>
                  {availability[day] ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Select
                        value={availability[day]?.start}
                        onValueChange={(value) => {
                          setAvailability(prev => ({
                            ...prev,
                            [day]: { ...prev[day]!, start: value }
                          }));
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={availability[day]?.end}
                        onValueChange={(value) => {
                          setAvailability(prev => ({
                            ...prev,
                            [day]: { ...prev[day]!, end: value }
                          }));
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Day off</span>
                  )}
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleSaveAvailability}>
              Save Availability
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signal Dialog */}
      <Dialog open={isSignalDialogOpen} onOpenChange={setIsSignalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Send Trading Signal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Symbol</Label>
                <Select value={signalData.symbol} onValueChange={(v) => setSignalData(prev => ({ ...prev, symbol: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYMBOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Direction</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={signalData.signal_type === 'BUY' ? 'default' : 'outline'}
                    className={`flex-1 ${signalData.signal_type === 'BUY' ? 'bg-success hover:bg-success/90' : ''}`}
                    onClick={() => setSignalData(prev => ({ ...prev, signal_type: 'BUY' }))}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Buy
                  </Button>
                  <Button
                    variant={signalData.signal_type === 'SELL' ? 'default' : 'outline'}
                    className={`flex-1 ${signalData.signal_type === 'SELL' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                    onClick={() => setSignalData(prev => ({ ...prev, signal_type: 'SELL' }))}
                  >
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Sell
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Entry Price</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.08500"
                value={signalData.entry_price}
                onChange={(e) => setSignalData(prev => ({ ...prev, entry_price: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stop Loss</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08200"
                  value={signalData.stop_loss}
                  onChange={(e) => setSignalData(prev => ({ ...prev, stop_loss: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Take Profit</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.09000"
                  value={signalData.take_profit}
                  onChange={(e) => setSignalData(prev => ({ ...prev, take_profit: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Trade Type</Label>
              <Select 
                value={signalData.trade_type} 
                onValueChange={(v) => setSignalData(prev => ({ ...prev, trade_type: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confidence Slider */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between">
                <span>Confidence</span>
                <span className="text-primary font-semibold">{signalData.confidence_score}%</span>
              </Label>
              <Slider
                value={[parseInt(signalData.confidence_score) || 75]}
                onValueChange={(value) => setSignalData(prev => ({ ...prev, confidence_score: value[0].toString() }))}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* VIP Toggle & Experts Count */}
            <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-gradient-to-r from-amber-500/5 to-purple-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${signalData.is_vip ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${signalData.is_vip ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                    VIP Signal
                  </span>
                </div>
                <Switch 
                  checked={signalData.is_vip} 
                  onCheckedChange={(checked) => setSignalData(prev => ({ ...prev, is_vip: checked }))}
                />
              </div>
              
              {signalData.is_vip && (
                <div className="pt-3 border-t border-white/10">
                  <Label className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4" />
                    Experts Reviewed
                  </Label>
                  <div className="flex gap-2">
                    {EXPERT_COUNTS.map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={signalData.experts_count === count.toString() ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${signalData.experts_count === count.toString() ? 'bg-primary' : ''}`}
                        onClick={() => setSignalData(prev => ({ ...prev, experts_count: count.toString() }))}
                      >
                        {count} Expert{count > 1 ? 's' : ''}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {signalData.experts_count} expert{parseInt(signalData.experts_count) > 1 ? 's' : ''} reviewed this signal
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Analysis (optional)</Label>
              <Input
                placeholder="Brief analysis or reasoning..."
                value={signalData.ai_reasoning}
                onChange={(e) => setSignalData(prev => ({ ...prev, ai_reasoning: e.target.value }))}
                className="mt-1"
              />
            </div>

            <Button className="w-full" onClick={handleSendSignal} disabled={isSubmittingSignal}>
              {isSubmittingSignal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {signalData.is_vip ? 'Send VIP Signal' : 'Send Signal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentMainDashboard;
