import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle, Lock, Crown, Shield, Zap, Trophy, ChevronRight, ChevronDown, Sparkles, BookOpen, Bot, DollarSign, X, Scale, Bell, BellOff, Volume2, VolumeX, Filter, Play, History, Globe, Calendar, Image as ImageIcon, MessageSquare, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MilestoneCelebration from '@/components/dashboard/MilestoneCelebration';
import { TradeReplayModal } from '@/components/dashboard/TradeReplayModal';
import { calculateLotSizeAndPL, formatPnL, getOutcomePnL } from '@/services/tradingCalculator';
import useSignalNotifications from '@/hooks/useSignalNotifications';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import ConsentGate from '@/components/dashboard/ConsentGate';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { format, isAfter, subDays, subHours } from 'date-fns';
import SignalImageDisplay from '@/components/signals/SignalImageDisplay';
import { ConfluenceScoreDisplay } from '@/components/signals/ConfluenceScoreDisplay';
import { useTradingLock } from '@/hooks/useTradingLock';
import TradingLockedOverlay from '@/components/dashboard/TradingLockedOverlay';
type TradeOutcome = 'target_hit' | 'stop_loss_hit' | 'breakeven' | 'custom';

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confluence_score: number;
  ai_reasoning: string;
  milestone: string;
  created_at: string;
  taken_by_user: boolean;
  outcome?: string | null;
  pnl?: number | null;
  final_r_multiple?: number | null;
  user_id?: string | null;
  is_vip?: boolean;
  reviewed_by?: string[];
  vip_notes?: string;
  trade_type?: string;
  agent_notes?: string | null;
  auto_vip_reason?: string | null;
  image_url?: string | null;
}

interface SignalComment {
  id: string;
  signal_id: string;
  comment: string;
  comment_type: string;
  created_at: string;
  agent_name?: string;
}

