import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  X,
  Eye,
  Send,
  RefreshCw,
  MessageSquare,
  Target,
  Shield,
  AlertTriangle,
  DollarSign,
  LineChart,
  Bitcoin,
  Users,
  Crown,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { format } from 'date-fns';
import { ConfluenceScoreDisplay } from '@/components/signals/ConfluenceScoreDisplay';

interface InstitutionalSignal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number | null;
  take_profit_3: number | null;
  confidence: number;
  confluence_score: number;
  htf_bias: string;
  ltf_entry: string;
  analysis_mode: string;
  reasoning: string;
  kill_zone: string;
  send_to_users: boolean;
  sent_at: string | null;
  outcome: string;
  created_at: string;
  timeframe: string;
  htf_timeframe: string;
  ltf_timeframe: string;
  risk_reward_ratio: number;
  pips_to_sl: number;
  pips_to_tp1: number;
  signal_status?: string;
  sent_to_agents: boolean;
  sent_to_agents_at: string | null;
  agent_reviewed: boolean;
  reviewed_by_agent_id: string | null;
  agent_review_notes: string | null;
  agent_approved: boolean | null;
  // New VIP fields
  is_vip?: boolean;
  vip_vote_count?: number;
  reviewer_names?: string[];
  vip_approved_at?: string | null;
}

interface VipVote {
  id: string;
  signal_id: string;
  agent_id: string;
  is_vip_worthy: boolean;
  notes: string | null;
  created_at: string;
}

interface AgentBotSignalsReviewProps {
  agentId: string;
}

const FUTURES_SYMBOLS = ['NQ', 'ES', 'YM', 'RTY', 'GC', 'SI', 'CL', 'NG', 'ZB', 'ZN'];
const CRYPTO_SYMBOLS = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD', 'MATICUSD'];

