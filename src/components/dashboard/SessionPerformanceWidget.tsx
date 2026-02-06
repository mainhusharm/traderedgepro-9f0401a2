import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SessionPerformanceWidgetProps {
  accountId: string;
  userId: string;
}

interface SessionStats {
  session: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
}

const SESSION_CONFIG: Record<string, { label: string; time: string; color: string }> = {
  asian: { label: 'Asian', time: '00:00 - 08:00 UTC', color: 'bg-purple-500' },
  london: { label: 'London', time: '08:00 - 13:00 UTC', color: 'bg-blue-500' },
  overlap: { label: 'Overlap', time: '13:00 - 16:00 UTC', color: 'bg-green-500' },
  new_york: { label: 'New York', time: '16:00 - 21:00 UTC', color: 'bg-amber-500' },
  after_hours: { label: 'After Hours', time: '21:00 - 00:00 UTC', color: 'bg-gray-500' },
};

export default function SessionPerformanceWidget({ accountId, userId }: SessionPerformanceWidgetProps) {
  const [sessions, setSessions] = useState<SessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestSession, setBestSession] = useState<string | null>(null);
  const [worstSession, setWorstSession] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionPerformance();
  }, [accountId, userId]);

  const fetchSessionPerformance = async () => {
    try {
      // Get journal entries with session data - cast to any to avoid type issues with new columns
      const { data: entries, error } = await (supabase
        .from('trade_journal' as any)
        .select('session_taken, pnl')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .not('session_taken', 'is', null) as any);

      if (error) throw error;

      // Aggregate by session
      const sessionMap: Record<string, SessionStats> = {};
      
      for (const entry of (entries || []) as any[]) {
        const session = entry.session_taken || 'unknown';
        if (!sessionMap[session]) {
          sessionMap[session] = {
            session,
            total_trades: 0,
            wins: 0,
            losses: 0,
            win_rate: 0,
            total_pnl: 0,
            avg_pnl: 0,
          };
        }
        
        sessionMap[session].total_trades++;
        sessionMap[session].total_pnl += entry.pnl || 0;
        
        if (entry.pnl && entry.pnl > 0) {
          sessionMap[session].wins++;
        } else if (entry.pnl && entry.pnl < 0) {
          sessionMap[session].losses++;
        }
      }

      // Calculate derived metrics
      const sessionStats = Object.values(sessionMap).map(s => ({
        ...s,
        win_rate: s.total_trades > 0 ? (s.wins / s.total_trades) * 100 : 0,
        avg_pnl: s.total_trades > 0 ? s.total_pnl / s.total_trades : 0,
      }));

      // Find best and worst
      if (sessionStats.length > 0) {
        const sorted = [...sessionStats].sort((a, b) => b.win_rate - a.win_rate);
        const minTrades = 3; // Minimum trades to be considered
        const qualified = sorted.filter(s => s.total_trades >= minTrades);
        
        if (qualified.length > 0) {
          setBestSession(qualified[0].session);
          setWorstSession(qualified[qualified.length - 1].session);
        }
      }

      setSessions(sessionStats.sort((a, b) => b.total_trades - a.total_trades));
    } catch (error) {
      console.error('Error fetching session performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Session Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Session Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No session data yet</p>
            <p className="text-xs text-muted-foreground mt-1">Journal entries with session tags will appear here</p>
          </div>
        ) : (
          <>
            {/* Session bars */}
            <div className="space-y-3">
              {sessions.map((session) => {
                const config = SESSION_CONFIG[session.session] || {
                  label: session.session,
                  time: '',
                  color: 'bg-gray-500'
                };
                const isBest = session.session === bestSession;
                const isWorst = session.session === worstSession && session.session !== bestSession;

                return (
                  <div key={session.session} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                        {isBest && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        {isWorst && <TrendingDown className="h-3 w-3 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{session.total_trades} trades</span>
                        <Badge 
                          variant={session.win_rate >= 50 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {session.win_rate.toFixed(0)}%
                        </Badge>
                        <span className={session.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${session.total_pnl >= 0 ? '+' : ''}{session.total_pnl.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={session.win_rate} 
                      className="h-1.5"
                    />
                  </div>
                );
              })}
            </div>

            {/* Recommendation */}
            {bestSession && worstSession && bestSession !== worstSession && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Session Insight</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your best performance is during <strong>{SESSION_CONFIG[bestSession]?.label || bestSession}</strong>.
                      {worstSession && worstSession !== bestSession && (
                        <> Consider reducing trades during <strong>{SESSION_CONFIG[worstSession]?.label || worstSession}</strong>.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
