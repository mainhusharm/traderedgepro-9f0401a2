import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Scale, CheckCircle, TrendingUp, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface LotSizeConsistencyAlertProps {
  accountId: string;
}

interface ConsistencyAlert {
  id: string;
  alert_type: string;
  severity: string;
  current_value: number;
  expected_value: number;
  threshold_pct: number;
  was_blocked: boolean;
  message: string;
  created_at: string;
}

const LotSizeConsistencyAlert = ({ accountId }: LotSizeConsistencyAlertProps) => {
  const [alerts, setAlerts] = useState<ConsistencyAlert[]>([]);
  const [avgLotSize, setAvgLotSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const fetchData = async () => {
    try {
      // Get recent alerts
      const { data: alertsData } = await supabase
        .from('trade_consistency_alerts')
        .select('*')
        .eq('account_id', accountId)
        .eq('alert_type', 'lot_size_spike')
        .order('created_at', { ascending: false })
        .limit(10);

      setAlerts(alertsData || []);

      // Get account avg lot size
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('avg_lot_size')
        .eq('id', accountId)
        .single();

      setAvgLotSize(account?.avg_lot_size || 0);
    } catch (err) {
      console.error('Error fetching consistency data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Don't show loading state for this widget
  }

  const recentAlerts = showAll ? alerts : alerts.slice(0, 3);
  const hasAlerts = alerts.length > 0;

  return (
    <Card className={`border-border/50 ${hasAlerts ? 'border-warning/30' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Lot Size Consistency
          </CardTitle>
          {hasAlerts ? (
            <Badge variant="outline" className="text-warning border-warning/50">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-success border-success/50">
              <CheckCircle className="w-3 h-3 mr-1" />
              Consistent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average lot size display */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Your average lot size</span>
          </div>
          <span className="font-mono font-medium">
            {avgLotSize > 0 ? avgLotSize.toFixed(2) : 'Building baseline...'}
          </span>
        </div>

        {/* Alerts list */}
        {hasAlerts && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Recent Alerts</div>
            {recentAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.was_blocked 
                    ? 'bg-destructive/10 border-destructive/30' 
                    : 'bg-warning/10 border-warning/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alert.was_blocked ? 'text-destructive' : 'text-warning'
                  }`} />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {alert.current_value.toFixed(2)} lots 
                        <span className="text-muted-foreground ml-1">
                          ({((alert.current_value / alert.expected_value) * 100).toFixed(0)}% of avg)
                        </span>
                      </span>
                      <Badge variant={alert.was_blocked ? 'destructive' : 'secondary'} className="text-xs">
                        {alert.was_blocked ? 'Blocked' : 'Warning'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {alerts.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAll(!showAll)}
                className="w-full text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                {showAll ? 'Show less' : `View all ${alerts.length} alerts`}
              </Button>
            )}
          </div>
        )}

        {!hasAlerts && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Your lot sizes have been consistent. Keep up the disciplined trading!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LotSizeConsistencyAlert;
