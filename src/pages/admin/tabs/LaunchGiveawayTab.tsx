import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Mail, 
  Users, 
  Trophy, 
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Twitter,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GiveawayEntry {
  id: string;
  email: string;
  followed_x: boolean;
  followed_discord: boolean;
  created_at: string;
  is_winner: boolean;
  notified_at: string | null;
}

const LaunchGiveawayTab = () => {
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await (supabase
        .from('launch_giveaway_entries' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setEntries((data || []) as unknown as GiveawayEntry[]);
    } catch (error) {
      console.error('Error fetching giveaway entries:', error);
      toast.error('Failed to fetch giveaway entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEntries();
    setIsRefreshing(false);
    toast.success('Entries refreshed');
  };

  const handleToggleWinner = async (entry: GiveawayEntry) => {
    try {
      const { error } = await (supabase
        .from('launch_giveaway_entries' as any)
        .update({ is_winner: !entry.is_winner } as any)
        .eq('id', entry.id) as any);

      if (error) throw error;

      setEntries(prev => 
        prev.map(e => e.id === entry.id ? { ...e, is_winner: !e.is_winner } : e)
      );

      toast.success(entry.is_winner ? 'Winner status removed' : 'Marked as winner!');
    } catch (error) {
      console.error('Error updating winner status:', error);
      toast.error('Failed to update winner status');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Followed X', 'Followed Discord', 'Submitted At', 'Is Winner'];
    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        entry.email,
        entry.followed_x ? 'Yes' : 'No',
        entry.followed_discord ? 'Yes' : 'No',
        format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm:ss'),
        entry.is_winner ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launch_giveaway_entries_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const stats = {
    total: entries.length,
    fullyCompliant: entries.filter(e => e.followed_x && e.followed_discord).length,
    winners: entries.filter(e => e.is_winner).length,
    today: entries.filter(e => {
      const today = new Date();
      const entryDate = new Date(e.created_at);
      return entryDate.toDateString() === today.toDateString();
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Launch Giveaway Entries
          </h2>
          <p className="text-muted-foreground">
            Enterprise Plan Giveaway - Winner announced Jan 18, 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Promo Code Banner */}
      <Card className="bg-gradient-to-r from-success/10 via-success/5 to-success/10 border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-success">Active Launch Coupon: PROLAUNCH20</p>
              <p className="text-sm text-muted-foreground">20% off Pro Plan - Valid until Feb 28, 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-background/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fullyCompliant}</p>
                <p className="text-sm text-muted-foreground">Fully Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.winners}</p>
                <p className="text-sm text-muted-foreground">Winners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card className="bg-background/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            All Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Twitter className="w-4 h-4" /> X
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageCircle className="w-4 h-4" /> Discord
                    </div>
                  </TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className="border-white/10">
                      <TableCell className="font-medium">{entry.email}</TableCell>
                      <TableCell className="text-center">
                        {entry.followed_x ? (
                          <CheckCircle className="w-5 h-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.followed_discord ? (
                          <CheckCircle className="w-5 h-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        {entry.is_winner ? (
                          <Badge className="bg-warning/20 text-warning border-warning/30">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        ) : entry.followed_x && entry.followed_discord ? (
                          <Badge variant="outline" className="border-success/30 text-success">
                            Eligible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                            Incomplete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={entry.is_winner ? 'destructive' : 'outline'}
                          onClick={() => handleToggleWinner(entry)}
                          className="gap-1"
                        >
                          <Trophy className="w-3 h-3" />
                          {entry.is_winner ? 'Remove' : 'Set Winner'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LaunchGiveawayTab;
