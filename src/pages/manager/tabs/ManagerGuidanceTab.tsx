import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Calendar, Clock, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GuidanceSession {
  id: string;
  session_number: string;
  topic: string;
  description: string | null;
  status: string;
  user_id: string;
  assigned_agent_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  admin_agents?: {
    name: string;
    email: string;
  };
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

const ManagerGuidanceTab = () => {
  const { callManagerApi } = useManagerApi();
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reassigning, setReassigning] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [sessionsRes, agentsRes] = await Promise.all([
      callManagerApi('get_guidance_sessions'),
      callManagerApi('get_agents')
    ]);

    if (sessionsRes?.success) {
      setSessions(sessionsRes.sessions || []);
    }
    if (agentsRes?.success) {
      setAgents(agentsRes.agents || []);
    }
    setIsLoading(false);
  };

  const handleReassign = async (sessionId: string, agentId: string) => {
    setReassigning(sessionId);
    const response = await callManagerApi('reassign_session', { sessionId, agentId });

    if (response?.success) {
      toast.success('Session reassigned successfully');
      fetchData();
    } else {
      toast.error('Failed to reassign session');
    }
    setReassigning(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingSessions.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledSessions.length}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Guidance Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-sm text-muted-foreground font-medium">Session</th>
                  <th className="text-left py-3 px-4 text-sm text-muted-foreground font-medium">Topic</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-muted-foreground font-medium">Assigned Agent</th>
                  <th className="text-left py-3 px-4 text-sm text-muted-foreground font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 20).map((session, index) => (
                  <motion.tr
                    key={session.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3 px-4 font-medium">{session.session_number}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{session.topic}</p>
                        {session.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{session.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {session.admin_agents ? (
                        <span>{session.admin_agents.name || session.admin_agents.email}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(session.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={session.assigned_agent_id || ''}
                        onValueChange={(value) => handleReassign(session.id, value)}
                        disabled={reassigning === session.id}
                      >
                        <SelectTrigger className="w-36 bg-white/5 border-white/10">
                          <SelectValue placeholder="Reassign" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map(agent => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name || agent.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No guidance sessions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerGuidanceTab;
