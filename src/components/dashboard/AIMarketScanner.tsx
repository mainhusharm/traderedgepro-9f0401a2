import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Radar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MarketOpportunity {
  id: string;
  symbol: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  setup_type: string;
  timeframe: string;
  key_levels: {
    resistance?: number;
    support?: number;
    entry_zone?: string;
  };
  ai_reasoning: string;
  confluence_factors: string[];
  detected_at: string;
  expires_at: string;
}

const FOREX_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'GBPJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'];

const AIMarketScanner = () => {
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchOpportunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('market_opportunities')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('strength', { ascending: false })
        .limit(10);

      if (error) throw error;
      setOpportunities(data || []);
      setLastScan(new Date());
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      // Generate mock opportunities for demo
      generateMockOpportunities();
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMockOpportunities = () => {
    const setups = [
      'Order Block Retest',
      'Fair Value Gap Fill',
      'Liquidity Sweep',
      'Break of Structure',
      'Inducement Taken',
      'Displacement'
    ];

    const mockOpportunities: MarketOpportunity[] = FOREX_PAIRS.slice(0, 4).map((symbol, idx) => {
      const isBullish = Math.random() > 0.5;
      const strength = Math.floor(Math.random() * 40) + 60; // 60-100

      return {
        id: `mock-${idx}`,
        symbol,
        direction: isBullish ? 'bullish' : 'bearish',
        strength,
        setup_type: setups[Math.floor(Math.random() * setups.length)],
        timeframe: ['15M', '1H', '4H'][Math.floor(Math.random() * 3)],
        key_levels: {
          resistance: parseFloat((1.1 + Math.random() * 0.1).toFixed(5)),
          support: parseFloat((1.0 + Math.random() * 0.1).toFixed(5)),
          entry_zone: isBullish ? 'Near Support' : 'Near Resistance',
        },
        ai_reasoning: `${symbol} showing ${isBullish ? 'bullish' : 'bearish'} momentum with ${setups[Math.floor(Math.random() * setups.length)]} forming on higher timeframe. Multiple confluence factors align for potential ${isBullish ? 'long' : 'short'} opportunity.`,
        confluence_factors: [
          'HTF Trend Alignment',
          'Key Level Rejection',
          'Volume Confirmation',
          'Session Timing',
        ].slice(0, Math.floor(Math.random() * 2) + 2),
        detected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      };
    });

    setOpportunities(mockOpportunities);
    setLastScan(new Date());
  };

  useEffect(() => {
    fetchOpportunities();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchOpportunities, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  const handleManualScan = async () => {
    setScanning(true);
    toast.info('Scanning markets for opportunities...');

    // Simulate AI scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    await fetchOpportunities();
    setScanning(false);
    toast.success('Market scan complete!');
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-500';
    if (strength >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Strong';
    if (strength >= 60) return 'Moderate';
    return 'Weak';
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'bearish':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedTab === 'all') return true;
    return opp.direction === selectedTab;
  });

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Radar className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3">Scanning markets...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Market Scanner
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastScan && (
              <span className="text-xs text-muted-foreground">
                Last scan: {getTimeAgo(lastScan.toISOString())}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualScan}
              disabled={scanning}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${scanning ? 'animate-spin' : ''}`} />
              Scan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">
              All ({opportunities.length})
            </TabsTrigger>
            <TabsTrigger value="bullish" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Bullish
            </TabsTrigger>
            <TabsTrigger value="bearish" className="text-xs">
              <TrendingDown className="w-3 h-3 mr-1" />
              Bearish
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4 space-y-3">
            {filteredOpportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Radar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No opportunities detected</p>
                <p className="text-sm mt-1">Run a manual scan or wait for auto-refresh</p>
              </div>
            ) : (
              filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">{opp.symbol}</span>
                        {getDirectionIcon(opp.direction)}
                        <Badge variant="outline" className="text-xs">
                          {opp.timeframe}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${opp.direction === 'bullish' ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}
                        >
                          {opp.setup_type}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {opp.ai_reasoning}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {opp.confluence_factors.map((factor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {opp.key_levels.entry_zone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(opp.detected_at)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getStrengthColor(opp.strength)}`}>
                        {opp.strength}%
                      </div>
                      <div className={`text-xs ${getStrengthColor(opp.strength)}`}>
                        {getStrengthLabel(opp.strength)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-3 border-t border-white/10">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p>
              AI-detected opportunities are for informational purposes only. Always perform your own analysis
              and follow proper risk management before taking any trades.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIMarketScanner;
