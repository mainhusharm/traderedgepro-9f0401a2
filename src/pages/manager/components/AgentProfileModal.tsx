import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, TrendingUp, TrendingDown, MessageSquare, Calendar, 
  Clock, CheckCircle, XCircle, MinusCircle, Activity, Target,
  BarChart3, Eye, RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useManagerApi } from '@/hooks/useManagerApi';
import { format, formatDistanceToNow } from 'date-fns';

interface AgentProfileModalProps {
  agentId: string | null;
  agentName: string;
  onClose: () => void;
}

interface AgentDetails {
  agent: any;
  stats: {
    totalSignals: number;
    wins: number;
    losses: number;
    breakeven: number;
    pending: number;
    winRate: string;
    totalSessions: number;
    completedSessions: number;
    totalComments: number;
  };
  reviewedSignals: any[];
  sessions: any[];
  signalComments: any[];
  recentMessages: any[];
}

const AgentProfileModal = ({ agentId, agentName, onClose }: AgentProfileModalProps) => {
  const { callManagerApi } = useManagerApi();
  const [details, setDetails] = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails();
    }
  }, [agentId]);

  const fetchAgentDetails = async () => {
    setIsLoading(true);
    const response = await callManagerApi('get_agent_details', { agentId });
    if (response?.success) {
      setDetails(response);
    }
    setIsLoading(false);
  };

  const getOutcomeColor = (outcome: string) => {
    if (outcome === 'win' || outcome === 'target_hit' || outcome?.includes('target_') || outcome?.includes('tp')) {
      return 'text-green-400 bg-green-500/10';
    }
    if (outcome === 'loss' || outcome === 'sl_hit' || outcome === 'stopped_out' || outcome === 'stop_loss') {
      return 'text-red-400 bg-red-500/10';
    }
    if (outcome === 'breakeven') {
      return 'text-yellow-400 bg-yellow-500/10';
    }
    return 'text-blue-400 bg-blue-500/10';
  };

  const getOutcomeLabel = (outcome: string) => {
    if (outcome === 'win' || outcome === 'target_hit' || outcome?.includes('target_') || outcome?.includes('tp')) {
      return 'WIN';
    }
    if (outcome === 'loss' || outcome === 'sl_hit' || outcome === 'stopped_out' || outcome === 'stop_loss') {
      return 'LOSS';
    }
    if (outcome === 'breakeven') {
      return 'BE';
    }
    return outcome?.toUpperCase() || 'PENDING';
  };

  return (
    <Dialog open={!!agentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              {agentName}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchAgentDetails} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : details ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-purple-500/10 text-center">
                    <p className="text-2xl font-bold">{details.stats.totalSignals}</p>
                    <p className="text-xs text-muted-foreground">Signals Reviewed</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-400">{details.stats.winRate}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 text-center">
                    <p className="text-2xl font-bold text-green-400">{details.stats.wins}</p>
                    <p className="text-xs text-muted-foreground">Winning Signals</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 text-center">
                    <p className="text-2xl font-bold text-red-400">{details.stats.losses}</p>
                    <p className="text-xs text-muted-foreground">Losing Signals</p>
                  </div>
                </div>

                {/* Win Rate Circle */}
                <div className="flex justify-center py-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${Number(details.stats.winRate) * 4.4} 440`}
                        className={Number(details.stats.winRate) >= 60 ? 'text-green-500' : Number(details.stats.winRate) >= 40 ? 'text-yellow-500' : 'text-red-500'}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{details.stats.winRate}%</span>
                      <span className="text-xs text-muted-foreground">Win Rate</span>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-xl font-bold">{details.stats.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-xl font-bold text-green-400">{details.stats.completedSessions}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-xl font-bold">{details.stats.totalComments}</p>
                    <p className="text-xs text-muted-foreground">Comments Made</p>
                  </div>
                </div>

                {/* Breakeven & Pending */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                    <p className="text-xl font-bold text-yellow-400">{details.stats.breakeven}</p>
                    <p className="text-xs text-muted-foreground">Breakeven</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-xl font-bold text-blue-400">{details.stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="p-4 rounded-lg bg-white/5 space-y-2">
                  <p className="text-sm text-muted-foreground">Email: {details.agent.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge className={details.agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>{details.agent.status}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last Active: {details.agent.last_seen_at ? formatDistanceToNow(new Date(details.agent.last_seen_at), { addSuffix: true }) : 'Never'}
                  </p>
                </div>
              </TabsContent>

              {/* Signals Tab */}
              <TabsContent value="signals" className="space-y-3 mt-0">
                <div className="text-sm text-muted-foreground mb-4">
                  Last 30 days • {details.reviewedSignals.length} signals reviewed
                </div>
                {details.reviewedSignals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No signals reviewed in the last 30 days
                  </div>
                ) : (
                  details.reviewedSignals.map((signal: any) => (
                    <motion.div
                      key={signal.id}
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{signal.symbol}</span>
                          <Badge className={signal.direction === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {signal.direction}
                          </Badge>
                        </div>
                        <Badge className={getOutcomeColor(signal.outcome)}>
                          {getOutcomeLabel(signal.outcome)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-2">
                        <span>Entry: {signal.entry_price}</span>
                        <span>SL: {signal.stop_loss}</span>
                        <span>TP1: {signal.take_profit_1}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(signal.created_at), 'MMM d, yyyy h:mm a')}</span>
                        <span className={signal.agent_approved ? 'text-green-400' : 'text-red-400'}>
                          {signal.agent_approved ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      </div>
                      {signal.agent_review_notes && (
                        <div className="mt-2 p-2 rounded bg-white/5 text-xs text-muted-foreground">
                          Note: {signal.agent_review_notes}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-3 mt-0">
                <div className="text-sm text-muted-foreground mb-4">
                  {details.sessions.length} guidance sessions assigned
                </div>
                {details.sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No guidance sessions assigned
                  </div>
                ) : (
                  details.sessions.map((session: any) => (
                    <motion.div
                      key={session.id}
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{session.topic}</span>
                        <Badge className={
                          session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          session.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          session.status === 'scheduled' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </span>
                        {session.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Scheduled: {format(new Date(session.scheduled_at), 'h:mm a')}
                          </span>
                        )}
                        {session.completed_at && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Completed: {format(new Date(session.completed_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4 mt-0">
                {/* Signal Comments */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    Recent Signal Comments
                  </h4>
                  <div className="space-y-2">
                    {details.signalComments.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No comments made
                      </div>
                    ) : (
                      details.signalComments.slice(0, 10).map((comment: any) => (
                        <div key={comment.id} className="p-3 rounded-lg bg-white/5 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-purple-400">
                              {comment.signals?.symbol} {comment.signals?.direction}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Manager Messages */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Manager Communication
                  </h4>
                  <div className="space-y-2">
                    {details.recentMessages.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No messages exchanged
                      </div>
                    ) : (
                      details.recentMessages.slice(0, 10).map((msg: any) => (
                        <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.sender_type === 'manager' ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {msg.sender_type === 'manager' ? 'Manager' : 'Agent'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load agent details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentProfileModal;
