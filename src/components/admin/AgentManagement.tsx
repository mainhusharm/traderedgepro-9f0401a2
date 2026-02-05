import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Trash2,
  Edit,
  Circle,
  TrendingUp,
  MessageSquare,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminApi } from '@/hooks/useAdminApi';
import { format } from 'date-fns';

interface AdminAgent {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;
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

interface AgentManagementProps {
  onOnlineAgentsChange?: (count: number) => void;
}

const AgentManagement = ({ onOnlineAgentsChange }: AgentManagementProps) => {
  const { callAdminApi } = useAdminApi();
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AdminAgent | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    inviteMessage: '',
    can_chat: true,
    can_schedule: true,
    can_view_all_sessions: false,
    can_send_signals: false
  });

  useEffect(() => {
    fetchAgents();

    // Subscribe to agent status changes
    const channel = supabase
      .channel('agent-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_agents'
        },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const onlineCount = agents.filter(a => a.is_online && a.status === 'active').length;
    onOnlineAgentsChange?.(onlineCount);
  }, [agents, onOnlineAgentsChange]);

  const fetchAgents = useCallback(async () => {
    try {
      const result = await callAdminApi('get_agents', { page: 1, limit: 100 });
      
      // Cast the permissions to the correct type
      const typedAgents = (result.agents || []).map((agent: any) => ({
        ...agent,
        permissions: agent.permissions as AdminAgent['permissions']
      }));
      
      setAgents(typedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi]);


  const handleInviteAgent = async () => {
    if (!formData.email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use admin API to create agent (bypasses RLS with service role)
      const result = await callAdminApi('create_agent', {
        email: formData.email,
        name: formData.name || null,
        permissions: {
          can_chat: formData.can_chat,
          can_schedule: formData.can_schedule,
          can_view_all_sessions: formData.can_view_all_sessions,
          can_send_signals: formData.can_send_signals
        }
      });

      if (!result.agent) {
        throw new Error('Failed to create agent');
      }

      const invitationToken = result.agent.invitation_token;

      // Send invitation email
      await supabase.functions.invoke('send-agent-invitation', {
        body: {
          email: formData.email,
          name: formData.name,
          invitationToken,
          permissions: {
            can_chat: formData.can_chat,
            can_schedule: formData.can_schedule,
            can_view_all_sessions: formData.can_view_all_sessions,
            can_send_signals: formData.can_send_signals,
          },
          inviteMessage: formData.inviteMessage || undefined,
        }
      });

      toast.success('Invitation sent successfully!');
      setIsDialogOpen(false);
      setFormData({ email: '', name: '', inviteMessage: '', can_chat: true, can_schedule: true, can_view_all_sessions: false, can_send_signals: false });
      fetchAgents();
    } catch (error: any) {
      console.error('Error inviting agent:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingAgent) return;
    
    setIsSubmitting(true);
    try {
      await callAdminApi('update_agent', {
        agentId: editingAgent.id,
        updates: {
          name: formData.name || null,
          permissions: {
            can_chat: formData.can_chat,
            can_schedule: formData.can_schedule,
            can_view_all_sessions: formData.can_view_all_sessions,
            can_send_signals: formData.can_send_signals
          }
        }
      });

      toast.success('Agent permissions updated!');
      setIsDialogOpen(false);
      setEditingAgent(null);
      setFormData({ email: '', name: '', inviteMessage: '', can_chat: true, can_schedule: true, can_view_all_sessions: false, can_send_signals: false });
      fetchAgents();
    } catch (error: any) {
      console.error('Error updating agent:', error);
      toast.error(error.message || 'Failed to update agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAgent = async (agentId: string, updates: Partial<AdminAgent>) => {
    try {
      await callAdminApi('update_agent', { agentId, updates });
      toast.success('Agent updated');
      fetchAgents();
    } catch (error: any) {
      console.error('Error updating agent:', error);
      toast.error(error.message || 'Failed to update agent');
    }
  };

  const openEditDialog = (agent: AdminAgent) => {
    setEditingAgent(agent);
    setFormData({
      email: agent.email,
      name: agent.name || '',
      inviteMessage: '',
      can_chat: agent.permissions?.can_chat ?? true,
      can_schedule: agent.permissions?.can_schedule ?? true,
      can_view_all_sessions: agent.permissions?.can_view_all_sessions ?? false,
      can_send_signals: agent.permissions?.can_send_signals ?? false
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await callAdminApi('delete_agent', { agentId });
      toast.success('Agent removed');
      fetchAgents();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      toast.error(error.message || 'Failed to remove agent');
    }
  };

  const copyInvitationLink = (token: string) => {
    const url = new URL('/agent', window.location.origin);
    url.searchParams.set('token', token);
    navigator.clipboard.writeText(url.toString());
    toast.success('Invitation link copied!');
  };

  const getStatusBadge = (agent: AdminAgent) => {
    if (agent.status === 'pending') {
      return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    }
    if (agent.status === 'inactive') {
      return <Badge variant="outline" className="text-destructive border-destructive">Inactive</Badge>;
    }
    return (
      <Badge variant="outline" className={agent.is_online ? 'text-success border-success' : 'text-muted-foreground'}>
        <Circle className={`w-2 h-2 mr-1 ${agent.is_online ? 'fill-success' : 'fill-muted-foreground'}`} />
        {agent.is_online ? 'Online' : 'Offline'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Agent Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Invite and manage trading experts who can chat with users
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAgent(null);
            setFormData({ email: '', name: '', inviteMessage: '', can_chat: true, can_schedule: true, can_view_all_sessions: false, can_send_signals: false });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent Permissions' : 'Invite New Agent'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="agent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                  disabled={!!editingAgent}
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Agent name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              {!editingAgent && (
                <div>
                  <Label>Invite Message / Requirements (optional)</Label>
                  <Textarea
                    placeholder="Add any onboarding requirements, links, or instructions for this agent…"
                    value={formData.inviteMessage}
                    onChange={(e) => setFormData({ ...formData, inviteMessage: e.target.value })}
                    className="mt-1 min-h-[96px]"
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">1-on-1 Guidance Chat</span>
                  <Switch
                    checked={formData.can_chat}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_chat: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schedule Sessions</span>
                  <Switch
                    checked={formData.can_schedule}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_schedule: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Send Trading Signals</span>
                  <Switch
                    checked={formData.can_send_signals}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_send_signals: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">View All Sessions</span>
                  <Switch
                    checked={formData.can_view_all_sessions}
                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_all_sessions: checked })}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={editingAgent ? handleUpdatePermissions : handleInviteAgent} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingAgent ? <Edit className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                {editingAgent ? 'Update Permissions' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Circle className="w-5 h-5 text-success fill-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online Now</p>
              <p className="text-2xl font-bold">{agents.filter(a => a.is_online && a.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
              <p className="text-2xl font-bold">{agents.filter(a => a.status === 'pending').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No agents yet. Invite your first trading expert!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {agents.map((agent) => {
                  const signalStats = agent.signal_review_stats;
                  const sessionStats = agent.session_stats;
                  const winRate = signalStats?.reviewed 
                    ? ((signalStats.wins / signalStats.reviewed) * 100).toFixed(0)
                    : '0';
                  
                  return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{agent.name || agent.email}</span>
                            {getStatusBadge(agent)}
                          </div>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                          {agent.last_seen_at && agent.status === 'active' && (
                            <p className="text-xs text-muted-foreground">
                              Last seen: {format(new Date(agent.last_seen_at), 'MMM d, h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Agent Stats Row */}
                    {agent.status === 'active' && (
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-4 gap-3 text-center">
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-lg font-bold">{signalStats?.reviewed || 0}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                            <Activity className="w-3 h-3" /> Signals
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-lg font-bold text-green-400">{winRate}%</p>
                          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Win Rate
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-lg font-bold">{sessionStats?.total || 0}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Sessions
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-lg font-bold text-blue-400">{sessionStats?.completed || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions Row */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                        {agent.status === 'pending' && agent.invitation_token && (
                          <Button variant="outline" size="sm" onClick={() => copyInvitationLink(agent.invitation_token!)}>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(agent)}
                          title="Edit Permissions"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {agent.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateAgent(agent.id, { status: 'inactive' })}
                        >
                          Deactivate
                        </Button>
                      )}
                      {agent.status === 'inactive' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateAgent(agent.id, { status: 'active' })}
                        >
                          Activate
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Agent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this agent? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAgent(agent.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentManagement;
