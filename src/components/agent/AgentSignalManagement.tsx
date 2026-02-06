import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Crown,
  Clock,
  Check,
  X,
  Minus,
  Edit2,
  Trash2,
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  LogOut,
  Target,
  Users,
  Eye,
  Image
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import SignalImageUpload from '@/components/signals/SignalImageUpload';

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  outcome: string;
  is_vip: boolean;
  pnl: number | null;
  confidence_score: number | null;
  agent_id: string | null;
  agent_notes: string | null;
  auto_vip_reason: string | null;
  experts_count: number | null;
  trade_type: string | null;
  created_at: string;
  image_url: string | null;
  agent?: { name: string; email: string } | null;
}

interface SignalComment {
  id: string;
  signal_id: string;
  agent_id: string;
  comment: string;
  comment_type: string;
  created_at: string;
  agent?: { name: string } | null;
}

interface AgentSignalManagementProps {
  agentId: string;
}

const COMMENT_TYPES = [
  { value: 'update', label: 'Update', color: 'text-blue-400' },
  { value: 'exit_now', label: '🚨 Exit Now', color: 'text-red-400' },
  { value: 'hold', label: 'Hold Position', color: 'text-green-400' },
  { value: 'partial_close', label: 'Partial Close', color: 'text-amber-400' },
  { value: 'move_sl', label: 'Move Stop Loss', color: 'text-purple-400' },
  { value: 'warning', label: '⚠️ Warning', color: 'text-orange-400' },
];

const CURRENCY_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 
  'NZDUSD', 'USDCHF', 'EURJPY', 'GBPJPY', 'XAUUSD',
  'EURGBP', 'EURAUD', 'AUDJPY', 'CADJPY', 'CHFJPY',
  'NZDJPY', 'GBPAUD', 'GBPCAD', 'GBPNZD', 'AUDNZD',
  'AUDCAD', 'EURCAD', 'EURNZD', 'CADCHF', 'AUDCHF'
];

const CRYPTO_PAIRS = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'BNBUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD'];

const INDICES = ['US30', 'US100', 'US500', 'DE40', 'UK100', 'JP225'];

const COMMODITIES = ['XAGUSD', 'WTIUSD', 'BRNUSD', 'NATGAS'];