const AgentBotSignalsReview = ({ agentId }: AgentBotSignalsReviewProps) => {
  const [signals, setSignals] = useState<InstitutionalSignal[]>([]);
  const [allSignals, setAllSignals] = useState<InstitutionalSignal[]>([]); // For accurate counts
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<InstitutionalSignal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [vipVotes, setVipVotes] = useState<Record<string, VipVote[]>>({});
  const [myVipVotes, setMyVipVotes] = useState<Record<string, boolean>>({});
  const [isVotingVip, setIsVotingVip] = useState(false);

  const getInstrumentType = (symbol: string): 'forex' | 'futures' | 'crypto' => {
    if (FUTURES_SYMBOLS.includes(symbol)) return 'futures';
    if (CRYPTO_SYMBOLS.includes(symbol)) return 'crypto';
    return 'forex';
  };

  // Fetch all signals for accurate counts (separate from filtered signals)
  const fetchAllSignalsForCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('institutional_signals' as any)
        .select('id, agent_reviewed, agent_approved, is_vip')
        .eq('sent_to_agents', true)
        .order('sent_to_agents_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAllSignals((data as unknown as InstitutionalSignal[]) || []);
    } catch (error) {
      console.error('Error fetching all signals for counts:', error);
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      let query = supabase
        .from('institutional_signals' as any)
        .select('*')
        .eq('sent_to_agents', true)
        .order('sent_to_agents_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('agent_reviewed', false);
      } else if (filter === 'reviewed') {
        query = query.eq('agent_reviewed', true);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setSignals((data as unknown as InstitutionalSignal[]) || []);
      
      // Fetch VIP votes for reviewed signals
      if (data && data.length > 0) {
        const signalIds = data.map((s: any) => s.id);
        const { data: votesData } = await supabase
          .from('signal_vip_votes' as any)
          .select('*')
          .in('signal_id', signalIds);
        
        // Group votes by signal_id
        const votesMap: Record<string, VipVote[]> = {};
        const myVotesMap: Record<string, boolean> = {};
        (votesData || []).forEach((v: any) => {
          if (!votesMap[v.signal_id]) votesMap[v.signal_id] = [];
          votesMap[v.signal_id].push(v);
          if (v.agent_id === agentId) {
            myVotesMap[v.signal_id] = v.is_vip_worthy;
          }
        });
        setVipVotes(votesMap);
        setMyVipVotes(myVotesMap);
      }
    } catch (error) {
      console.error('Error fetching bot signals:', error);
      toast.error('Failed to fetch bot signals');
    } finally {
      setIsLoading(false);
    }
  }, [filter, agentId]);

  useEffect(() => {
    fetchAllSignalsForCounts();
  }, [fetchAllSignalsForCounts]);

  useEffect(() => {
    fetchSignals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('agent-bot-signals-review')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'institutional_signals',
        filter: 'sent_to_agents=eq.true'
      }, () => {
        fetchSignals();
        fetchAllSignalsForCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals, fetchAllSignalsForCounts]);

  const handleReview = async (approved: boolean) => {
    if (!selectedSignal) return;

    setIsSubmitting(true);
    try {
      // Get agent name for reviewer_names
      const { data: agentData } = await supabase
        .from('admin_agents')
        .select('name')
        .eq('id', agentId)
        .single();
      
      const agentName = agentData?.name || 'Agent';
      
      const updates: any = {
        agent_reviewed: true,
        reviewed_by_agent_id: agentId,
        agent_review_notes: reviewNotes || null,
        agent_approved: approved,
      };

      // If approved, also send to users and set initial reviewer
      if (approved) {
        updates.send_to_users = true;
        updates.sent_at = new Date().toISOString();
        updates.reviewer_names = [agentName];
        updates.vip_vote_count = 0;
      }

      const { error } = await supabase
        .from('institutional_signals' as any)
        .update(updates)
        .eq('id', selectedSignal.id);

      if (error) throw error;

      // Update agent_stats for this review
      await updateAgentStats(agentId);

      // If approved, trigger email and in-app notifications for all users
      if (approved) {
        try {
          await callEdgeFunction('send-signal-notification', {
            signal: {
              id: selectedSignal.id,
              symbol: selectedSignal.symbol,
              signal_type: selectedSignal.direction,
              entry_price: selectedSignal.entry_price,
              stop_loss: selectedSignal.stop_loss,
              take_profit: selectedSignal.take_profit_1,
              ai_reasoning: selectedSignal.reasoning,
              is_vip: selectedSignal.is_vip || false,
            },
          });
          console.log('Signal notification sent to all users');
        } catch (notifyError) {
          console.error('Failed to send signal notification:', notifyError);
          // Don't fail the approval if notification fails
        }
      }

      toast.success(approved ? 'Signal approved and sent to users!' : 'Signal rejected');
      setSelectedSignal(null);
      setReviewNotes('');
      fetchSignals();
      fetchAllSignalsForCounts();
    } catch (error) {
      console.error('Error reviewing signal:', error);
      toast.error('Failed to review signal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to update agent stats
  const updateAgentStats = async (agentId: string) => {
    try {
      // Get current counts of signals reviewed by this agent
      const { data: reviewedSignals } = await supabase
        .from('institutional_signals' as any)
        .select('outcome')
        .eq('reviewed_by_agent_id', agentId);

      const totalReviewed = reviewedSignals?.length || 0;
      const wins = reviewedSignals?.filter((s: any) => s.outcome === 'win' || s.outcome === 'target_hit').length || 0;
      const losses = reviewedSignals?.filter((s: any) => s.outcome === 'loss' || s.outcome === 'stopped_out').length || 0;

      // Check if stats exist
      const { data: existing } = await supabase
        .from('agent_stats')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      const statsUpdate = {
        total_signals_posted: totalReviewed,
        winning_signals: wins,
        losing_signals: losses,
        last_signal_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabase
          .from('agent_stats')
          .update(statsUpdate)
          .eq('agent_id', agentId);
      } else {
        await supabase
          .from('agent_stats')
          .insert({
            agent_id: agentId,
            ...statsUpdate,
            clients_handled: 0,
            breakeven_signals: 0
          });
      }
    } catch (err) {
      console.error('Error updating agent stats:', err);
    }
  };

  // VIP voting function
  const handleVipVote = async (signalId: string, isVipWorthy: boolean) => {
    setIsVotingVip(true);
    try {
      // Upsert the vote (insert or update if exists)
      const { error } = await supabase
        .from('signal_vip_votes' as any)
        .upsert({
          signal_id: signalId,
          agent_id: agentId,
          is_vip_worthy: isVipWorthy,
          notes: null,
        }, { onConflict: 'signal_id,agent_id' });

      if (error) throw error;

      // Update local state
      setMyVipVotes(prev => ({
        ...prev,
        [signalId]: isVipWorthy
      }));

      toast.success(isVipWorthy ? 'Voted as VIP worthy!' : 'VIP vote removed');
      fetchSignals(); // Refresh to get updated vote counts
    } catch (error) {
      console.error('Error voting for VIP:', error);
      toast.error('Failed to submit VIP vote');
    } finally {
      setIsVotingVip(false);
    }
  };

  // Use allSignals for accurate counts across all tabs
  const pendingCount = allSignals.filter(s => !s.agent_reviewed).length;
  const reviewedCount = allSignals.filter(s => s.agent_reviewed).length;
  const approvedCount = allSignals.filter(s => s.agent_approved === true).length;
  const vipCount = allSignals.filter(s => s.is_vip === true).length;
  const totalCount = allSignals.length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Reviewed</p>
            <p className="text-2xl font-bold">{reviewedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-success">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-destructive">{reviewedCount - approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-amber-400">VIP Signals</p>
            <p className="text-2xl font-bold text-amber-400">{vipCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filter === 'reviewed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('reviewed')}
        >
          <Check className="w-4 h-4 mr-2" />
          Reviewed ({reviewedCount})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({totalCount})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSignals}
          className="ml-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Signals List */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No bot signals to review</p>
          <p className="text-sm mt-1">Signals will appear here when the bot sends them for review</p>
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {signals.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`bg-card/50 border-white/10 hover:border-primary/30 transition-all cursor-pointer ${
                  signal.agent_approved === true ? 'border-success/30' :
                  signal.agent_approved === false ? 'border-destructive/30' :
                  'border-warning/30'
                }`}
                onClick={() => {
                  setSelectedSignal(signal);
                  setReviewNotes(signal.agent_review_notes || '');
                }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {signal.direction === 'BUY' ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                          <span className="font-bold">{signal.symbol}</span>
                          <Badge variant={signal.direction === 'BUY' ? 'default' : 'destructive'}>
                            {signal.direction}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              getInstrumentType(signal.symbol) === 'forex' 
                                ? 'border-green-500/30 text-green-400' 
                                : getInstrumentType(signal.symbol) === 'futures'
                                ? 'border-orange-500/30 text-orange-400'
                                : 'border-yellow-500/30 text-yellow-400'
                            }
                          >
                            {getInstrumentType(signal.symbol) === 'forex' && <DollarSign className="w-3 h-3 mr-1" />}
                            {getInstrumentType(signal.symbol) === 'futures' && <LineChart className="w-3 h-3 mr-1" />}
                            {getInstrumentType(signal.symbol) === 'crypto' && <Bitcoin className="w-3 h-3 mr-1" />}
                            {getInstrumentType(signal.symbol).toUpperCase()}
                          </Badge>
                        </div>
                        <ConfluenceScoreDisplay score={signal.confluence_score} />
                        {signal.kill_zone && (
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                            {signal.kill_zone}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {signal.agent_reviewed ? (
                          signal.agent_approved ? (
                            <Badge className="bg-success/20 text-success">
                              <Check className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/20 text-destructive">
                              <X className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-warning/20 text-warning">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(signal.sent_to_agents_at || signal.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>{' '}
                        <span className="font-mono">{signal.entry_price}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SL:</span>{' '}
                        <span className="font-mono text-destructive">{signal.stop_loss}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">TP1:</span>{' '}
                        <span className="font-mono text-success">{signal.take_profit_1}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">R:R:</span>{' '}
                        <span className="font-mono">{signal.risk_reward_ratio?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                    {signal.reasoning && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{signal.reasoning}</p>
                    )}
                    
                    {/* Reviewer info and VIP voting for reviewed signals */}
                    {signal.agent_reviewed && signal.agent_approved && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {signal.reviewer_names && signal.reviewer_names.length > 0 ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>Reviewed by: {signal.reviewer_names.join(', ')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>Reviewed</span>
                            </div>
                          )}
                          
                          {/* VIP badge if already VIP */}
                          {signal.is_vip && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              ⭐ VIP
                            </Badge>
                          )}
                          
                          {/* VIP vote count */}
                          {(signal.vip_vote_count || 0) > 0 && !signal.is_vip && (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                              {signal.vip_vote_count}/3 VIP votes
                            </Badge>
                          )}
                        </div>
                        
                        {/* VIP Vote Button */}
                        <Button
                          size="sm"
                          variant={myVipVotes[signal.id] ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVipVote(signal.id, !myVipVotes[signal.id]);
                          }}
                          disabled={isVotingVip || signal.is_vip}
                          className={myVipVotes[signal.id] 
                            ? "bg-amber-500 hover:bg-amber-600 text-black" 
                            : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          }
                        >
                          {signal.is_vip ? (
                            <>⭐ VIP Approved</>
                          ) : myVipVotes[signal.id] ? (
                            <>⭐ Voted VIP</>
                          ) : (
                            <>Vote as VIP</>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSignal?.direction === 'BUY' ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
              Review Signal: {selectedSignal?.symbol} {selectedSignal?.direction}
            </DialogTitle>
          </DialogHeader>

          {selectedSignal && (
            <div className="space-y-4">
              {/* Signal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Price:</span>
                    <span className="font-mono">{selectedSignal.entry_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <span className="font-mono text-destructive">{selectedSignal.stop_loss}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Take Profit 1:</span>
                    <span className="font-mono text-success">{selectedSignal.take_profit_1}</span>
                  </div>
                  {selectedSignal.take_profit_2 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Take Profit 2:</span>
                      <span className="font-mono text-success">{selectedSignal.take_profit_2}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confluence Score:</span>
                    <span className="font-bold">{selectedSignal.confluence_score}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span>{selectedSignal.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk/Reward:</span>
                    <span>{selectedSignal.risk_reward_ratio?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kill Zone:</span>
                    <span>{selectedSignal.kill_zone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              {selectedSignal.reasoning && (
                <div>
                  <Label className="text-muted-foreground">Bot Analysis</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/10 rounded-lg">{selectedSignal.reasoning}</p>
                </div>
              )}

              {/* HTF/LTF Bias */}
              <div className="grid grid-cols-2 gap-4">
                {selectedSignal.htf_bias && (
                  <div>
                    <Label className="text-muted-foreground">HTF Bias ({selectedSignal.htf_timeframe})</Label>
                    <p className="text-sm mt-1">{selectedSignal.htf_bias}</p>
                  </div>
                )}
                {selectedSignal.ltf_entry && (
                  <div>
                    <Label className="text-muted-foreground">LTF Entry ({selectedSignal.ltf_timeframe})</Label>
                    <p className="text-sm mt-1">{selectedSignal.ltf_entry}</p>
                  </div>
                )}
              </div>

              {/* Review Notes */}
              <div>
                <Label>Review Notes (Optional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this signal..."
                  className="mt-1"
                  rows={3}
                  disabled={selectedSignal.agent_reviewed}
                />
              </div>

              {selectedSignal.agent_reviewed && selectedSignal.agent_review_notes && (
                <div className="p-3 bg-muted/10 rounded-lg">
                  <Label className="text-muted-foreground">Previous Review Notes</Label>
                  <p className="text-sm mt-1">{selectedSignal.agent_review_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!selectedSignal?.agent_reviewed ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(false)}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview(true)}
                  disabled={isSubmitting}
                  className="bg-success hover:bg-success/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Approve & Send to Users
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedSignal(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentBotSignalsReview;
