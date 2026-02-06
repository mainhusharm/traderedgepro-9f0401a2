import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Availability {
  day_of_week: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

const ManagerSchedulesTab = () => {
  const { callManagerApi } = useManagerApi();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAvailability(selectedAgent);
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    const response = await callManagerApi('get_agents');
    if (response?.success) {
      setAgents(response.agents || []);
      if (response.agents?.length > 0) {
        setSelectedAgent(response.agents[0].id);
      }
    }
    setIsLoading(false);
  };

  const fetchAvailability = async (agentId: string) => {
    const response = await callManagerApi('get_agent_availability', { agentId });
    if (response?.success) {
      const availMap: Record<string, Availability> = {};
      DAYS.forEach(day => {
        const existing = response.availability?.find((a: any) => a.day_of_week === day);
        availMap[day] = existing || {
          day_of_week: day,
          is_available: false,
          start_time: '09:00',
          end_time: '17:00'
        };
      });
      setAvailability(availMap);
    }
  };

  const handleToggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_available: !prev[day].is_available
      }
    }));
  };

  const handleTimeChange = (day: string, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    
    setIsSaving(true);
    const availabilityArray = Object.values(availability).map(a => ({
      day_of_week: a.day_of_week,
      is_available: a.is_available,
      start_time: a.start_time,
      end_time: a.end_time
    }));

    const response = await callManagerApi('update_agent_availability', {
      agentId: selectedAgent,
      availability: availabilityArray
    });

    if (response?.success) {
      toast.success('Schedule updated successfully');
    } else {
      toast.error('Failed to update schedule');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Select Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAgent || ''} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full bg-white/5 border-white/10">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name || agent.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Availability Schedule */}
      {selectedAgent && (
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Weekly Availability
            </CardTitle>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-500"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Schedule
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DAYS.map((day, index) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border transition-colors ${
                    availability[day]?.is_available 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={availability[day]?.is_available || false}
                        onCheckedChange={() => handleToggleDay(day)}
                      />
                      <span className="font-medium w-24">{day}</span>
                    </div>
                    
                    {availability[day]?.is_available && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Select
                            value={availability[day]?.start_time || '09:00'}
                            onValueChange={(value) => handleTimeChange(day, 'start_time', value)}
                          >
                            <SelectTrigger className="w-24 bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <span className="text-muted-foreground">to</span>
                        <Select
                          value={availability[day]?.end_time || '17:00'}
                          onValueChange={(value) => handleTimeChange(day, 'end_time', value)}
                        >
                          <SelectTrigger className="w-24 bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagerSchedulesTab;