const AgentSignalManagement = ({ agentId }: AgentSignalManagementProps) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending' | 'completed'>('all');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [comments, setComments] = useState<SignalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('update');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useCustomSymbol, setUseCustomSymbol] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  
  // New signal form state
  const [newSignal, setNewSignal] = useState({
    symbol: 'EURUSD',
    direction: 'BUY' as 'BUY' | 'SELL',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    take_profit_2: '',
    take_profit_3: '',
    confidence: 75,
    analysis: '',
    agent_notes: '',
    trade_type: 'intraday',
    image_url: null as string | null,
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    stop_loss: '',
    take_profit: '',
    agent_notes: '',
    outcome: 'pending',
    pnl: '',
  });

  useEffect(() => {
    fetchSignals();
    
    // Subscribe to realtime updates
    const signalChannel = supabase
      .channel('agent-signals-management')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'signals'
      }, () => fetchSignals())
      .subscribe();

    const commentChannel = supabase
      .channel('signal-comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_signal_comments'
      }, () => {
        if (selectedSignal) {
          fetchComments(selectedSignal.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(signalChannel);
      supabase.removeChannel(commentChannel);
    };
  }, [agentId]);

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select(`
          *,
          agent:admin_agents!signals_agent_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSignals((data as Signal[]) || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast.error('Failed to fetch signals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (signalId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_signal_comments')
        .select(`
          *,
          agent:admin_agents!agent_signal_comments_agent_id_fkey(name)
        `)
        .eq('signal_id', signalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data as SignalComment[]) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSelectSignal = (signal: Signal) => {
    setSelectedSignal(signal);
    setEditForm({
      stop_loss: signal.stop_loss?.toString() || '',
      take_profit: signal.take_profit?.toString() || '',
      agent_notes: signal.agent_notes || '',
      outcome: signal.outcome || 'pending',
      pnl: signal.pnl?.toString() || '',
    });
    fetchComments(signal.id);
  };

  const handleAddComment = async () => {
    if (!selectedSignal || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('agent_signal_comments')
        .insert({
          signal_id: selectedSignal.id,
          agent_id: agentId,
          comment: newComment.trim(),
          comment_type: commentType,
        });

      if (error) throw error;
      
      // Also update agent_notes on the signal for immediate visibility
      if (commentType === 'exit_now' || commentType === 'warning') {
        await supabase
          .from('signals')
          .update({ agent_notes: `[${commentType.toUpperCase()}] ${newComment.trim()}` })
          .eq('id', selectedSignal.id);
      }

      toast.success('Comment added');
      setNewComment('');
      fetchComments(selectedSignal.id);
      fetchSignals();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSignal = async () => {
    if (!selectedSignal) return;
    
    setIsSubmitting(true);
    try {
      const updates: Record<string, any> = {
        agent_notes: editForm.agent_notes || null,
        outcome: editForm.outcome,
      };

      if (editForm.stop_loss) updates.stop_loss = parseFloat(editForm.stop_loss);
      if (editForm.take_profit) updates.take_profit = parseFloat(editForm.take_profit);
      if (editForm.pnl) updates.pnl = parseFloat(editForm.pnl);

      const { error } = await supabase
        .from('signals')
        .update(updates)
        .eq('id', selectedSignal.id);

      if (error) throw error;

      // Update agent stats
      await updateAgentStats(agentId, editForm.outcome);

      toast.success('Signal updated');
      setIsEditModalOpen(false);
      fetchSignals();
    } catch (error) {
      console.error('Error updating signal:', error);
      toast.error('Failed to update signal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;
    
    try {
      const { error } = await supabase
        .from('signals')
        .delete()
        .eq('id', signalId);

      if (error) throw error;
      toast.success('Signal deleted');
      setSelectedSignal(null);
      fetchSignals();
    } catch (error) {
      console.error('Error deleting signal:', error);
      toast.error('Failed to delete signal');
    }
  };

  const updateAgentStats = async (agentId: string, outcome: string) => {
    try {
      // First check if stats exist
      const { data: existing } = await supabase
        .from('agent_stats')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (outcome === 'target_hit') {
        updates.winning_signals = (existing?.winning_signals || 0) + 1;
      } else if (outcome === 'stop_loss_hit') {
        updates.losing_signals = (existing?.losing_signals || 0) + 1;
      } else if (outcome === 'breakeven') {
        updates.breakeven_signals = (existing?.breakeven_signals || 0) + 1;
      }

      if (existing) {
        await supabase
          .from('agent_stats')
          .update(updates)
          .eq('agent_id', agentId);
      } else {
        await supabase
          .from('agent_stats')
          .insert({
            agent_id: agentId,
            total_signals_posted: 1,
            ...updates,
          });
      }
    } catch (error) {
      console.error('Error updating agent stats:', error);
    }
  };

  const handleCreateSignal = async () => {
    const symbolToUse = useCustomSymbol ? customSymbol.toUpperCase().trim() : newSignal.symbol;
    
    if (!symbolToUse) {
      toast.error('Symbol is required');
      return;
    }
    
    if (!newSignal.entry_price) {
      toast.error('Entry price is required');
      return;
    }

    if (!newSignal.stop_loss) {
      toast.error('Stop Loss is required for trade management');
      return;
    }

    if (!newSignal.take_profit) {
      toast.error('Take Profit 1 is required for trade management');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicate signals (same symbol, direction, within 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: existingSignals } = await supabase
        .from('signals')
        .select('id, symbol, signal_type, agent_id, is_vip, experts_count')
        .eq('symbol', newSignal.symbol)
        .eq('signal_type', newSignal.direction)
        .eq('outcome', 'pending')
        .gte('created_at', twoHoursAgo);

      let isAutoVip = false;
      let autoVipReason: string | null = null;
      let duplicateOf: string | null = null;
      let expertsCount = 1;

      // If duplicate found from different agent, make it VIP
      if (existingSignals && existingSignals.length > 0) {
        const existingSignal = existingSignals[0];
        
        if (existingSignal.agent_id !== agentId) {
          isAutoVip = true;
          autoVipReason = `Multiple analysts agree on this trade (${existingSignals.length + 1} confirmations)`;
          duplicateOf = existingSignal.id;
          expertsCount = (existingSignal.experts_count || 1) + 1;
          
          // Update the original signal to VIP
          await supabase
            .from('signals')
            .update({
              is_vip: true,
              auto_vip_reason: autoVipReason,
              experts_count: expertsCount,
            })
            .eq('id', existingSignal.id);
          
          toast.success(`🔥 Auto-VIP: ${expertsCount} analysts agree on ${newSignal.symbol}!`);
        }
      }

      const { error } = await supabase
        .from('signals')
        .insert({
          symbol: symbolToUse,
          signal_type: newSignal.direction,
          entry_price: parseFloat(newSignal.entry_price),
          stop_loss: parseFloat(newSignal.stop_loss),
          take_profit: parseFloat(newSignal.take_profit),
          take_profit_2: newSignal.take_profit_2 ? parseFloat(newSignal.take_profit_2) : null,
          take_profit_3: newSignal.take_profit_3 ? parseFloat(newSignal.take_profit_3) : null,
          confidence_score: newSignal.confidence,
          ai_reasoning: newSignal.analysis || null,
          milestone: 'M1',
          is_public: true,
          agent_id: agentId,
          agent_notes: newSignal.agent_notes || null,
          trade_type: newSignal.trade_type,
          is_vip: isAutoVip,
          auto_vip_reason: autoVipReason,
          duplicate_of: duplicateOf,
          experts_count: expertsCount,
          image_url: newSignal.image_url,
          // Enable trade management
          trade_state: 'pending',
        });

      if (error) throw error;

      // Update agent stats
      const { data: existingStats } = await supabase
        .from('agent_stats')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (existingStats) {
        await supabase
          .from('agent_stats')
          .update({
            total_signals_posted: (existingStats.total_signals_posted || 0) + 1,
            last_signal_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('agent_id', agentId);
      } else {
        await supabase
          .from('agent_stats')
          .insert({
            agent_id: agentId,
            total_signals_posted: 1,
            last_signal_at: new Date().toISOString(),
          });
      }

      toast.success('Signal created with auto-management!');
      setShowCreateForm(false);
      setUseCustomSymbol(false);
      setCustomSymbol('');
      setNewSignal({
        symbol: 'EURUSD',
        direction: 'BUY',
        entry_price: '',
        stop_loss: '',
        take_profit: '',
        take_profit_2: '',
        take_profit_3: '',
        confidence: 75,
        analysis: '',
        agent_notes: '',
        trade_type: 'intraday',
        image_url: null,
      });
      fetchSignals();
    } catch (error: any) {
      console.error('Error creating signal:', error);
      toast.error(error.message || 'Failed to create signal');
    } finally {
      setIsSubmitting(false);
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
    if (filter === 'mine') return signal.agent_id === agentId;
    if (filter === 'pending') return signal.outcome === 'pending';
    if (filter === 'completed') return signal.outcome !== 'pending';
    return true;
  });

  // Stats for current agent
  const mySignals = signals.filter(s => s.agent_id === agentId);
  const myWins = mySignals.filter(s => s.outcome === 'target_hit').length;
  const myLosses = mySignals.filter(s => s.outcome === 'stop_loss_hit').length;
  const myWinRate = mySignals.length > 0 ? ((myWins / (myWins + myLosses)) * 100 || 0).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Create Signal Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-primary to-blue-600"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'New Signal'}
        </Button>
      </div>

      {/* Create Signal Form */}
      {showCreateForm && (
        <Card className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              Create New Signal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Symbol</Label>
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">Custom</Label>
                    <Switch
                      checked={useCustomSymbol}
                      onCheckedChange={setUseCustomSymbol}
                      className="scale-75"
                    />
                  </div>
                </div>
                {useCustomSymbol ? (
                  <Input
                    placeholder="Enter symbol"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    className="h-9 uppercase"
                  />
                ) : (
                  <Select value={newSignal.symbol} onValueChange={(v) => setNewSignal({ ...newSignal, symbol: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      <SelectItem value="header-forex" disabled className="font-semibold text-primary text-xs">— Forex —</SelectItem>
                      {CURRENCY_PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="header-crypto" disabled className="font-semibold text-primary text-xs">— Crypto —</SelectItem>
                      {CRYPTO_PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="header-indices" disabled className="font-semibold text-primary text-xs">— Indices —</SelectItem>
                      {INDICES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="header-commodities" disabled className="font-semibold text-primary text-xs">— Commodities —</SelectItem>
                      {COMMODITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="text-xs">Direction</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={newSignal.direction === 'BUY' ? 'default' : 'outline'}
                    className={newSignal.direction === 'BUY' ? 'bg-success hover:bg-success/90 flex-1' : 'flex-1'}
                    onClick={() => setNewSignal({ ...newSignal, direction: 'BUY' })}
                  >
                    BUY
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={newSignal.direction === 'SELL' ? 'default' : 'outline'}
                    className={newSignal.direction === 'SELL' ? 'bg-risk hover:bg-risk/90 flex-1' : 'flex-1'}
                    onClick={() => setNewSignal({ ...newSignal, direction: 'SELL' })}
                  >
                    SELL
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Entry Price *</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08500"
                  value={newSignal.entry_price}
                  onChange={(e) => setNewSignal({ ...newSignal, entry_price: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Trade Type</Label>
                <Select value={newSignal.trade_type} onValueChange={(v) => setNewSignal({ ...newSignal, trade_type: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scalp">Scalp</SelectItem>
                    <SelectItem value="intraday">Intraday</SelectItem>
                    <SelectItem value="swing">Swing</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs">Stop Loss *</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08300"
                  value={newSignal.stop_loss}
                  onChange={(e) => setNewSignal({ ...newSignal, stop_loss: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">TP1 * (33%)</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08900"
                  value={newSignal.take_profit}
                  onChange={(e) => setNewSignal({ ...newSignal, take_profit: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">TP2 (33%)</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.09200"
                  value={newSignal.take_profit_2}
                  onChange={(e) => setNewSignal({ ...newSignal, take_profit_2: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">TP3 (Runner)</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.09500"
                  value={newSignal.take_profit_3}
                  onChange={(e) => setNewSignal({ ...newSignal, take_profit_3: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Confidence: {newSignal.confidence}%</Label>
                <Input
                  type="range"
                  min={50}
                  max={100}
                  value={newSignal.confidence}
                  onChange={(e) => setNewSignal({ ...newSignal, confidence: parseInt(e.target.value) })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Analysis / Reasoning</Label>
                <Textarea
                  placeholder="Market analysis..."
                  value={newSignal.analysis}
                  onChange={(e) => setNewSignal({ ...newSignal, analysis: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Agent Notes (visible to users)</Label>
                <Textarea
                  placeholder="Notes for users..."
                  value={newSignal.agent_notes}
                  onChange={(e) => setNewSignal({ ...newSignal, agent_notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  Chart Screenshot
                </Label>
                <SignalImageUpload
                  imageUrl={newSignal.image_url}
                  onImageChange={(url) => setNewSignal({ ...newSignal, image_url: url })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateSignal} disabled={isSubmitting || !newSignal.entry_price}>
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Signal'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Signals List */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            All Signals
            <Badge variant="outline" className="ml-2">{filteredSignals.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="mine">My Signals</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchSignals} className="h-8">
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
              No signals found
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-white/5">
                {filteredSignals.map((signal) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 hover:bg-white/5 transition-colors cursor-pointer ${
                      selectedSignal?.id === signal.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                    onClick={() => handleSelectSignal(signal)}
                  >
                    <div className="flex items-center justify-between">
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
                            {signal.is_vip && (
                              <Crown className="w-3 h-3 text-amber-500" />
                            )}
                            {signal.auto_vip_reason && (
                              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">
                                Auto-VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {signal.agent?.name || 'Unknown'} • {format(new Date(signal.created_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getOutcomeBadge(signal.outcome)}
                      </div>
                    </div>
                    {signal.agent_notes && (
                      <div className="mt-2 text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        📝 {signal.agent_notes}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Signal Details & Comments */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4 text-primary" />
            Signal Details & Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSignal ? (
            <div className="space-y-4">
              {/* Signal Info */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{selectedSignal.symbol}</span>
                    <Badge variant={selectedSignal.signal_type === 'BUY' ? 'default' : 'destructive'}>
                      {selectedSignal.signal_type}
                    </Badge>
                    {selectedSignal.is_vip && <Crown className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    {selectedSignal.agent_id === agentId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSignal(selectedSignal.id)}
                        className="h-7 w-7 p-0 text-risk hover:text-risk"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Entry</p>
                    <p className="font-medium">{selectedSignal.entry_price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Stop Loss</p>
                    <p className="font-medium text-risk">{selectedSignal.stop_loss || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Take Profit</p>
                    <p className="font-medium text-success">{selectedSignal.take_profit || '-'}</p>
                  </div>
                </div>
                {selectedSignal.agent_notes && (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400">{selectedSignal.agent_notes}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
              {['target_hit', 'stop_loss_hit', 'breakeven', 'cancelled'].map((outcome) => (
                  <Button
                    key={outcome}
                    variant={selectedSignal.outcome === outcome ? 'default' : 'outline'}
                    size="sm"
                    onClick={async () => {
                      const { error } = await supabase
                        .from('signals')
                        .update({ outcome: outcome as 'target_hit' | 'stop_loss_hit' | 'breakeven' | 'cancelled' })
                        .eq('id', selectedSignal.id);
                      if (!error) {
                        toast.success('Outcome updated');
                        await updateAgentStats(agentId, outcome);
                        fetchSignals();
                      }
                    }}
                    className={
                      outcome === 'target_hit' ? 'border-success text-success hover:bg-success/10' :
                      outcome === 'stop_loss_hit' ? 'border-risk text-risk hover:bg-risk/10' :
                      outcome === 'breakeven' ? 'border-muted-foreground' :
                      'border-warning text-warning'
                    }
                  >
                    {outcome === 'target_hit' ? 'Won' :
                     outcome === 'stop_loss_hit' ? 'Lost' :
                     outcome === 'breakeven' ? 'BE' : 'Cancel'}
                  </Button>
                ))}
              </div>

              {/* Comments */}
              <div>
                <Label className="text-sm mb-2 block">Comments Thread</Label>
                <ScrollArea className="h-[150px] border border-white/10 rounded-lg p-2 mb-2">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-2 rounded bg-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{comment.agent?.name || 'Agent'}</span>
                            <Badge variant="outline" className={`text-[10px] ${
                              COMMENT_TYPES.find(t => t.value === comment.comment_type)?.color || ''
                            }`}>
                              {COMMENT_TYPES.find(t => t.value === comment.comment_type)?.label || comment.comment_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Add Comment */}
                <div className="flex gap-2">
                  <Select value={commentType} onValueChange={setCommentType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className={type.color}>{type.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Select a signal to view details</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Signal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stop Loss</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={editForm.stop_loss}
                  onChange={(e) => setEditForm({ ...editForm, stop_loss: e.target.value })}
                />
              </div>
              <div>
                <Label>Take Profit</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={editForm.take_profit}
                  onChange={(e) => setEditForm({ ...editForm, take_profit: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Outcome</Label>
              <Select value={editForm.outcome} onValueChange={(v) => setEditForm({ ...editForm, outcome: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="target_hit">Won (Target Hit)</SelectItem>
                  <SelectItem value="stop_loss_hit">Lost (Stop Loss)</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>P&L ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editForm.pnl}
                onChange={(e) => setEditForm({ ...editForm, pnl: e.target.value })}
              />
            </div>

            <div>
              <Label>Agent Notes (visible to users)</Label>
              <Textarea
                placeholder="Add notes for users (e.g., exit signal, hold, etc.)"
                value={editForm.agent_notes}
                onChange={(e) => setEditForm({ ...editForm, agent_notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateSignal} disabled={isSubmitting} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default AgentSignalManagement;
