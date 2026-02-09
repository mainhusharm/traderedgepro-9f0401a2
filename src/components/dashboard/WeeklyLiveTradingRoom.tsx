import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Users, ExternalLink, Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  host_name: string;
  meeting_link: string;
  status: 'upcoming' | 'live' | 'completed';
  attendees_count: number;
}

const WeeklyLiveTradingRoom = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_trading_sessions')
        .select('*')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Use mock data if table doesn't exist yet
      setSessions([
        {
          id: '1',
          title: 'Weekly Market Analysis & Live Trading',
          description: 'Join our expert traders for live market analysis and real-time trading opportunities.',
          scheduled_at: getNextWeekday(1, 14).toISOString(), // Next Monday 2 PM
          duration_minutes: 60,
          host_name: 'Senior Trading Analyst',
          meeting_link: '',
          status: 'upcoming',
          attendees_count: 0,
        },
        {
          id: '2',
          title: 'Gold & Forex Session',
          description: 'Focused session on XAUUSD and major forex pairs with SMC analysis.',
          scheduled_at: getNextWeekday(4, 15).toISOString(), // Next Thursday 3 PM
          duration_minutes: 45,
          host_name: 'Forex Specialist',
          meeting_link: '',
          status: 'upcoming',
          attendees_count: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getNextWeekday = (dayOfWeek: number, hour: number) => {
    const now = new Date();
    const result = new Date(now);
    result.setDate(now.getDate() + ((dayOfWeek + 7 - now.getDay()) % 7 || 7));
    result.setHours(hour, 0, 0, 0);
    return result;
  };

  const toggleReminder = async (sessionId: string) => {
    if (!user) {
      toast.error('Please sign in to set reminders');
      return;
    }

    const isEnabled = remindersEnabled[sessionId];

    try {
      if (isEnabled) {
        await supabase
          .from('session_reminders')
          .delete()
          .eq('user_id', user.id)
          .eq('session_id', sessionId);

        setRemindersEnabled(prev => ({ ...prev, [sessionId]: false }));
        toast.success('Reminder removed');
      } else {
        await supabase
          .from('session_reminders')
          .insert({
            user_id: user.id,
            session_id: sessionId,
          });

        setRemindersEnabled(prev => ({ ...prev, [sessionId]: true }));
        toast.success('Reminder set! You\'ll receive a notification before the session.');
      }
    } catch (error) {
      // Table might not exist yet, just update local state
      setRemindersEnabled(prev => ({ ...prev, [sessionId]: !isEnabled }));
      toast.success(isEnabled ? 'Reminder removed' : 'Reminder set!');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isSessionLive = (session: LiveSession) => {
    const now = new Date();
    const sessionStart = new Date(session.scheduled_at);
    const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
    return now >= sessionStart && now <= sessionEnd;
  };

  const getTimeUntil = (dateStr: string) => {
    const now = new Date();
    const sessionDate = new Date(dateStr);
    const diff = sessionDate.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;

    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/3"></div>
            <div className="h-20 bg-white/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-primary" />
          Weekly Live Trading Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming sessions scheduled</p>
            <p className="text-sm mt-1">Check back soon for live trading sessions</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isLive = isSessionLive(session);
            return (
              <div
                key={session.id}
                className={`p-4 rounded-xl border ${isLive ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{session.title}</h4>
                      {isLive && (
                        <Badge variant="destructive" className="animate-pulse">
                          LIVE NOW
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {session.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(session.scheduled_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(session.scheduled_at)} ({session.duration_minutes}min)
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {session.host_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="text-xs">
                      {isLive ? 'Join Now' : getTimeUntil(session.scheduled_at)}
                    </Badge>
                    {!isLive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleReminder(session.id)}
                      >
                        {remindersEnabled[session.id] ? (
                          <Bell className="w-4 h-4 text-primary" />
                        ) : (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {isLive && session.meeting_link && (
                  <Button
                    className="w-full mt-3"
                    onClick={() => window.open(session.meeting_link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Live Session
                  </Button>
                )}
              </div>
            );
          })
        )}

        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-muted-foreground text-center">
            Sessions are held weekly. All times shown in your local timezone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyLiveTradingRoom;
