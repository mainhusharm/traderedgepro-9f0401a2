import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Check,
  X,
  Minus,
  Edit2,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import VIPSignalEditModal from '@/components/admin/VIPSignalEditModal';

interface VIPSignal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  outcome: string;
  is_vip: boolean;
  reviewed_by: string[] | string | null;
  vip_notes: string | null;
  pnl: number | null;
  risk_amount: number | null;
  lot_size: number | null;
  confidence_score: number | null;
  created_at: string;
}

const AgentVIPSignals = () => {
  const [signals, setSignals] = useState<VIPSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<VIPSignal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchVIPSignals();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('vip-signals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals',
          filter: 'is_vip=eq.true'
        },
        () => fetchVIPSignals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVIPSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('is_vip', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignals((data as unknown as VIPSignal[]) || []);
    } catch (error) {
      console.error('Error fetching VIP signals:', error);
      toast.error('Failed to fetch VIP signals');
    } finally {
      setIsLoading(false);
    }
  };

const handleUpdateOutcome = async (signalId: string, outcome: "pending" | "target_hit" | "stop_loss_hit" | "cancelled" | "breakeven") => {
    try {
      const { error } = await supabase
        .from('signals')
        .update({ outcome })
        .eq('id', signalId);

      if (error) throw error;
      toast.success('Outcome updated');
      fetchVIPSignals();
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast.error('Failed to update outcome');
    }
  };

  const handleSendToDiscord = async (signal: VIPSignal) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-discord-signal', {
        body: {
          symbol: signal.symbol,
          signal_type: signal.signal_type,
          entry_price: signal.entry_price,
          stop_loss: signal.stop_loss,
          take_profit: signal.take_profit,
          confidence_score: signal.confidence_score,
          is_vip: signal.is_vip,
          reviewed_by: signal.reviewed_by,
          vip_notes: signal.vip_notes,
        },
      });

      if (error) throw error;
      toast.success('VIP Signal sent to Discord!');
    } catch (error: any) {
      console.error('Failed to send to Discord:', error);
      toast.error(error.message || 'Failed to send to Discord');
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'target_hit':
        return <Badge className="bg-success/10 text-success border-success"><Check className="w-3 h-3 mr-1" />Won</Badge>;
      case 'stop_loss_hit':
        return <Badge className="bg-risk/10 text-risk border-risk"><X className="w-3 h-3 mr-1" />Lost</Badge>;
      case 'breakeven':
        return <Badge className="bg-muted/10 text-muted-foreground border-muted-foreground"><Minus className="w-3 h-3 mr-1" />BE</Badge>;
      case 'cancelled':
        return <Badge className="bg-warning/10 text-warning border-warning"><X className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge className="bg-primary/10 text-primary border-primary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredSignals = signals.filter((signal) => {
    if (filter === 'pending') return signal.outcome === 'pending';
    if (filter === 'completed') return signal.outcome !== 'pending';
    return true;
  });

  // Stats
  const totalSignals = signals.length;
  const wonSignals = signals.filter(s => s.outcome === 'target_hit').length;
  const lostSignals = signals.filter(s => s.outcome === 'stop_loss_hit').length;
  const pendingSignals = signals.filter(s => s.outcome === 'pending').length;
  const winRate = totalSignals > 0 ? ((wonSignals / (wonSignals + lostSignals)) * 100 || 0).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Crown className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{totalSignals}</p>
            <p className="text-xs text-muted-foreground">Total VIP</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-success mb-1" />
            <p className="text-2xl font-bold text-success">{wonSignals}</p>
            <p className="text-xs text-muted-foreground">Won</p>
          </CardContent>
        </Card>
        <Card className="bg-risk/5 border-risk/20">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 mx-auto text-risk mb-1" />
            <p className="text-2xl font-bold text-risk">{lostSignals}</p>
            <p className="text-xs text-muted-foreground">Lost</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Signals List */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="w-4 h-4 text-amber-500" />
            VIP Signals
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchVIPSignals} className="h-8">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No VIP signals found
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y divide-white/5">
                {filteredSignals.map((signal) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${signal.signal_type === 'BUY' ? 'bg-success/10' : 'bg-risk/10'}`}>
                        {signal.signal_type === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-risk" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{signal.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            {signal.signal_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Entry: {signal.entry_price} • {format(new Date(signal.created_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {signal.pnl !== null && (
                        <span className={`text-sm font-semibold ${signal.pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                          {signal.pnl >= 0 ? '+' : ''}{signal.pnl.toFixed(2)}
                        </span>
                      )}
                      
                      {getOutcomeBadge(signal.outcome)}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendToDiscord(signal)}
                        className="h-7 w-7 p-0 text-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/10"
                        title="Send to Discord"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSignal(signal);
                          setIsEditModalOpen(true);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <VIPSignalEditModal
        signal={selectedSignal}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSignal(null);
        }}
        onUpdate={fetchVIPSignals}
      />
    </div>
  );
};

export default AgentVIPSignals;
