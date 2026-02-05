import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';

interface MistakePatternWidgetProps {
  accountId: string;
  userId: string;
}

interface MistakePattern {
  mistake_type: string;
  count: number;
  total_pnl_impact: number;
  avg_pnl_when_mistake: number;
  win_rate_with_mistake: number;
}

const MISTAKE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  fomo: { label: 'FOMO Trades', icon: '⚡', color: 'text-amber-500' },
  revenge: { label: 'Revenge Trading', icon: '😤', color: 'text-red-500' },
  oversized: { label: 'Oversized Positions', icon: '📈', color: 'text-orange-500' },
  session_violation: { label: 'Session Violations', icon: '🕐', color: 'text-blue-500' },
  news: { label: 'News Trading', icon: '📰', color: 'text-purple-500' },
  after_cooling_off: { label: 'Ignored Cool-Off', icon: '🧘', color: 'text-cyan-500' },
};

export default function MistakePatternWidget({ accountId, userId }: MistakePatternWidgetProps) {
  const [patterns, setPatterns] = useState<MistakePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalPnlImpact, setTotalPnlImpact] = useState(0);
  const [trend, setTrend] = useState<'improving' | 'worsening' | 'stable' | 'insufficient_data'>('insufficient_data');

  useEffect(() => {
    fetchPatterns();
  }, [accountId, userId]);

  const fetchPatterns = async () => {
    try {
      // Get current week start
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];

      const { data, error } = await (supabase
        .from('trading_mistake_patterns' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .eq('week_start', weekStart) as any);

      if (error) throw error;

      setPatterns(data || []);
      setTotalMistakes(data?.reduce((sum, p) => sum + p.count, 0) || 0);
      setTotalPnlImpact(data?.reduce((sum, p) => sum + (p.total_pnl_impact || 0), 0) || 0);

      // Fetch trend from edge function
      try {
        const { data: trendData } = await callEdgeFunction('detect-trading-mistakes', { action: 'get_historical', user_id: userId, account_id: accountId });
        if (trendData?.trend) {
          setTrend(trendData.trend);
        }
      } catch (e) {
        console.log('Trend fetch skipped');
      }
    } catch (error) {
      console.error('Error fetching mistake patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'worsening':
        return 'Needs attention';
      case 'stable':
        return 'Stable';
      default:
        return 'Building data';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            Mistake Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Mistake Patterns
          </div>
          <div className="flex items-center gap-1.5">
            {getTrendIcon()}
            <span className="text-xs font-normal text-muted-foreground">{getTrendLabel()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {patterns.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-green-600 font-medium">🎯 No mistakes detected this week!</p>
            <p className="text-xs text-muted-foreground mt-1">Keep up the disciplined trading</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-lg font-semibold">{totalMistakes} mistakes</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">P&L Impact</p>
                <p className={`text-lg font-semibold ${totalPnlImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalPnlImpact >= 0 ? '+' : ''}{totalPnlImpact.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Individual patterns */}
            <div className="space-y-3">
              {patterns
                .sort((a, b) => (a.total_pnl_impact || 0) - (b.total_pnl_impact || 0))
                .map((pattern) => {
                  const config = MISTAKE_LABELS[pattern.mistake_type] || { 
                    label: pattern.mistake_type, 
                    icon: '⚠️', 
                    color: 'text-muted-foreground' 
                  };
                  const maxCount = Math.max(...patterns.map(p => p.count));
                  
                  return (
                    <div key={pattern.mistake_type} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {pattern.count}x
                          </Badge>
                          <span className={`text-xs ${(pattern.total_pnl_impact || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${(pattern.total_pnl_impact || 0).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(pattern.count / maxCount) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  );
                })}
            </div>

            {/* Worst pattern callout */}
            {patterns.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Focus Area
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {MISTAKE_LABELS[patterns.sort((a, b) => (a.total_pnl_impact || 0) - (b.total_pnl_impact || 0))[0]?.mistake_type]?.label || 'Unknown'} is your biggest detractor. Consider adding a pre-trade reminder.
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
