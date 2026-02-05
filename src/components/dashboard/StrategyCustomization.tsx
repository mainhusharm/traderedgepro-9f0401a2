import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, Save, Loader2, Target, TrendingUp, Clock, 
  Percent, BarChart3, Shield, Sparkles 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface StrategyConfig {
  id?: string;
  strategy_name: string;
  risk_per_trade: number;
  max_daily_trades: number;
  max_daily_drawdown: number;
  preferred_sessions: string[];
  preferred_pairs: string[];
  min_rr_ratio: number;
  signal_filters: {
    minConfidence: number;
    excludeHighImpact: boolean;
  };
  notes: string;
}

const DEFAULT_CONFIG: StrategyConfig = {
  strategy_name: 'My Trading Strategy',
  risk_per_trade: 1.0,
  max_daily_trades: 5,
  max_daily_drawdown: 5.0,
  preferred_sessions: ['London', 'New York'],
  preferred_pairs: ['EURUSD', 'GBPUSD'],
  min_rr_ratio: 1.5,
  signal_filters: {
    minConfidence: 70,
    excludeHighImpact: false
  },
  notes: ''
};

const TRADING_SESSIONS = ['Sydney', 'Tokyo', 'London', 'New York'];
const TRADING_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'XAUUSD'];

const StrategyCustomization = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStrategy();
    }
  }, [user]);

  const fetchStrategy = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('strategy_customizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig({
          id: data.id,
          strategy_name: data.strategy_name,
          risk_per_trade: Number(data.risk_per_trade),
          max_daily_trades: data.max_daily_trades,
          max_daily_drawdown: Number(data.max_daily_drawdown),
          preferred_sessions: data.preferred_sessions || [],
          preferred_pairs: data.preferred_pairs || [],
          min_rr_ratio: Number(data.min_rr_ratio),
          signal_filters: data.signal_filters as any || DEFAULT_CONFIG.signal_filters,
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching strategy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        strategy_name: config.strategy_name,
        risk_per_trade: config.risk_per_trade,
        max_daily_trades: config.max_daily_trades,
        max_daily_drawdown: config.max_daily_drawdown,
        preferred_sessions: config.preferred_sessions,
        preferred_pairs: config.preferred_pairs,
        min_rr_ratio: config.min_rr_ratio,
        signal_filters: config.signal_filters,
        notes: config.notes
      };

      if (config.id) {
        const { error } = await supabase
          .from('strategy_customizations')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('strategy_customizations')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Strategy saved successfully!');
      setHasChanges(false);
      fetchStrategy();
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast.error('Failed to save strategy');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof StrategyConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleSession = (session: string) => {
    const sessions = config.preferred_sessions.includes(session)
      ? config.preferred_sessions.filter(s => s !== session)
      : [...config.preferred_sessions, session];
    updateConfig('preferred_sessions', sessions);
  };

  const togglePair = (pair: string) => {
    const pairs = config.preferred_pairs.includes(pair)
      ? config.preferred_pairs.filter(p => p !== pair)
      : [...config.preferred_pairs, pair];
    updateConfig('preferred_pairs', pairs);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Strategy Customization
          </CardTitle>
          <Badge className="bg-purple-500/20 text-purple-400">Pro/Enterprise</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your trading parameters to match your style
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Name */}
        <div className="space-y-2">
          <Label htmlFor="strategy-name" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Strategy Name
          </Label>
          <Input
            id="strategy-name"
            value={config.strategy_name}
            onChange={(e) => updateConfig('strategy_name', e.target.value)}
            placeholder="My Trading Strategy"
            className="bg-white/5 border-white/10"
          />
        </div>

        {/* Risk Management */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" />
            Risk Management
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Percent className="w-3 h-3" />
                  Risk Per Trade
                </span>
                <span className="text-primary font-mono">{config.risk_per_trade}%</span>
              </Label>
              <Slider
                value={[config.risk_per_trade]}
                onValueChange={([v]) => updateConfig('risk_per_trade', v)}
                min={0.1}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Max Daily Trades
                </span>
                <span className="text-primary font-mono">{config.max_daily_trades}</span>
              </Label>
              <Slider
                value={[config.max_daily_trades]}
                onValueChange={([v]) => updateConfig('max_daily_trades', v)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Max Daily Drawdown
                </span>
                <span className="text-primary font-mono">{config.max_daily_drawdown}%</span>
              </Label>
              <Slider
                value={[config.max_daily_drawdown]}
                onValueChange={([v]) => updateConfig('max_daily_drawdown', v)}
                min={1}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  Min Risk:Reward Ratio
                </span>
                <span className="text-primary font-mono">1:{config.min_rr_ratio}</span>
              </Label>
              <Slider
                value={[config.min_rr_ratio]}
                onValueChange={([v]) => updateConfig('min_rr_ratio', v)}
                min={1}
                max={5}
                step={0.5}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Trading Sessions */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Preferred Trading Sessions
          </Label>
          <div className="flex flex-wrap gap-2">
            {TRADING_SESSIONS.map(session => (
              <Badge
                key={session}
                variant={config.preferred_sessions.includes(session) ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  config.preferred_sessions.includes(session) 
                    ? 'bg-primary hover:bg-primary/80' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => toggleSession(session)}
              >
                {session}
              </Badge>
            ))}
          </div>
        </div>

        {/* Trading Pairs */}
        <div className="space-y-3">
          <Label>Preferred Trading Pairs</Label>
          <div className="flex flex-wrap gap-2">
            {TRADING_PAIRS.map(pair => (
              <Badge
                key={pair}
                variant={config.preferred_pairs.includes(pair) ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  config.preferred_pairs.includes(pair) 
                    ? 'bg-success/80 hover:bg-success' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => togglePair(pair)}
              >
                {pair}
              </Badge>
            ))}
          </div>
        </div>

        {/* Signal Filters */}
        <div className="space-y-4">
          <Label>Signal Filters</Label>
          <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm">Minimum Confidence Level</span>
              <span className="text-primary font-mono">{config.signal_filters.minConfidence}%</span>
            </div>
            <Slider
              value={[config.signal_filters.minConfidence]}
              onValueChange={([v]) => updateConfig('signal_filters', { ...config.signal_filters, minConfidence: v })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm">Exclude High-Impact News Signals</span>
              <Switch
                checked={config.signal_filters.excludeHighImpact}
                onCheckedChange={(v) => updateConfig('signal_filters', { ...config.signal_filters, excludeHighImpact: v })}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Strategy Notes</Label>
          <Textarea
            id="notes"
            value={config.notes}
            onChange={(e) => updateConfig('notes', e.target.value)}
            placeholder="Add any personal notes about your strategy..."
            className="bg-white/5 border-white/10 min-h-[80px]"
          />
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Strategy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StrategyCustomization;
