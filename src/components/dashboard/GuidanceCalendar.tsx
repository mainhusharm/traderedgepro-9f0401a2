import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GuidanceSession {
  id: string;
  session_number: string;
  topic: string;
  status: string;
  scheduled_at: string | null;
  preferred_date: string | null;
  user_name?: string;
  user_email?: string;
}

interface GuidanceCalendarProps {
  sessions: GuidanceSession[];
  onSelectSession?: (session: GuidanceSession) => void;
}

const GuidanceCalendar = ({ sessions, onSelectSession }: GuidanceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      const sessionDate = session.scheduled_at || session.preferred_date;
      if (!sessionDate) return false;
      return isSameDay(new Date(sessionDate), day);
    });
  };

  const selectedDaySessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 border-warning';
      case 'confirmed': return 'bg-primary/20 border-primary';
      case 'in_progress': return 'bg-success/20 border-success';
      case 'completed': return 'bg-muted/20 border-muted';
      case 'cancelled': return 'bg-destructive/20 border-destructive';
      default: return 'bg-muted/20 border-muted';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map(day => {
              const daySessions = getSessionsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square p-1 rounded-lg border border-transparent transition-all relative',
                    'hover:bg-white/10 hover:border-white/20',
                    isSelected && 'bg-primary/20 border-primary',
                    isToday && !isSelected && 'border-accent',
                    !isSameMonth(day, currentMonth) && 'opacity-30'
                  )}
                >
                  <span className={cn(
                    'text-sm',
                    isToday && 'text-accent font-bold'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {daySessions.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {daySessions.slice(0, 3).map((session, i) => (
                        <div
                          key={i}
                          className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(session.status).split(' ')[0])}
                        />
                      ))}
                      {daySessions.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{daySessions.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day sessions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">Click a date to see scheduled sessions</p>
          ) : selectedDaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled for this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDaySessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession?.(session)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-colors',
                    getStatusColor(session.status)
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{session.topic}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {(session.user_name || session.user_email) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {session.user_name || session.user_email}
                    </p>
                  )}
                  {(session.scheduled_at || session.preferred_date) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(session.scheduled_at || session.preferred_date!), 'h:mm a')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuidanceCalendar;
