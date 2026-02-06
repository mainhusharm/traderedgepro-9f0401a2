import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Copy, 
  Check, 
  Trash2, 
  Edit2, 
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface AgentClient {
  id: string;
  agent_id: string;
  name: string | null;
  email: string;
  access_token: string | null;
  status: string | null;
  invite_sent_at?: string | null;
  invite_accepted_at?: string | null;
  permissions?: {
    can_view_journal?: boolean;
    can_view_signals?: boolean;
    can_view_performance?: boolean;
  } | null;
  created_at: string | null;
}

interface ClientManagementProps {
  agentId: string;
}

const ClientManagement = ({ agentId }: ClientManagementProps) => {
  const [clients, setClients] = useState<AgentClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AgentClient | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    can_view_journal: true,
    can_view_signals: true,
    can_view_performance: true
  });

  // Fetch clients
  useEffect(() => {
    fetchClients();
    
    // Real-time subscription
    const channel = supabase
      .channel(`agent-clients-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_clients',
          filter: `agent_id=eq.${agentId}`
        },
        () => fetchClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_clients')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients((data as unknown as AgentClient[]) || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('agent_clients')
        .insert({
          agent_id: agentId,
          name: formData.name || null,
          email: formData.email.toLowerCase(),
          permissions: {
            can_view_journal: formData.can_view_journal,
            can_view_signals: formData.can_view_signals,
            can_view_performance: formData.can_view_performance
          }
        });

      if (error) throw error;

      toast.success('Client added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast.error(error.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('agent_clients')
        .update({
          name: formData.name || null,
          email: formData.email.toLowerCase(),
          permissions: {
            can_view_journal: formData.can_view_journal,
            can_view_signals: formData.can_view_signals,
            can_view_performance: formData.can_view_performance
          }
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast.success('Client updated successfully');
      setIsEditDialogOpen(false);
      setEditingClient(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error(error.message || 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('agent_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Client removed');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to remove client');
    }
  };

  const copyAccessLink = (client: AgentClient) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/client?token=${client.access_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(client.id);
    toast.success('Access link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditDialog = (client: AgentClient) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email,
      can_view_journal: client.permissions?.can_view_journal ?? true,
      can_view_signals: client.permissions?.can_view_signals ?? true,
      can_view_performance: client.permissions?.can_view_performance ?? true
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      can_view_journal: true,
      can_view_signals: true,
      can_view_performance: true
    });
  };

  const getStatusBadge = (client: AgentClient) => {
    if (client.status === 'active') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (client.invite_sent_at) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted text-muted-foreground">
        <Clock className="w-3 h-3 mr-1" />
        Not Invited
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Clients</h2>
          <p className="text-muted-foreground">Manage your client sub-dashboards</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a client profile and generate an access link for them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="Client name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-3 pt-2">
                <Label>Permissions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">View Signals</span>
                    <Switch
                      checked={formData.can_view_signals}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_signals: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">View Journal</span>
                    <Switch
                      checked={formData.can_view_journal}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_journal: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">View Performance</span>
                    <Switch
                      checked={formData.can_view_performance}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_performance: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No clients yet</p>
              <p className="text-sm">Add your first client to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {clients.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <Card className="bg-card/50 hover:bg-card/80 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {(client.name || client.email)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{client.name || 'Unnamed Client'}</p>
                            {getStatusBadge(client)}
                          </div>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          {client.invite_accepted_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined {new Date(client.invite_accepted_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyAccessLink(client)}
                        >
                          {copiedId === client.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Client?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {client.name || client.email} and revoke their access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Client name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-3 pt-2">
              <Label>Permissions</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">View Signals</span>
                  <Switch
                    checked={formData.can_view_signals}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_signals: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">View Journal</span>
                  <Switch
                    checked={formData.can_view_journal}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_journal: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">View Performance</span>
                  <Switch
                    checked={formData.can_view_performance}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_performance: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClient} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagement;
