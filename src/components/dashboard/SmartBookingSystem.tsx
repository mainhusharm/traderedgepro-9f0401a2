import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isAfter,
  setHours,
  setMinutes,
  isBefore
} from 'date-fns';

interface AgentAvailability {
  agent_id: string;
  day_of_week: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  agentId?: string;
}

interface SmartBookingSystemProps {
  onBookingComplete?: (sessionId: string) => void;
  topic?: string;
  description?: string;
}

const DAYS_MAP: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

const SmartBookingSystem = ({ onBookingComplete, topic, description }: SmartBookingSystemProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availability, setAvailability] = useState<AgentAvailability[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await (supabase
        .from('agent_availability' as any)
        .select('*')
        .eq('is_available', true) as any) as { data: AgentAvailability[] | null; error: any };

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookedSlots = async (date: Date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('guidance_sessions')
        .select('scheduled_at')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .not('scheduled_at', 'is', null);

      const booked = (data || []).map(s => format(new Date(s.scheduled_at!), 'HH:mm'));
      setBookedSlots(booked);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const getAvailableSlots = (date: Date): TimeSlot[] => {
    const dayName = format(date, 'EEEE');
    const dayAvailability = availability.filter(a => a.day_of_week === dayName);
    
    if (dayAvailability.length === 0) return [];

    const slots: TimeSlot[] = [];
    const now = new Date();

    dayAvailability.forEach(avail => {
      if (!avail.start_time || !avail.end_time) return;

      const startHour = parseInt(avail.start_time.slice(0, 2));
      const endHour = parseInt(avail.end_time.slice(0, 2));

      for (let hour = startHour; hour < endHour; hour++) {
        for (const minute of [0, 30]) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotTime = setMinutes(setHours(date, hour), minute);
          
          // Check if slot is in the past
          const isPast = isSameDay(date, now) && isBefore(slotTime, now);
          // Check if slot is already booked
          const isBooked = bookedSlots.includes(timeStr);

          slots.push({
            time: timeStr,
            available: !isPast && !isBooked,
            agentId: avail.agent_id
          });
        }
      }
    });

    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime || !user) return;

    setIsBooking(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      const sessionNumber = `GS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data, error } = await supabase
        .from('guidance_sessions')
        .insert({
          user_id: user.id,
          session_number: sessionNumber,
          topic: topic || 'General Consultation',
          description: description || null,
          scheduled_at: scheduledAt.toISOString(),
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email with calendar invite
      try {
        await callEdgeFunction('send-booking-confirmation', {
          userEmail: user.email,
          userName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Trader',
          sessionNumber,
          topic: topic || 'General Consultation',
          scheduledAt: scheduledAt.toISOString(),
          description: description || undefined,
        });
        console.log('Booking confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      toast.success('Session booked successfully!', {
        description: `Scheduled for ${format(scheduledAt, 'EEEE, MMMM d')} at ${selectedTime}. Confirmation email sent!`
      });

      onBookingComplete?.(data.id);
      setSelectedTime(null);
      fetchBookedSlots(selectedDate);
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error('Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  const getDayAvailabilityStatus = (date: Date) => {
    if (isBefore(date, startOfWeek(new Date(), { weekStartsOn: 1 }))) {
      return 'past';
    }
    const dayName = format(date, 'EEEE');
    const hasAvailability = availability.some(a => a.day_of_week === dayName);
    return hasAvailability ? 'available' : 'unavailable';
  };

  const slots = getAvailableSlots(selectedDate);
  const availableSlots = slots.filter(s => s.available);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/10">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Book Available Time Slot
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Calendar Side */}
          <div className="p-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const status = getDayAvailabilityStatus(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => status !== 'past' && setSelectedDate(day)}
                    disabled={status === 'past' || status === 'unavailable'}
                    className={`
                      p-2 rounded-lg text-center transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${status === 'available' && !isSelected ? 'hover:bg-white/10 cursor-pointer' : ''}
                      ${status === 'unavailable' ? 'opacity-40 cursor-not-allowed' : ''}
                      ${status === 'past' ? 'opacity-30 cursor-not-allowed' : ''}
                      ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}
                    `}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                    {status === 'available' && (
                      <div className="w-1.5 h-1.5 bg-success rounded-full mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <span>Unavailable</span>
              </div>
            </div>
          </div>

          {/* Time Slots Side */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {format(selectedDate, 'EEEE, MMM d')}
              </h4>
              <Badge variant="outline">
                {availableSlots.length} slots
              </Badge>
            </div>

            <ScrollArea className="h-48">
              {slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No availability on this day</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`
                        p-2 rounded-lg text-sm font-medium transition-all
                        ${selectedTime === slot.time ? 'bg-primary text-primary-foreground' : ''}
                        ${slot.available && selectedTime !== slot.time ? 'bg-white/5 hover:bg-white/10 border border-white/10' : ''}
                        ${!slot.available ? 'bg-muted/20 text-muted-foreground line-through cursor-not-allowed' : ''}
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Confirm Booking */}
            {selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">
                      {format(selectedDate, 'MMM d')} at {selectedTime}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full btn-glow"
                  onClick={handleBookSession}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Confirm Booking
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartBookingSystem;
