import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Settings2,
  Save,
  RotateCcw,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface SignalPreferences {
  // Symbol filters
  enabled_pairs: string[];
  // Confluence settings
  min_confluence_score: number;
  // Session preferences
  preferred_sessions: string[];
  // Signal types
  signal_types: {
    scalp: boolean;
    intraday: boolean;
    swing: boolean;
  };
  // Notification timing
  priority_delivery: boolean;
  // Risk preferences
  max_risk_per_trade: number;
  preferred_rr_ratio: number;
}

const FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'GBPJPY',
  'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'EURGBP'
];

const TRADING_SESSIONS = [
  { id: 'asian', label: 'Asian Session', time: '00:00 - 09:00 UTC' },
  { id: 'london', label: 'London Session', time: '08:00 - 17:00 UTC' },
  { id: 'newyork', label: 'New York Session', time: '13:00 - 22:00 UTC' },
  { id: 'overlap', label: 'London-NY Overlap', time: '13:00 - 17:00 UTC' },
];

const DEFAULT_PREFERENCES: SignalPreferences = {
  enabled_pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'GBPJPY'],
  min_confluence_score: 70,
  preferred_sessions: ['london', 'newyork', 'overlap'],
  signal_types: {
    scalp: true,
    intraday: true,
    swing: true,
  },
  priority_delivery: true,
  max_risk_per_trade: 1,
  preferred_rr_ratio: 2,
};

const CustomSignalParameters = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SignalPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('signal_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data.preferences as SignalPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('signal_preferences')
        .upsert({
          user_id: user.id,
          preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Signal preferences saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.success('Signal preferences saved successfully');
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
  };

  const updatePreference = <K extends keyof SignalPreferences>(
    key: K,
    value: SignalPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const togglePair = (pair: string) => {
    const newPairs = preferences.enabled_pairs.includes(pair)
      ? preferences.enabled_pairs.filter(p => p !== pair)
      : [...preferences.enabled_pairs, pair];
    updatePreference('enabled_pairs', newPairs);
  };

  const toggleSession = (sessionId: string) => {
    const newSessions = preferences.preferred_sessions.includes(sessionId)
      ? preferences.preferred_sessions.filter(s => s !== sessionId)
      : [...preferences.preferred_sessions, sessionId];
    updatePreference('preferred_sessions', newSessions);
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="w-5 h-5 text-purple-500" />
              Custom Signal Parameters
            </CardTitle>
            <CardDescription>
              Customize which signals you receive based on your trading preferences
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority Delivery */}
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-medium">Priority Signal Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Receive signals 5-10 minutes before other users
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.priority_delivery}
              onCheckedChange={(checked) => updatePreference('priority_delivery', checked)}
            />
          </div>
        </div>

        {/* Trading Pairs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Trading Pairs</Label>
            <Badge variant="outline" className="text-xs">
              {preferences.enabled_pairs.length} selected
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {FOREX_PAIRS.map((pair) => (
              <Button
                key={pair}
                variant={preferences.enabled_pairs.includes(pair) ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePair(pair)}
                className="text-xs"
              >
                {preferences.enabled_pairs.includes(pair) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {pair}
              </Button>
            ))}
          </div>
        </div>

        {/* Confluence Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Minimum Confluence Score</Label>
            <Badge variant="outline" className="text-xs">
              {preferences.min_confluence_score}%
            </Badge>
          </div>
          <Slider
            value={[preferences.min_confluence_score]}
            onValueChange={([value]) => updatePreference('min_confluence_score', value)}
            min={50}
            max={95}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>More signals (50%)</span>
            <span>Higher quality (95%)</span>
          </div>
        </div>

        {/* Trading Sessions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Preferred Trading Sessions
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TRADING_SESSIONS.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  preferences.preferred_sessions.includes(session.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={preferences.preferred_sessions.includes(session.id)}
                    onCheckedChange={() => toggleSession(session.id)}
                  />
                  <div>
                    <div className="font-medium text-sm">{session.label}</div>
                    <div className="text-xs text-muted-foreground">{session.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signal Types */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Signal Types
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'scalp', label: 'Scalp', desc: '5-15 min trades' },
              { key: 'intraday', label: 'Intraday', desc: '1-4 hour trades' },
              { key: 'swing', label: 'Swing', desc: 'Multi-day trades' },
            ].map((type) => (
              <div
                key={type.key}
                className={`p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                  preferences.signal_types[type.key as keyof typeof preferences.signal_types]
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onClick={() =>
                  updatePreference('signal_types', {
                    ...preferences.signal_types,
                    [type.key]: !preferences.signal_types[type.key as keyof typeof preferences.signal_types],
                  })
                }
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground">{type.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Max Risk Per Trade</Label>
              <Badge variant="outline" className="text-xs">
                {preferences.max_risk_per_trade}%
              </Badge>
            </div>
            <Slider
              value={[preferences.max_risk_per_trade]}
              onValueChange={([value]) => updatePreference('max_risk_per_trade', value)}
              min={0.5}
              max={3}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preferred R:R Ratio</Label>
              <Badge variant="outline" className="text-xs">
                1:{preferences.preferred_rr_ratio}
              </Badge>
            </div>
            <Slider
              value={[preferences.preferred_rr_ratio]}
              onValueChange={([value]) => updatePreference('preferred_rr_ratio', value)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        {/* Info Notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Signal filtering is applied server-side. You'll only receive notifications for signals
            that match your configured parameters. Changes take effect immediately after saving.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomSignalParameters;