interface SignalMessage {
  id: string;
  signal_id: string;
  message_type: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface MilestoneConfig {
  id: string;
  name: string;
  description: string;
  targetWinRate: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  minConfidence: number;
  maxConfidence: number;
}

const MILESTONE_CONFIGS: MilestoneConfig[] = [
  {
    id: 'M1',
    name: 'Milestone 1',
    description: '1-Step Challenge',
    targetWinRate: '~90%',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-500/30',
    icon: <Shield className="w-5 h-5" />,
    minConfidence: 80,
    maxConfidence: 100,
  },
  {
    id: 'M2',
    name: 'Milestone 2',
    description: '2-Step Challenge',
    targetWinRate: '~60%',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    icon: <Target className="w-5 h-5" />,
    minConfidence: 60,
    maxConfidence: 79,
  },
  {
    id: 'M3',
    name: 'Milestone 3',
    description: '3-Step Challenge',
    targetWinRate: '~40%',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500/30',
    icon: <TrendingUp className="w-5 h-5" />,
    minConfidence: 40,
    maxConfidence: 59,
  },
  {
    id: 'M4',
    name: 'Milestone 4',
    description: 'Evaluation/Instant',
    targetWinRate: '~25-30%',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-500/30',
    icon: <Zap className="w-5 h-5" />,
    minConfidence: 0,
    maxConfidence: 39,
  }
];

const SignalsFeedTab = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('ALL');
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [signalsTakenToday, setSignalsTakenToday] = useState(0);
  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>(['M1']);
  const [totalPnl, setTotalPnl] = useState(0);
  const [accountSize, setAccountSize] = useState(10000);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<MilestoneConfig | null>(null);
  const [tradeOutcomes, setTradeOutcomes] = useState<Record<string, { outcome: TradeOutcome; pnl: number }>>({});
  const [showCustomPnlInput, setShowCustomPnlInput] = useState<string | null>(null);
  const [customPnl, setCustomPnl] = useState('');
  const [minRiskReward, setMinRiskReward] = useState<number>(0);
  const [showRRFilter, setShowRRFilter] = useState(false);
  const [replaySignal, setReplaySignal] = useState<Signal | null>(null);
  const [takenSignalIds, setTakenSignalIds] = useState<Set<string>>(new Set());
  const [activeSignalTab, setActiveSignalTab] = useState<'live' | 'taken'>('live');
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const previousMilestonesRef = useRef<string[]>(['M1']);
  const [signalComments, setSignalComments] = useState<Record<string, SignalComment[]>>({});
  const [signalMessages, setSignalMessages] = useState<Record<string, SignalMessage[]>>({});
  const [showMessages, setShowMessages] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedClosedCards, setExpandedClosedCards] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const features = usePlanFeatures();
  const navigate = useNavigate();
  const { isEnabled: notificationsEnabled, isSoundEnabled, enableNotifications, disableNotifications, enableSound, disableSound, isSupported } = useSignalNotifications();
  const { playNotificationSound } = useNotificationSound();
  const { formatToUserTimezone, formatRelativeTime, getTimezoneAbbr } = useUserTimezone();
  const { isLocked: isTradingLocked, lockUntil: tradingLockUntil, lockReason: tradingLockReason, accountId: lockedAccountId, refetch: refetchLockStatus } = useTradingLock();
  
  // Check if user has VIP access (Pro or Enterprise)
  const hasVipAccess = features.planName === 'Pro' || features.planName === 'Enterprise';

  // Check for new milestone unlocks and trigger celebration (only once per login session)
  const checkMilestoneUnlock = useCallback(async (newMilestones: string[], pnl: number) => {
    if (!user) return;

    const initKey = `milestones_initialized_session_${user.id}`;
    const hasInitializedThisSession = sessionStorage.getItem(initKey) === 'true';

    const prevMilestones = previousMilestonesRef.current;

    // On first load in this browser session (or after a remount), just sync state
    // so we don't re-celebrate already-unlocked milestones on reload/tab switching.
    if (
      !hasInitializedThisSession ||
      (prevMilestones.length === 1 && prevMilestones[0] === 'M1' && newMilestones.length > 1)
    ) {
      sessionStorage.setItem(initKey, 'true');
      previousMilestonesRef.current = newMilestones;
      localStorage.setItem(`accessible_milestones_${user.email}`, JSON.stringify(newMilestones));
      return;
    }

    const newlyUnlocked = newMilestones.filter(m => !prevMilestones.includes(m));

    if (newlyUnlocked.length > 0) {
      const latestMilestone = newlyUnlocked[newlyUnlocked.length - 1];
      const milestoneConfig = MILESTONE_CONFIGS.find(m => m.id === latestMilestone);

      if (milestoneConfig) {
        // Check if celebration was already shown this session
        const celebratedKey = `milestone_celebrated_session_${user.id}_${latestMilestone}`;
        const alreadyCelebrated = sessionStorage.getItem(celebratedKey);

        if (!alreadyCelebrated) {
          sessionStorage.setItem(celebratedKey, 'true');

          setCelebrationMilestone(milestoneConfig);
          setShowCelebration(true);

          toast.success(`🎉 ${milestoneConfig.name} Unlocked!`, {
            description: `Congratulations! You've unlocked ${milestoneConfig.description}`,
            duration: 5000,
          });

          // Send email notification
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name')
              .eq('user_id', user.id)
              .single();

            const nextMilestoneIndex = MILESTONE_CONFIGS.findIndex(m => m.id === latestMilestone) + 1;
            const nextMilestoneTarget = nextMilestoneIndex < MILESTONE_CONFIGS.length
              ? accountSize * (0.05 * (nextMilestoneIndex + 1))
              : null;

            await callEdgeFunction('send-milestone-notification', {
              email: user.email,
              userName: profile?.first_name || user.email?.split('@')[0],
              milestoneName: milestoneConfig.name,
              milestoneDescription: milestoneConfig.description,
              currentPnl: pnl,
              nextMilestoneTarget,
            });
          } catch (error) {
            console.error('Error sending milestone notification:', error);
          }
        }
      }
    }

    // Persist + update refs
    localStorage.setItem(`accessible_milestones_${user.email}`, JSON.stringify(newMilestones));
    previousMilestonesRef.current = newMilestones;
  }, [user, accountSize]);

  // Fetch user's signup date and taken signals on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Get user profile creation date
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.created_at) {
        setUserCreatedAt(new Date(profile.created_at));
      }
      
      // Fetch user's signal actions (per-user tracking)
      const { data } = await supabase
        .from('user_signal_actions')
        .select('signal_id, outcome, pnl')
        .eq('user_id', user.id);
      
      if (data) {
        setTakenSignalIds(new Set(data.map(s => s.signal_id)));
        // Also populate trade outcomes from existing actions
        const outcomes: Record<string, { outcome: TradeOutcome; pnl: number }> = {};
        data.forEach(action => {
          if (action.outcome && action.pnl !== null) {
            outcomes[action.signal_id] = { 
              outcome: action.outcome as TradeOutcome, 
              pnl: action.pnl 
            };
          }
        });
        setTradeOutcomes(outcomes);
      }
    };
    
    fetchUserData();
    fetchSignals();
    fetchUserProgress();
    
    const channel = supabase
      .channel('signals-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'institutional_signals'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newSignal = payload.new as any;
          // Only add if sent to users and approved by agent
          if (!newSignal.send_to_users || !newSignal.agent_approved) return;
          
          const mappedSignal: Signal = {
            id: newSignal.id,
            symbol: newSignal.symbol,
            signal_type: newSignal.direction,
            entry_price: newSignal.entry_price,
            stop_loss: newSignal.stop_loss,
            take_profit: newSignal.take_profit_1,
            confluence_score: newSignal.confluence_score || 5,
            ai_reasoning: newSignal.reasoning,
            milestone: newSignal.timeframe === '15m' ? 'M1' : newSignal.timeframe === '1H' ? 'M2' : 'M3',
            created_at: newSignal.created_at,
            taken_by_user: false,
            outcome: newSignal.outcome || 'pending',
            pnl: newSignal.final_pnl,
            is_vip: newSignal.is_vip || false,
            reviewed_by: newSignal.reviewer_names || [],
            vip_notes: newSignal.agent_review_notes,
            trade_type: newSignal.analysis_mode,
            agent_notes: newSignal.reasoning,
            image_url: null,
          };
          setSignals(prev => [mappedSignal, ...prev]);
          
          // Play notification sound and show toast for new signal
          if (isSoundEnabled) {
            playNotificationSound();
          }
          const signalIcon = newSignal.direction === 'BUY' ? '📈' : '📉';
          const vipBadge = newSignal.is_vip ? '⭐ VIP ' : '';
          toast.success(`${signalIcon} ${vipBadge}New ${newSignal.direction} Signal: ${newSignal.symbol}`, {
            description: `Entry: ${newSignal.entry_price} | SL: ${newSignal.stop_loss} | TP: ${newSignal.take_profit_1}`,
            duration: 10000,
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as any;
          const old = payload.old as any;
          
          // If no longer approved/sent, remove it
          if (!updated.send_to_users || !updated.agent_approved) {
            setSignals(prev => prev.filter(s => s.id !== updated.id));
            return;
          }
          
          // Check if signal just became approved (wasn't before, now is)
          const justApproved = updated.send_to_users && updated.agent_approved && 
            (!old.send_to_users || !old.agent_approved);
          
          if (justApproved) {
            // Add as new signal if not already in list
            setSignals(prev => {
              if (prev.some(s => s.id === updated.id)) return prev;
              const mappedSignal: Signal = {
                id: updated.id,
                symbol: updated.symbol,
                signal_type: updated.direction,
                entry_price: updated.entry_price,
                stop_loss: updated.stop_loss,
                take_profit: updated.take_profit_1,
                confluence_score: updated.confluence_score || 5,
                ai_reasoning: updated.reasoning,
                milestone: updated.timeframe === '15m' ? 'M1' : updated.timeframe === '1H' ? 'M2' : 'M3',
                created_at: updated.created_at,
                taken_by_user: false,
                outcome: updated.outcome || 'pending',
                pnl: updated.final_pnl,
                is_vip: updated.is_vip || false,
                reviewed_by: updated.reviewer_names || [],
                vip_notes: updated.agent_review_notes,
                trade_type: updated.analysis_mode,
                agent_notes: updated.reasoning,
                image_url: null,
              };
              return [mappedSignal, ...prev];
            });
            
            // Play notification sound and show toast for newly approved signal
            if (isSoundEnabled) {
              playNotificationSound();
            }
            const signalIcon = updated.direction === 'BUY' ? '📈' : '📉';
            const vipBadge = updated.is_vip ? '⭐ VIP ' : '';
            toast.success(`${signalIcon} ${vipBadge}New ${updated.direction} Signal: ${updated.symbol}`, {
              description: `Entry: ${updated.entry_price} | SL: ${updated.stop_loss} | TP: ${updated.take_profit_1}`,
              duration: 10000,
            });
          } else {
            // Update existing signal
            setSignals(prev => prev.map(s => 
              s.id === updated.id 
                ? {
                    ...s,
                    outcome: updated.outcome,
                    is_vip: updated.is_vip || false,
                    reviewed_by: updated.reviewer_names || [],
                  }
                : s
            ));
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any).id;
          setSignals(prev => prev.filter(s => s.id !== deletedId));
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'signal_messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        setSignalMessages(prev => ({
          ...prev,
          [newMessage.signal_id]: [
            {
              id: newMessage.id,
              signal_id: newMessage.signal_id,
              message_type: newMessage.message_type,
              title: newMessage.title,
              content: newMessage.content,
              metadata: newMessage.metadata,
              created_at: newMessage.created_at,
            },
            ...(prev[newMessage.signal_id] || []),
          ],
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      // Fetch questionnaire for account size
      const { data: questionnaire } = await supabase
        .from('questionnaires')
        .select('account_size, account_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaire) {
        setAccountSize(questionnaire.account_size || 10000);
      }

      // Fetch dashboard data for P&L
      const { data: dashboard } = await supabase
        .from('dashboard_data')
        .select('total_pnl')
        .eq('user_id', user.id)
        .single();

      if (dashboard) {
        const currentPnl = dashboard.total_pnl || 0;
        setTotalPnl(currentPnl);
        // Calculate unlocked milestones based on P&L
        const unlocked = calculateUnlockedMilestones(currentPnl, questionnaire?.account_size || 10000);
        setUnlockedMilestones(unlocked);
        
        // Check for newly unlocked milestones
        checkMilestoneUnlock(unlocked, currentPnl);
      }

      // Load from localStorage as backup
      const storedMilestones = localStorage.getItem(`accessible_milestones_${user.email}`);
      if (storedMilestones) {
        const parsed = JSON.parse(storedMilestones);
        if (parsed.length > unlockedMilestones.length) {
          setUnlockedMilestones(parsed);
        }
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const calculateUnlockedMilestones = (pnl: number, accSize: number): string[] => {
    const thresholds = [
      { id: 'M1', profit: 0 }, // Always unlocked
      { id: 'M2', profit: accSize * 0.05 }, // 5% profit
      { id: 'M3', profit: accSize * 0.10 }, // 10% profit
      { id: 'M4', profit: accSize * 0.15 }, // 15% profit
    ];

    const unlocked: string[] = [];
    for (const threshold of thresholds) {
      if (pnl >= threshold.profit) {
        unlocked.push(threshold.id);
      }
    }
    
    return unlocked.length > 0 ? unlocked : ['M1'];
  };

  const assignMilestone = (confidence: number): string => {
    if (confidence >= 80) return 'M1';
    if (confidence >= 60) return 'M2';
    if (confidence >= 40) return 'M3';
    return 'M4';
  };

  const fetchSignals = async () => {
    try {
      // Fetch from institutional_signals - only those sent to users (approved by agents)
      const { data: institutionalData, error: institutionalError } = await supabase
        .from('institutional_signals' as any)
        .select('*')
        .eq('send_to_users', true)
        .eq('agent_approved', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (institutionalError) throw institutionalError;
      
      // Map institutional signals to the Signal format
      const mappedSignals: Signal[] = ((institutionalData as any[]) || []).map(s => ({
        id: s.id,
        symbol: s.symbol,
        signal_type: s.direction as 'BUY' | 'SELL',
        entry_price: s.entry_price,
        stop_loss: s.stop_loss,
        take_profit: s.take_profit_1,
        confluence_score: s.confluence_score || 5,
        ai_reasoning: s.reasoning,
        milestone: s.timeframe === '15m' ? 'M1' : s.timeframe === '1H' ? 'M2' : 'M3',
        created_at: s.created_at,
        taken_by_user: false,
        outcome: s.outcome || 'pending',
        pnl: s.final_pnl,
        is_vip: s.is_vip || false,
        reviewed_by: s.reviewer_names || [],
        vip_notes: s.agent_review_notes,
        trade_type: s.analysis_mode,
        agent_notes: s.reasoning,
        image_url: null,
      }));
      
      setSignals(mappedSignals);
      
      // Fetch agent comments and signal messages for all signals
      if (mappedSignals.length > 0) {
        const signalIds = mappedSignals.map(s => s.id);
        
        // Fetch comments and messages in parallel
        const [commentsResult, messagesResult] = await Promise.all([
          supabase
            .from('agent_signal_comments')
            .select(`
              id,
              signal_id,
              comment,
              comment_type,
              created_at,
              agent:admin_agents!agent_signal_comments_agent_id_fkey(name)
            `)
            .in('signal_id', signalIds)
            .order('created_at', { ascending: false }),
          supabase
            .from('signal_messages')
            .select('*')
            .in('signal_id', signalIds)
            .order('created_at', { ascending: false })
        ]);
        
        // Group comments by signal_id
        const commentsMap: Record<string, SignalComment[]> = {};
        (commentsResult.data || []).forEach((c: any) => {
          const signalId = c.signal_id;
          if (!commentsMap[signalId]) commentsMap[signalId] = [];
          commentsMap[signalId].push({
            id: c.id,
            signal_id: c.signal_id,
            comment: c.comment,
            comment_type: c.comment_type,
            created_at: c.created_at,
            agent_name: c.agent?.name || 'Analyst',
          });
        });
        setSignalComments(commentsMap);
        
        // Group messages by signal_id
        const messagesMap: Record<string, SignalMessage[]> = {};
        (messagesResult.data || []).forEach((m: any) => {
          const signalId = m.signal_id;
          if (!messagesMap[signalId]) messagesMap[signalId] = [];
          messagesMap[signalId].push({
            id: m.id,
            signal_id: m.signal_id,
            message_type: m.message_type,
            title: m.title,
            content: m.content,
            metadata: m.metadata,
            created_at: m.created_at,
          });
        });
        setSignalMessages(messagesMap);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkOutcome = async (signal: Signal, outcome: TradeOutcome, pnl: number) => {
    if (!user) return;
    
    // Check if signal already taken by THIS user (using per-user tracking)
    if (takenSignalIds.has(signal.id)) {
      toast.error('You have already taken this signal');
      return;
    }

    try {
      // Insert into user_signal_actions table (per-user tracking)
      const { error: actionError } = await (supabase
        .from('user_signal_actions' as any)
        .insert({
          user_id: user.id,
          signal_id: signal.id,
          action_type: 'taken',
          outcome: outcome === 'target_hit' ? 'target_hit' : outcome === 'stop_loss_hit' ? 'stop_loss_hit' : 'custom',
          pnl: pnl,
          taken_at: new Date().toISOString()
        } as any) as any);

      if (actionError) {
        // If duplicate, user already took this signal
        if (actionError.code === '23505') {
          toast.error('You have already taken this signal');
          return;
        }
        throw actionError;
      }

      // Update local state immediately
      setTakenSignalIds(prev => new Set([...prev, signal.id]));
      setTradeOutcomes(prev => ({
        ...prev,
        [signal.id]: { outcome, pnl }
      }));

      // Update dashboard data
      const { data: dashboard } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (dashboard) {
        const isWin = outcome === 'target_hit';
        const isLoss = outcome === 'stop_loss_hit';
        
        await supabase
          .from('dashboard_data')
          .update({
            total_pnl: (dashboard.total_pnl || 0) + pnl,
            total_trades: (dashboard.total_trades || 0) + 1,
            winning_trades: isWin ? (dashboard.winning_trades || 0) + 1 : dashboard.winning_trades,
            losing_trades: isLoss ? (dashboard.losing_trades || 0) + 1 : dashboard.losing_trades,
            win_rate: isWin || isLoss 
              ? ((((dashboard.winning_trades || 0) + (isWin ? 1 : 0)) / ((dashboard.total_trades || 0) + 1)) * 100)
              : dashboard.win_rate,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        // Update local P&L for milestone check
        const newPnl = (dashboard.total_pnl || 0) + pnl;
        setTotalPnl(newPnl);
        const unlocked = calculateUnlockedMilestones(newPnl, accountSize);
        setUnlockedMilestones(unlocked);
        checkMilestoneUnlock(unlocked, newPnl);
      }

      const outcomeLabel = outcome === 'target_hit' ? 'Won' : outcome === 'stop_loss_hit' ? 'Lost' : outcome === 'breakeven' ? 'Breakeven' : 'Custom';
      toast.success(`${signal.symbol}: ${outcomeLabel} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
    } catch (error) {
      console.error('Error updating trade outcome:', error);
      toast.error('Failed to update trade outcome');
    }
  };

  const handleCustomPnlSubmit = (signal: Signal) => {
    const pnlValue = parseFloat(customPnl);
    if (isNaN(pnlValue)) {
      toast.error('Please enter a valid P&L amount');
      return;
    }
    handleMarkOutcome(signal, 'custom', pnlValue);
    setShowCustomPnlInput(null);
    setCustomPnl('');
  };

  const handleAddToJournal = (signal: Signal) => {
    // Store signal data in localStorage for journal to pick up
    localStorage.setItem('prefillSignal', JSON.stringify(signal));
    // Navigate to journal tab using state
    navigate('/dashboard', { state: { activeTab: 'journal' } });
    toast.info('Opening trade journal...');
  };

  const handleChatWithNexus = (signal: Signal) => {
    // Store signal context for AI coach
    localStorage.setItem('signalContext', JSON.stringify(signal));
    // Navigate to AI coach tab
    navigate('/dashboard', { state: { activeTab: 'ai-coach' } });
    toast.info('Opening Nexus AI Coach...');
  };

  // Use the advanced lot size calculator with user's questionnaire data
  const [userRiskPercentage, setUserRiskPercentage] = useState(1);
  
  useEffect(() => {
    const fetchUserRisk = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('questionnaires')
        .select('risk_percentage')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data?.risk_percentage) {
        setUserRiskPercentage(data.risk_percentage);
      }
    };
    fetchUserRisk();
  }, [user]);

  const calculatePotentialPnl = (signal: Signal) => {
    const result = calculateLotSizeAndPL({
      symbol: signal.symbol,
      entry_price: signal.entry_price,
      stop_loss: signal.stop_loss,
      take_profit: signal.take_profit,
    }, { accountSize, riskPercentage: userRiskPercentage });

    return {
      potentialProfit: result.potentialProfit,
      potentialLoss: result.potentialLoss,
      riskRewardRatio: result.riskReward,
      lotSize: result.lotSize,
      dollarAmount: result.dollarAmount,
      stopLossPips: result.stopLossPips,
      takeProfitPips: result.takeProfitPips,
      instrumentType: result.instrumentType,
      positionLabel: result.positionLabel,
      calculationBreakdown: result.calculationBreakdown,
    };
  };

  const canTakeMoreSignals = features.unlimitedSignals || signalsTakenToday < features.signalsPerDay;
  const remainingSignals = features.unlimitedSignals ? 'Unlimited' : `${features.signalsPerDay - signalsTakenToday} left today`;

  // Filter signals by type, milestone, VIP, and R:R
  // Also filter out signals older than 1 day for new users (signed up within last 7 days)
  const filteredSignals = useMemo(() => {
    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    const sevenDaysAgo = subDays(now, 7);
    const isNewUser = userCreatedAt && isAfter(userCreatedAt, sevenDaysAgo);
    
    return signals.filter(s => {
      const signalDate = new Date(s.created_at);
      
      // For new users, don't show signals older than 1 day (unless they've taken them)
      if (isNewUser && !s.taken_by_user && !isAfter(signalDate, oneDayAgo)) {
        return false;
      }
      
      const matchesType = filter === 'all' || s.signal_type.toLowerCase() === filter;
      const matchesMilestone = selectedMilestone === 'ALL' || s.milestone === selectedMilestone;
      const matchesVip = !showVipOnly || s.is_vip;
      
      // Filter out VIP signals for non-VIP users (unless showing locked preview)
      if (s.is_vip && !hasVipAccess && !showVipOnly) {
        // Show VIP signals but they'll be locked
      }
      
      // Calculate R:R for filtering
      if (minRiskReward > 0) {
        const risk = Math.abs(s.entry_price - s.stop_loss);
        const reward = Math.abs(s.take_profit - s.entry_price);
        const rr = risk > 0 ? reward / risk : 0;
        if (rr < minRiskReward) return false;
      }
      
      return matchesType && matchesMilestone && matchesVip;
    });
  }, [signals, filter, selectedMilestone, minRiskReward, showVipOnly, hasVipAccess, userCreatedAt]);

  // Separate signals into live (not taken by current user) and taken (by current user)
  const liveSignals = useMemo(() => {
    // Show signals not taken by this user (using per-user tracking)
    return filteredSignals.filter(s => !takenSignalIds.has(s.id));
  }, [filteredSignals, takenSignalIds]);

  const takenSignals = useMemo(() => {
    // Show only signals taken by this user
    return signals.filter(s => takenSignalIds.has(s.id));
  }, [signals, takenSignalIds]);

  // Group signals by milestone
  const signalsByMilestone = useMemo(() => {
    const grouped: Record<string, Signal[]> = { M1: [], M2: [], M3: [], M4: [] };
    signals.forEach(signal => {
      const milestone = signal.milestone || 'M4';
      if (grouped[milestone]) {
        grouped[milestone].push(signal);
      }
    });
    return grouped;
  }, [signals]);

  // Display signals based on active tab
  const displaySignals = activeSignalTab === 'taken' ? takenSignals : liveSignals;

  // Trade type label helper
  const getTradeTypeLabel = (tradeType?: string) => {
    switch (tradeType) {
      case 'scalp': return 'Scalp';
      case 'intraday': return 'Intraday';
      case 'swing': return 'Swing';
      case 'position': return 'Position';
      default: return null;
    }
  };

  const getTradeTypeColor = (tradeType?: string) => {
    switch (tradeType) {
      case 'scalp': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'intraday': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'swing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'position': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  // Calculate milestone progress
  const getMilestoneProgress = () => {
    const nextMilestone = MILESTONE_CONFIGS.find(m => !unlockedMilestones.includes(m.id));
    if (!nextMilestone) return { progress: 100, target: 0, remaining: 0 };
    
    const thresholds = [0, accountSize * 0.05, accountSize * 0.10, accountSize * 0.15];
    const currentIndex = unlockedMilestones.length - 1;
    const nextThreshold = thresholds[currentIndex + 1] || thresholds[thresholds.length - 1];
    const prevThreshold = thresholds[currentIndex] || 0;
    
    const progress = Math.min(100, ((totalPnl - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
    const remaining = Math.max(0, nextThreshold - totalPnl);
    
    return { progress, target: nextThreshold, remaining };
  };

  const milestoneProgress = getMilestoneProgress();

  const getMilestoneConfig = (milestoneId: string) => {
    return MILESTONE_CONFIGS.find(m => m.id === milestoneId) || MILESTONE_CONFIGS[0];
  };

  return (
    <ConsentGate>
    <div className="space-y-6 relative">
      {/* Trading Locked Overlay */}
      {isTradingLocked && tradingLockUntil && lockedAccountId && (
        <TradingLockedOverlay 
          lockUntil={tradingLockUntil}
          lockReason={tradingLockReason}
          accountId={lockedAccountId}
          onUnlock={refetchLockStatus}
        />
      )}
      
      {/* Trading Risk Disclaimer - Compact */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200/80">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <span className="text-amber-300 font-medium">Risk Disclaimer:</span> 82%+ win rate with institutional-grade risk management. Past performance ≠ future results. Always use stop-loss, risk 1-2% per trade, and never over-leverage. You are responsible for your trading decisions.
        </p>
      </div>

      {/* Confluence Score - Compact */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200/80">
        <Target className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="mb-2">
            <span className="text-blue-300 font-medium">Confluence Score:</span> Measures how many technical factors align. 
            <span className="text-red-400 ml-1">1-3 Weak</span> • 
            <span className="text-orange-400 ml-1">4-5 Moderate</span> • 
            <span className="text-blue-400 ml-1">6-7 Strong</span> • 
            <span className="text-success ml-1">8+ Elite</span>
          </p>
        </div>
      </div>

      {/* System Trade Closure Info Note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-white/5 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <span className="text-foreground/80 font-medium">Note:</span> "Closed" trades were managed by our system. "Breakeven" may occur when the system trails a trade after hitting 50% of the target — if the trailing stop triggers, it's still a profit. Always verify your trades.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            {/* Live indicator */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Live Signals Feed</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>AI-powered signals</span>
              <span>•</span>
              <span className={features.unlimitedSignals ? 'text-success' : 'text-warning'}>{remainingSignals}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Globe className="w-3 h-3" />
                {getTimezoneAbbr()}
              </span>
              <span>•</span>
              <button onClick={() => navigate('/signal-history')} className="text-primary hover:underline">View History</button>
              <span>•</span>
              <button 
                onClick={() => setShowMessages(!showMessages)} 
                className={`inline-flex items-center gap-1 transition-colors ${showMessages ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MessageSquare className="w-3 h-3" />
                {showMessages ? 'Hide Messages' : 'Show Messages'}
              </button>
            </p>
          </div>
        </div>

        {/* Live/Taken Tabs */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveSignalTab('live')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeSignalTab === 'live'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Signals
          </button>
          <button
            onClick={() => setActiveSignalTab('taken')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeSignalTab === 'taken'
                ? 'bg-success text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            My Trades ({takenSignals.length})
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Notification Controls */}
        <div className="flex items-center gap-2">
          {isSupported && (
            <div className="flex items-center gap-1">
              <button
                onClick={notificationsEnabled ? disableNotifications : enableNotifications}
                className={`p-2 rounded-lg transition-colors ${
                  notificationsEnabled ? 'bg-success/20 text-success' : 'bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
                title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
              {notificationsEnabled && (
                <button
                  onClick={isSoundEnabled ? disableSound : enableSound}
                  className={`p-2 rounded-lg transition-colors ${
                    isSoundEnabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-foreground'
                  }`}
                  title={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
                >
                  {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
          
          {/* VIP Filter Toggle */}
          <button
            onClick={() => setShowVipOnly(!showVipOnly)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              showVipOnly ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-500' : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
            title={hasVipAccess ? "Show VIP signals only" : "VIP signals (Pro/Enterprise)"}
          >
            <Crown className="w-4 h-4" />
            {showVipOnly && <span className="text-xs font-medium">VIP</span>}
          </button>
          
          {/* R:R Filter Toggle */}
          <button
            onClick={() => setShowRRFilter(!showRRFilter)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              minRiskReward > 0 ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
            title="Filter by Risk:Reward"
          >
            <Filter className="w-4 h-4" />
            {minRiskReward > 0 && <span className="text-xs font-medium">≥1:{minRiskReward}</span>}
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {(['all', 'buy', 'sell'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                filter === f
                  ? f === 'buy' ? 'bg-success text-white' 
                    : f === 'sell' ? 'bg-risk text-white'
                    : 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* R:R Filter Slider */}
      <AnimatePresence>
        {showRRFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Minimum Risk:Reward Filter</span>
              </div>
              <span className="text-sm font-bold text-accent">
                {minRiskReward === 0 ? 'Off' : `≥ 1:${minRiskReward}`}
              </span>
            </div>
            <Slider
              value={[minRiskReward]}
              onValueChange={(value) => setMinRiskReward(value[0])}
              min={0}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Off</span>
              <span>1:1</span>
              <span>1:2</span>
              <span>1:3</span>
              <span>1:4</span>
              <span>1:5</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone Progress Bar */}
      {unlockedMilestones.length < 4 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          {/* Subtle glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/5 to-purple-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] p-5 rounded-2xl overflow-hidden group-hover:border-white/[0.12] transition-colors">
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Milestone Progress</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/[0.05] border border-white/[0.1]">
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent font-semibold">${totalPnl.toFixed(0)}</span>
                <span className="text-muted-foreground"> / ${milestoneProgress.target.toFixed(0)}</span>
              </span>
            </div>

            {/* Premium progress bar */}
            <div className="relative">
              <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-purple-500 to-amber-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${milestoneProgress.progress}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  {/* Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              {/* Glow under bar */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-amber-500 rounded-full blur-lg opacity-30"
                style={{ width: `${milestoneProgress.progress}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              <span className="text-primary font-medium">${milestoneProgress.remaining.toFixed(0)}</span> more profit to unlock next milestone
            </p>
          </div>
        </motion.div>
      )}

      {/* Milestone Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedMilestone('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            selectedMilestone === 'ALL'
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
          }`}
        >
          All Signals
        </button>
        {MILESTONE_CONFIGS.map((milestone) => {
          const isUnlocked = unlockedMilestones.includes(milestone.id);
          const signalCount = signalsByMilestone[milestone.id]?.length || 0;
          
          return (
            <button
              key={milestone.id}
              onClick={() => setSelectedMilestone(milestone.id)}
              disabled={!isUnlocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedMilestone === milestone.id
                  ? `${milestone.bgColor} ${milestone.color} border ${milestone.borderColor}`
                  : isUnlocked
                    ? 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                    : 'bg-white/5 text-muted-foreground/50 cursor-not-allowed'
              }`}
            >
              {isUnlocked ? milestone.icon : <Lock className="w-4 h-4" />}
              <span>{milestone.name}</span>
              {isUnlocked && (
                <span className={`text-xs ${milestone.color}`}>({signalCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upgrade Banner for Limited Plans */}
      <AnimatePresence>
        {!features.unlimitedSignals && signalsTakenToday >= features.signalsPerDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 rounded-xl border border-warning/30 bg-warning/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Daily Signal Limit Reached</p>
                  <p className="text-sm text-muted-foreground">
                    You've used all {features.signalsPerDay} signals for today. Upgrade for unlimited signals.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/membership')} size="sm" className="btn-glow">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : displaySignals.length === 0 ? (
          <div className="relative group">
            {/* Premium empty state */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 opacity-50" />
            <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] p-12 rounded-2xl text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-white/[0.03] border border-white/[0.1] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-lg font-medium bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">No signals available</p>
              <p className="text-sm text-muted-foreground mt-2">New signals will appear here when generated by the AI</p>
            </div>
          </div>
        ) : (
          displaySignals.map((signal, index) => {
            const milestoneConfig = getMilestoneConfig(signal.milestone);
            const isLocked = !unlockedMilestones.includes(signal.milestone);
            const tradeResult = tradeOutcomes[signal.id];
            const { potentialProfit, potentialLoss, riskRewardRatio, lotSize, stopLossPips, takeProfitPips, instrumentType, positionLabel, calculationBreakdown, dollarAmount } = calculatePotentialPnl(signal);
            // Check if signal is taken by THIS user (using per-user tracking)
            const isSignalTaken = takenSignalIds.has(signal.id);
            
            // Check if signal has a system outcome (closed trade)
            const hasSystemOutcome = signal.outcome && signal.outcome !== 'pending';
            const isWin = signal.outcome === 'target_hit' || signal.outcome === 'target_1_hit' || signal.outcome === 'target_2_hit' || signal.outcome === 'target_3_hit' || signal.outcome === 'tp1_hit' || signal.outcome === 'tp2_hit' || signal.outcome === 'tp3_hit';
            const isLoss = signal.outcome === 'stop_loss_hit' || signal.outcome === 'sl_hit';
            const isBreakeven = signal.outcome === 'breakeven';
            const isCancelled = signal.outcome === 'cancelled';
            
            // Check if card is expanded (for closed trades)
            const isClosedCardExpanded = expandedClosedCards.has(signal.id);
            
            // Check if signal is expired (older than 4 days and not a swing trade)
            const signalAge = new Date().getTime() - new Date(signal.created_at).getTime();
            const daysSinceCreation = signalAge / (1000 * 60 * 60 * 24);
            const isSwingTrade = signal.trade_type === 'swing' || signal.trade_type === 'swing_trade';
            const isExpired = !hasSystemOutcome && daysSinceCreation > 4 && !isSwingTrade;
            
            // Get outcome-based styling
            const getOutcomeCardStyle = () => {
              if (isExpired) return 'border-muted/30 bg-muted/5 opacity-50';
              if (!hasSystemOutcome) return '';
              if (isWin) return 'border-success/50 bg-success/5';
              if (isLoss) return 'border-risk/50 bg-risk/5';
              if (isBreakeven) return 'border-yellow-500/50 bg-yellow-500/5';
              if (isCancelled) return 'border-muted/50 bg-muted/5 opacity-60';
              return '';
            };
            
            const getOutcomeLabel = () => {
              if (signal.outcome === 'target_hit' || signal.outcome === 'target_1_hit') return { text: '✅ TP1 HIT', color: 'text-success' };
              if (signal.outcome === 'target_2_hit' || signal.outcome === 'tp2_hit') return { text: '✅ TP2 HIT', color: 'text-success' };
              if (signal.outcome === 'target_3_hit' || signal.outcome === 'tp3_hit') return { text: '✅ TP3 HIT', color: 'text-success' };
              if (signal.outcome === 'tp1_hit') return { text: '✅ TP1 HIT', color: 'text-success' };
              if (signal.outcome === 'stop_loss_hit' || signal.outcome === 'sl_hit') return { text: '❌ STOP LOSS', color: 'text-risk' };
              if (signal.outcome === 'breakeven') return { text: '⚖️ BREAKEVEN', color: 'text-yellow-400' };
              if (signal.outcome === 'cancelled') return { text: '🚫 CANCELLED', color: 'text-muted-foreground' };
              return null;
            };
            
            const outcomeLabel = getOutcomeLabel();
            
            // Toggle function for closed card expansion
            const toggleClosedCard = () => {
              setExpandedClosedCards(prev => {
                const next = new Set(prev);
                if (next.has(signal.id)) {
                  next.delete(signal.id);
                } else {
                  next.add(signal.id);
                }
                return next;
              });
            };
            
            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                className={`relative group/card ${
                  isLocked ? 'opacity-60' : ''
                } ${isSignalTaken && !hasSystemOutcome ? 'opacity-75' : ''}`}
              >
                {/* Outer glow effect */}
                <div className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-sm ${
                  hasSystemOutcome
                    ? isWin ? 'bg-gradient-to-r from-success/30 to-emerald-500/30'
                      : isLoss ? 'bg-gradient-to-r from-risk/30 to-red-500/30'
                      : 'bg-gradient-to-r from-primary/20 to-purple-500/20'
                    : signal.is_vip
                      ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/30'
                      : 'bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20'
                }`} />

                {/* Card with gradient border effect */}
                <div className={`relative overflow-hidden ${
                  hasSystemOutcome
                    ? isWin
                      ? 'bg-gradient-to-br from-[#0a1a12] to-[#050f08] border border-success/40'
                      : isLoss
                        ? 'bg-gradient-to-br from-[#1a0a0a] to-[#0f0505] border border-risk/40'
                        : isBreakeven
                          ? 'bg-gradient-to-br from-[#1a1508] to-[#0f0d05] border border-yellow-500/40'
                          : 'bg-gradient-to-br from-[#0c0c12] to-[#08080c] border border-white/10'
                    : signal.is_vip
                      ? 'bg-gradient-to-br from-[#1a1408] via-[#12100c] to-[#0f0a12] border border-amber-500/50'
                      : 'bg-gradient-to-br from-[#0c0c12] to-[#08080c] border border-white/[0.08] hover:border-white/20'
                } rounded-2xl transition-all duration-300`}>

                  {/* Top accent line */}
                  <div className={`absolute top-0 inset-x-0 h-px ${
                    hasSystemOutcome
                      ? isWin ? 'bg-gradient-to-r from-transparent via-success/50 to-transparent'
                        : isLoss ? 'bg-gradient-to-r from-transparent via-risk/50 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
                      : signal.is_vip
                        ? 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-primary/30 to-transparent'
                  }`} />

                  {/* Top Header Bar */}
                  <div className={`px-5 py-4 border-b flex items-center justify-between ${
                    hasSystemOutcome
                      ? isWin ? 'border-success/20 bg-success/[0.03]' : isLoss ? 'border-risk/20 bg-risk/[0.03]' : 'border-white/[0.06]'
                      : signal.is_vip ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-white/[0.06]'
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Signal Type Indicator - Enhanced */}
                      <div className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg ${
                        signal.signal_type === 'BUY'
                          ? 'bg-gradient-to-r from-success to-emerald-600 text-white shadow-success/25'
                          : 'bg-gradient-to-r from-risk to-red-600 text-white shadow-risk/25'
                      }`}>
                        {signal.signal_type === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="tracking-wide">{signal.signal_type}</span>
                      </div>

                      {/* Symbol */}
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{signal.symbol}</h3>
                          {signal.is_vip && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white text-[10px] font-bold uppercase shadow-lg shadow-amber-500/20">
                              <Crown className="w-3 h-3" />
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatToUserTimezone(signal.created_at, 'MMM d, h:mm a')}</span>
                          <span className="text-white/20">•</span>
                          <span className="text-white/50">{formatRelativeTime(signal.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Trade Type Badge */}
                      {getTradeTypeLabel(signal.trade_type) && (
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getTradeTypeColor(signal.trade_type)}`}>
                          {getTradeTypeLabel(signal.trade_type)}
                        </span>
                      )}
                      {/* Confluence Score */}
                      <ConfluenceScoreDisplay score={signal.confluence_score} size="sm" />
                    </div>
                  </div>

                  {/* Status Badges Row */}
                  {(hasSystemOutcome || isExpired || isSignalTaken) && (
                    <div className="px-5 py-2 border-b border-white/5 flex items-center gap-2">
                      {isExpired && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/40 text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Expired
                        </span>
                      )}
                      {hasSystemOutcome && outcomeLabel && !isExpired && (
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          isWin ? 'bg-success/15 text-success border-success/30' : isLoss ? 'bg-risk/15 text-risk border-risk/30' : isBreakeven ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-white/[0.06] text-white/50 border-white/[0.08]'
                        }`}>
                          {outcomeLabel.text}
                          {signal.final_r_multiple !== undefined && signal.final_r_multiple !== null && (
                            <span className="ml-1 opacity-70 font-semibold">({signal.final_r_multiple >= 0 ? '+' : ''}{signal.final_r_multiple.toFixed(2)}R)</span>
                          )}
                        </span>
                      )}
                      {isSignalTaken && !hasSystemOutcome && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/40 text-xs font-medium">
                          <CheckCircle className="w-3 h-3 text-success/60" />
                          Used
                        </span>
                      )}
                      {/* Milestone */}
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto border ${milestoneConfig.bgColor} ${milestoneConfig.color} ${milestoneConfig.borderColor}`}>
                        {isLocked ? <Lock className="w-3 h-3" /> : milestoneConfig.icon}
                        {milestoneConfig.name}
                      </span>
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="p-6">
                    {/* Collapsed view for closed signals */}
                    {hasSystemOutcome && !isClosedCardExpanded ? (
                      <button
                        onClick={toggleClosedCard}
                        className="w-full text-center py-4 text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/[0.08] transition-all flex items-center justify-center gap-2"
                      >
                        <span>View trade details</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        {hasSystemOutcome && isClosedCardExpanded && (
                          <button
                            onClick={toggleClosedCard}
                            className="w-full text-center py-2 mb-5 text-xs text-white/25 hover:text-white/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Hide details</span>
                            <ChevronDown className="w-3 h-3 rotate-180" />
                          </button>
                        )}

                        {/* Price Levels - Premium Design */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          {/* Entry Price */}
                          <div className="relative p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] group/price overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity" />
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">Entry</p>
                            <p className="font-mono text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{signal.entry_price}</p>
                          </div>
                          {/* Stop Loss */}
                          <div className="relative p-4 rounded-xl bg-gradient-to-br from-risk/10 to-risk/[0.02] border border-risk/30 overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-risk/50 to-transparent" />
                            <p className="text-[10px] uppercase tracking-widest text-risk/60 mb-2 font-medium">Stop Loss</p>
                            <p className="font-mono text-xl font-bold text-risk">{signal.stop_loss}</p>
                          </div>
                          {/* Take Profit */}
                          <div className="relative p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/[0.02] border border-success/30 overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-success/50 to-transparent" />
                            <p className="text-[10px] uppercase tracking-widest text-success/60 mb-2 font-medium">Take Profit</p>
                            <p className="font-mono text-xl font-bold text-success">{signal.take_profit}</p>
                          </div>
                        </div>

                        {/* Lot Size & Risk/Reward Info */}
                        <div className="relative p-4 mb-6 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.08] overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30">
                                <Scale className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{lotSize.toFixed(2)} {positionLabel === 'Contracts' ? 'contracts' : positionLabel === 'Position' ? 'units' : 'lots'}</span>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                                <span className="text-xs text-white/40">R:R</span>
                                <span className="text-sm font-bold text-white ml-1.5">1:{riskRewardRatio}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="px-2 py-1 rounded-lg bg-risk/10 text-risk/80">{stopLossPips.toFixed(1)} {instrumentType === 'forex' ? 'pips' : instrumentType === 'futures' ? 'ticks' : 'pts'}</span>
                              <span className="px-2 py-1 rounded-lg bg-success/10 text-success/80">{takeProfitPips.toFixed(1)} {instrumentType === 'forex' ? 'pips' : instrumentType === 'futures' ? 'ticks' : 'pts'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                            <span className="text-sm text-white/50">
                              Risk: <span className="text-white font-semibold">${dollarAmount.toFixed(2)}</span>
                              <span className="text-white/30 ml-1.5 text-xs">({userRiskPercentage}%)</span>
                            </span>
                            <div className="flex gap-6">
                              <span className="text-sm"><span className="text-white/40">Win:</span> <span className="text-success font-bold">+${potentialProfit.toFixed(2)}</span></span>
                              <span className="text-sm"><span className="text-white/40">Loss:</span> <span className="text-risk font-bold">-${potentialLoss.toFixed(2)}</span></span>
                            </div>
                          </div>
                          {calculationBreakdown && calculationBreakdown !== 'Invalid input data' && (
                            <p className="text-[10px] text-white/15 mt-3 font-mono leading-relaxed">
                              {calculationBreakdown}
                            </p>
                          )}
                        </div>

                        {/* AI Reasoning */}
                        <div className="relative p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/[0.02] border border-primary/30 mb-6 overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Analysis</span>
                          </div>
                          {isLocked ? (
                            <div className="flex items-center gap-2 text-white/40">
                              <Lock className="w-4 h-4" />
                              <span className="text-sm">Unlock {milestoneConfig.name} to view analysis</span>
                            </div>
                          ) : features.fullAiReasoning ? (
                            <p className="text-sm text-white/70 leading-relaxed">{signal.ai_reasoning}</p>
                          ) : features.basicAiReasoning ? (
                            <p className="text-sm text-white/70">
                              {signal.ai_reasoning?.slice(0, 100)}...
                              <button
                                onClick={() => navigate('/membership')}
                                className="text-primary hover:underline ml-1"
                              >
                                Upgrade for full analysis
                              </button>
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 text-white/40">
                              <Lock className="w-4 h-4" />
                              <span className="text-sm">AI reasoning available on Starter plan and above</span>
                            </div>
                          )}
                        </div>

                        {/* Chart Screenshot */}
                        {signal.image_url && !isLocked && (
                          <div className="mb-5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <ImageIcon className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Chart</span>
                            </div>
                            <SignalImageDisplay
                              imageUrl={signal.image_url}
                              symbol={signal.symbol}
                              className="rounded-xl border border-white/10"
                            />
                          </div>
                        )}

                        {/* Agent Notes & Updates */}
                        {(signal.agent_notes || (signalComments[signal.id] && signalComments[signal.id].length > 0)) && (
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-5 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Analyst Updates</span>
                            </div>
                    
                    {/* Agent Notes (latest important note) */}
                    {signal.agent_notes && (
                      <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-amber-400 font-medium">{signal.agent_notes}</p>
                      </div>
                    )}
                    
                    {/* Comments Thread (latest 3) */}
                    {signalComments[signal.id] && signalComments[signal.id].slice(0, 3).map((comment) => (
                      <div key={comment.id} className="p-2.5 rounded-md bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{comment.agent_name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            comment.comment_type === 'exit_now' ? 'bg-risk/20 text-risk' :
                            comment.comment_type === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                            comment.comment_type === 'hold' ? 'bg-success/20 text-success' :
                            comment.comment_type === 'partial_close' ? 'bg-amber-500/20 text-amber-400' :
                            comment.comment_type === 'move_sl' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {comment.comment_type === 'exit_now' ? '🚨 EXIT' :
                             comment.comment_type === 'warning' ? '⚠️ Warning' :
                             comment.comment_type === 'hold' ? '✅ Hold' :
                             comment.comment_type === 'partial_close' ? '📊 Partial' :
                             comment.comment_type === 'move_sl' ? '🔄 Move SL' :
                             '📝 Update'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatToUserTimezone(comment.created_at, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                    
                    {signalComments[signal.id] && signalComments[signal.id].length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{signalComments[signal.id].length - 3} more updates
                      </p>
                    )}
                  </div>
                )}

                {/* System Trade Management Messages - Collapsible */}
                {showMessages && signalMessages[signal.id] && signalMessages[signal.id].length > 0 && (
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 mb-4 overflow-hidden">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedMessages);
                        if (newExpanded.has(signal.id)) {
                          newExpanded.delete(signal.id);
                        } else {
                          newExpanded.add(signal.id);
                        }
                        setExpandedMessages(newExpanded);
                      }}
                      className="w-full p-3 flex items-center justify-between hover:bg-blue-500/10 transition-colors"
                    >
                      <span className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        Trade Management Updates ({signalMessages[signal.id].length})
                      </span>
                      {expandedMessages.has(signal.id) ? (
                        <ChevronDown className="w-4 h-4 text-blue-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedMessages.has(signal.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-4"
                        >
                          <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-blue-500/30 scrollbar-track-transparent pr-1">
                            {signalMessages[signal.id].map((message) => (
                              <div key={message.id} className={`p-2.5 rounded-md border ${
                                message.message_type === 'outcome' ? 'bg-success/10 border-success/20' :
                                message.message_type === 'warning' ? 'bg-orange-500/10 border-orange-500/20' :
                                message.message_type === 'action' ? 'bg-purple-500/10 border-purple-500/20' :
                                message.message_type === 'entry' ? 'bg-blue-500/10 border-blue-500/20' :
                                message.message_type === 'agent_note' ? 'bg-amber-500/10 border-amber-500/20' :
                                message.message_type === 'admin_update' ? 'bg-indigo-500/10 border-indigo-500/20' :
                                'bg-white/5 border-white/10'
                              }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`text-xs font-bold ${
                                    message.message_type === 'outcome' ? 'text-success' :
                                    message.message_type === 'warning' ? 'text-orange-400' :
                                    message.message_type === 'action' ? 'text-purple-400' :
                                    message.message_type === 'entry' ? 'text-blue-400' :
                                    message.message_type === 'agent_note' ? 'text-amber-400' :
                                    message.message_type === 'admin_update' ? 'text-indigo-400' :
                                    'text-foreground'
                                  }`}>
                                    {message.title}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    message.message_type === 'outcome' ? 'bg-success/20 text-success' :
                                    message.message_type === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                                    message.message_type === 'action' ? 'bg-purple-500/20 text-purple-400' :
                                    message.message_type === 'entry' ? 'bg-blue-500/20 text-blue-400' :
                                    message.message_type === 'agent_note' ? 'bg-amber-500/20 text-amber-400' :
                                    message.message_type === 'admin_update' ? 'bg-indigo-500/20 text-indigo-400' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {message.message_type === 'outcome' ? '📊 Result' :
                                     message.message_type === 'warning' ? '⚠️ Alert' :
                                     message.message_type === 'action' ? '🎯 Action' :
                                     message.message_type === 'entry' ? '🚀 Entry' :
                                     message.message_type === 'agent_note' ? '📋 Analyst' :
                                     message.message_type === 'admin_update' ? '📢 Update' :
                                     '📝 Info'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-pre-line">{message.content}</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                  {formatToUserTimezone(message.created_at, 'MMM d, h:mm a')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {showCustomPnlInput === signal.id && (
                  <div className="mb-4 p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-400">Enter Custom P&L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={customPnl}
                        onChange={(e) => setCustomPnl(e.target.value)}
                        placeholder="e.g., 50.00 or -25.00"
                        className="flex-1 bg-black/30 border-orange-500/30"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCustomPnlSubmit(signal)}
                        disabled={!customPnl || isNaN(parseFloat(customPnl))}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Submit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowCustomPnlInput(null);
                          setCustomPnl('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter positive for profit, negative for loss
                    </p>
                  </div>
                )}

                        {/* User's Personal Trade Outcome Display */}
                        {tradeResult && (
                          <div className={`mb-5 p-4 rounded-xl ${
                            tradeResult.outcome === 'target_hit' ? 'bg-success/10 border border-success/30' :
                            tradeResult.outcome === 'stop_loss_hit' ? 'bg-risk/10 border border-risk/30' :
                            'bg-yellow-500/10 border border-yellow-500/30'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold flex items-center gap-2 text-sm ${
                                tradeResult.outcome === 'target_hit' ? 'text-success' :
                                tradeResult.outcome === 'stop_loss_hit' ? 'text-risk' :
                                'text-yellow-400'
                              }`}>
                                <CheckCircle className="w-4 h-4" />
                                Your Result: {tradeResult.outcome === 'target_hit' ? 'Won' :
                                 tradeResult.outcome === 'stop_loss_hit' ? 'Lost' :
                                 tradeResult.outcome === 'breakeven' ? 'Breakeven' : 'Custom'}
                              </span>
                              <span className={`text-lg font-bold ${tradeResult.pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                                {tradeResult.pnl >= 0 ? '+' : ''}${tradeResult.pnl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-2">
                          {isSignalTaken ? (
                            <div className="space-y-3">
                              <div className="p-4 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/[0.08] text-center">
                                <p className="text-sm text-white/50 flex items-center justify-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-success/70" />
                                  Signal already used
                                </p>
                              </div>
                              {(signal.outcome && signal.outcome !== 'pending') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReplaySignal(signal)}
                                  className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  View Trade Replay
                                </Button>
                              )}
                            </div>
                          ) : isLocked ? (
                            <Button
                              variant="outline"
                              className={`w-full ${milestoneConfig.borderColor} ${milestoneConfig.color} opacity-70`}
                              disabled
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              Locked - {milestoneConfig.name}
                            </Button>
                          ) : !canTakeMoreSignals ? (
                            <Button
                              onClick={() => navigate('/membership')}
                              className="w-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 hover:from-amber-500/30 hover:to-yellow-500/20 transition-all"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade for More Signals
                            </Button>
                          ) : (
                            <>
                              {/* Trade Outcome Buttons - Label */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Mark Outcome</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                              </div>

                              {/* Trade Outcome Buttons */}
                              <div className="grid grid-cols-4 gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkOutcome(signal, 'target_hit', potentialProfit)}
                                  className="bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white font-bold shadow-lg shadow-success/20 transition-all"
                                >
                                  <span className="text-xs tracking-wide">Won</span>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkOutcome(signal, 'stop_loss_hit', -potentialLoss)}
                                  className="bg-gradient-to-r from-risk to-red-600 hover:from-risk/90 hover:to-red-600/90 text-white font-bold shadow-lg shadow-risk/20 transition-all"
                                >
                                  <span className="text-xs tracking-wide">Lost</span>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkOutcome(signal, 'breakeven', 0)}
                                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-500/90 hover:to-amber-500/90 text-white font-bold shadow-lg shadow-yellow-500/20 transition-all"
                                >
                                  <span className="text-xs tracking-wide">BE</span>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setShowCustomPnlInput(signal.id)}
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-500/90 hover:to-orange-600/90 text-white font-bold shadow-lg shadow-orange-500/20 transition-all"
                                >
                                  <span className="text-xs tracking-wide">Custom</span>
                                </Button>
                              </div>

                              {/* Utility Buttons */}
                              <div className="flex gap-3 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddToJournal(signal)}
                                  className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                                >
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  Journal
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleChatWithNexus(signal)}
                                  className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                                >
                          <Bot className="w-4 h-4 mr-2" />
                          Nexus
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                </>
                )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Milestone Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative group"
      >
        {/* Subtle glow */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/5 to-purple-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] p-5 rounded-2xl overflow-hidden group-hover:border-white/[0.12] transition-colors">
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Milestone System</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MILESTONE_CONFIGS.map((milestone, index) => {
              const isUnlocked = unlockedMilestones.includes(milestone.id);
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                  className={`relative p-4 rounded-xl border overflow-hidden transition-all duration-300 ${
                    isUnlocked
                      ? `${milestone.borderColor} ${milestone.bgColor} hover:shadow-lg`
                      : 'border-white/[0.08] bg-white/[0.02]'
                  }`}
                >
                  {/* Unlocked glow */}
                  {isUnlocked && (
                    <div className={`absolute inset-0 ${milestone.bgColor} opacity-50`} />
                  )}

                  <div className="relative z-10">
                    <div className={`flex items-center gap-2 mb-2 ${isUnlocked ? milestone.color : 'text-muted-foreground'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isUnlocked
                          ? `bg-gradient-to-br ${milestone.bgColor} border ${milestone.borderColor}`
                          : 'bg-white/[0.05] border border-white/[0.1]'
                      }`}>
                        {isUnlocked ? milestone.icon : <Lock className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-semibold text-sm">{milestone.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{milestone.description}</p>
                    <p className={`text-xs font-medium ${isUnlocked ? milestone.color : 'text-muted-foreground'}`}>
                      Target: {milestone.targetWinRate}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Milestone Celebration Modal */}
      {celebrationMilestone && (
        <MilestoneCelebration
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          milestoneName={celebrationMilestone.name}
          milestoneDescription={celebrationMilestone.description}
          milestoneColor={celebrationMilestone.color}
        />
      )}

      {/* Trade Replay Modal */}
      {replaySignal && (
        <TradeReplayModal
          signal={replaySignal}
          isOpen={!!replaySignal}
          onClose={() => setReplaySignal(null)}
        />
      )}
    </div>
    </ConsentGate>
  );
};

export default SignalsFeedTab;
