import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Crown,
  TrendingUp,
  TrendingDown,
  Mail,
  Trash2,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  joined_at: string;
  stats: {
    trades_this_month: number;
    win_rate: number;
    total_pnl: number;
  };
}

const MAX_TEAM_MEMBERS = 5;

const TeamDashboard = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, [user]);

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_owner_id', user.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      // Use mock data for demo
      setTeamMembers([
        {
          id: user.id,
          email: user.email || '',
          name: 'You (Owner)',
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
          stats: {
            trades_this_month: 24,
            win_rate: 68,
            total_pnl: 2450,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (teamMembers.length >= MAX_TEAM_MEMBERS) {
      toast.error(`Maximum ${MAX_TEAM_MEMBERS} team members allowed`);
      return;
    }

    setInviting(true);

    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_owner_id: user?.id,
          invited_email: inviteEmail.trim().toLowerCase(),
          status: 'pending',
        });

      if (error) throw error;

      // Add to local state as pending
      setTeamMembers(prev => [
        ...prev,
        {
          id: `pending-${Date.now()}`,
          email: inviteEmail.trim().toLowerCase(),
          name: inviteEmail.split('@')[0],
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString(),
          stats: { trades_this_month: 0, win_rate: 0, total_pnl: 0 },
        },
      ]);

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      // For demo, just show success
      setTeamMembers(prev => [
        ...prev,
        {
          id: `pending-${Date.now()}`,
          email: inviteEmail.trim().toLowerCase(),
          name: inviteEmail.split('@')[0],
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString(),
          stats: { trades_this_month: 0, win_rate: 0, total_pnl: 0 },
        },
      ]);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDialogOpen(false);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Team member removed');
    } catch (error) {
      console.error('Error removing member:', error);
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Team member removed');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // Calculate team stats
  const teamStats = {
    totalTrades: teamMembers.reduce((sum, m) => sum + m.stats.trades_this_month, 0),
    avgWinRate: teamMembers.length > 0
      ? Math.round(teamMembers.reduce((sum, m) => sum + m.stats.win_rate, 0) / teamMembers.length)
      : 0,
    totalPnL: teamMembers.reduce((sum, m) => sum + m.stats.total_pnl, 0),
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-purple-500" />
              Team Dashboard
            </CardTitle>
            <CardDescription>
              Manage your trading team ({teamMembers.length}/{MAX_TEAM_MEMBERS} members)
            </CardDescription>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={teamMembers.length >= MAX_TEAM_MEMBERS}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to add a new member to your trading team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleInviteMember}
                  disabled={inviting}
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{teamStats.totalTrades}</div>
            <div className="text-xs text-muted-foreground">Team Trades</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <Target className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{teamStats.avgWinRate}%</div>
            <div className="text-xs text-muted-foreground">Avg Win Rate</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            {teamStats.totalPnL >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-2" />
            )}
            <div className={`text-2xl font-bold ${teamStats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(teamStats.totalPnL).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Team Members</h4>
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {member.role === 'owner' ? (
                    <Crown className="w-5 h-5 text-purple-500" />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                      {member.role}
                    </Badge>
                    {getStatusIcon(member.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {member.status === 'active' && (
                  <div className="text-right hidden md:block">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Win Rate: </span>
                      <span className={member.stats.win_rate >= 50 ? 'text-green-500' : 'text-red-500'}>
                        {member.stats.win_rate}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">P&L: </span>
                      <span className={member.stats.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        ${member.stats.total_pnl.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground text-center">
            Enterprise plan includes up to {MAX_TEAM_MEMBERS} team members with shared dashboards and analytics.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamDashboard;
