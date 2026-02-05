import { useState, useEffect } from 'react';
import { Circle, Headphones, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AdminAgent {
  id: string;
  name: string | null;
  email: string;
  is_online: boolean;
  status: string;
}

interface AgentAvailabilitySlot {
  agent_id: string;
  day_of_week: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

const ExpertAvailability = () => {
  const [onlineAgents, setOnlineAgents] = useState<AdminAgent[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AgentAvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOnlineAgents();
    fetchAvailability();

    // Subscribe to agent status changes in real-time
    const channel = supabase
      .channel('expert-availability-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_agents'
        },
        () => {
          fetchOnlineAgents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_availability'
        },
        () => {
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOnlineAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_agents')
        .select('id, name, email, is_online, status')
        .eq('status', 'active')
        .eq('is_online', true);

      if (error) throw error;
      setOnlineAgents(data || []);
    } catch (error) {
      console.error('Error fetching online agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      // Use type assertion since agent_availability table was just created
      const { data, error } = await (supabase
        .from('agent_availability' as any)
        .select('*')
        .eq('is_available', true) as any) as { data: AgentAvailabilitySlot[] | null; error: any };

      if (error) throw error;
      setAvailabilitySlots(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const getTodayAvailability = () => {
    const today = format(new Date(), 'EEEE'); // e.g., "Monday"
    return availabilitySlots.filter(slot => slot.day_of_week === today);
  };

  const isExpertAvailable = onlineAgents.length > 0;
  const todaySlots = getTodayAvailability();
  const hasScheduledAvailability = todaySlots.length > 0;

  return (
    <Card className={`glass-card border ${isExpertAvailable ? 'border-success/30' : 'border-muted/30'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isExpertAvailable ? 'bg-success/20' : 'bg-muted/20'
            }`}>
              <Headphones className={`w-5 h-5 ${isExpertAvailable ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Expert Support</span>
                <Badge variant="outline" className={isExpertAvailable ? 'text-success border-success' : 'text-muted-foreground'}>
                  <Circle className={`w-2 h-2 mr-1 ${isExpertAvailable ? 'fill-success animate-pulse' : 'fill-muted-foreground'}`} />
                  {isExpertAvailable ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoading 
                  ? 'Checking availability...'
                  : isExpertAvailable 
                    ? `${onlineAgents.length} expert${onlineAgents.length > 1 ? 's' : ''} available now`
                    : hasScheduledAvailability
                      ? `Available today: ${todaySlots[0]?.start_time?.slice(0,5)} - ${todaySlots[0]?.end_time?.slice(0,5)}`
                      : 'No experts available. Book a session for later!'
                }
              </p>
              {!isExpertAvailable && hasScheduledAvailability && (
                <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                  <Clock className="w-3 h-3" />
                  <span>Scheduled availability today</span>
                </div>
              )}
            </div>
          </div>
          {isExpertAvailable && (
            <div className="flex -space-x-2">
              {onlineAgents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-white border-2 border-background"
                  title={agent.name || agent.email}
                >
                  {(agent.name || agent.email).charAt(0).toUpperCase()}
                </div>
              ))}
              {onlineAgents.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                  +{onlineAgents.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpertAvailability;
