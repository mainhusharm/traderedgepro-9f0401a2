import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Mail, Circle, Edit, Save, X, Eye, EyeOff, MessageSquare, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import AgentProfileModal from '../components/AgentProfileModal';

interface Agent {
  id: string;
  email: string;
  name: string | null;
  status: string;
  is_online: boolean;
  last_seen_at: string | null;
  permissions: {
    can_chat: boolean;
    can_schedule: boolean;
    can_view_all_sessions: boolean;
    can_send_signals: boolean;
  };
  created_at: string;
  agent_stats?: {
    total_signals_posted: number;
    winning_signals: number;
    losing_signals: number;
    clients_handled: number;
  }[];
  session_stats?: {
    total: number;
    completed: number;
  };
  signal_review_stats?: {
    reviewed: number;
    approved: number;
    wins: number;
    losses: number;
  };
}

const ManagerAgentsTab = () => {
  const { callManagerApi } = useManagerApi();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Agent['permissions'] | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewingAgentId, setViewingAgentId] = useState<string | null>(null);
  const [viewingAgentName, setViewingAgentName] = useState<string>('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const response = await callManagerApi('get_agents');
    if (response?.success) {
      setAgents(response.agents || []);
    }
    setIsLoading(false);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditedPermissions({ ...agent.permissions });
    setEditedName(agent.name || '');
  };

  const handleSaveAgent = async () => {
    if (!editingAgent || !editedPermissions) return;
    
    setIsSaving(true);
    const response = await callManagerApi('update_agent', {
      agentId: editingAgent.id,
      updates: { 
        permissions: editedPermissions,
        name: editedName.trim() || null
      }
    });

    if (response?.success) {
      toast.success('Agent updated successfully');
      setEditingAgent(null);
      fetchAgents();
    } else {
      toast.error('Failed to update agent');
    }
    setIsSaving(false);
  };

  // Check if agent is truly online (last seen within 2 minutes)
  const isAgentOnline = (agent: Agent) => {
    if (!agent.is_online || !agent.last_seen_at) return false;
    const lastSeen = new Date(agent.last_seen_at);
    return differenceInMinutes(new Date(), lastSeen) < 2;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Agents</h2>
          <p className="text-sm text-muted-foreground">Manage agent profiles and permissions</p>
        </div>
        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
          {agents.length} Total Agents
        </Badge>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, index) => {
          const stats = agent.agent_stats?.[0];
          const signalStats = agent.signal_review_stats;
          const sessionStats = agent.session_stats;
          const winRate = signalStats?.reviewed 
            ? ((signalStats.wins / signalStats.reviewed) * 100).toFixed(0)
            : stats?.total_signals_posted 
              ? ((stats.winning_signals / stats.total_signals_posted) * 100).toFixed(0)
              : '0';
          const online = isAgentOnline(agent);

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card/50 border-white/5 hover:border-purple-500/20 transition-colors">
                <CardContent className="p-4 space-y-4">
                  {/* Agent Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.name || 'Unnamed Agent'}</p>
                        <p className="text-xs text-muted-foreground">{agent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Circle className={`w-2 h-2 ${online ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'}`} />
                      <span className={`text-xs ${online ? 'text-green-400' : 'text-gray-400'}`}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      agent.status === 'active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {agent.status}
                    </Badge>
                    {agent.last_seen_at && (
                      <span className="text-xs text-muted-foreground">
                        Last seen: {format(new Date(agent.last_seen_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>

                  {/* Stats Row 1 - Signals */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold">{signalStats?.reviewed || stats?.total_signals_posted || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Signals</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-green-400">{winRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Win Rate</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-green-400">{signalStats?.wins || stats?.winning_signals || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Wins</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-red-400">{signalStats?.losses || stats?.losing_signals || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Losses</p>
                    </div>
                  </div>

                  {/* Stats Row 2 - Sessions */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold">{sessionStats?.total || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Sessions</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-blue-400">{sessionStats?.completed || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold">{stats?.clients_handled || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Clients</p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1">
                    {agent.permissions?.can_chat && (
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Chat</Badge>
                    )}
                    {agent.permissions?.can_schedule && (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">Schedule</Badge>
                    )}
                    {agent.permissions?.can_send_signals && (
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Signals</Badge>
                    )}
                    {agent.permissions?.can_view_all_sessions && (
                      <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">View All</Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30"
                      onClick={() => {
                        setViewingAgentId(agent.id);
                        setViewingAgentName(agent.name || agent.email);
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <Card className="bg-card/50 border-white/5">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No agents found</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Edit Agent
            </DialogTitle>
          </DialogHeader>
          
          {editingAgent && editedPermissions && (
            <div className="space-y-6">
              {/* Agent Name Input */}
              <div className="space-y-2">
                <Label>Agent Name</Label>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter agent name"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-muted-foreground">{editingAgent.email}</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Permissions</p>
                <div className="flex items-center justify-between">
                  <Label>Can Chat with Users</Label>
                  <Switch
                    checked={editedPermissions.can_chat}
                    onCheckedChange={(checked) => setEditedPermissions({ ...editedPermissions, can_chat: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Can Schedule Sessions</Label>
                  <Switch
                    checked={editedPermissions.can_schedule}
                    onCheckedChange={(checked) => setEditedPermissions({ ...editedPermissions, can_schedule: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Can Send Signals</Label>
                  <Switch
                    checked={editedPermissions.can_send_signals}
                    onCheckedChange={(checked) => setEditedPermissions({ ...editedPermissions, can_send_signals: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Can View All Sessions</Label>
                  <Switch
                    checked={editedPermissions.can_view_all_sessions}
                    onCheckedChange={(checked) => setEditedPermissions({ ...editedPermissions, can_view_all_sessions: checked })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingAgent(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-500"
                  onClick={handleSaveAgent}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Profile Modal */}
      <AgentProfileModal
        agentId={viewingAgentId}
        agentName={viewingAgentName}
        onClose={() => setViewingAgentId(null)}
      />
    </div>
  );
};

export default ManagerAgentsTab;
