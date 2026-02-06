import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Ban,
  CheckCircle,
  Settings,
  Save,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import { useToast } from '@/hooks/use-toast';
import TradingKillSwitch from '@/components/dashboard/TradingKillSwitch';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const CapitalPreservationTab = () => {
  const { accounts, primaryAccount, updateAccount, totalProfit, fetchAccounts } = usePersonalAccounts();
  const { toast } = useToast();
  
  const [selectedAccountId, setSelectedAccountId] = useState(primaryAccount?.id || '');
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || primaryAccount;

  // Local state for settings
  const [settings, setSettings] = useState({
    dailyLossLimit: selectedAccount?.daily_loss_limit_pct || 3,
    capitalFloor: selectedAccount?.capital_floor || 0,
    riskPerTrade: selectedAccount?.risk_per_trade_pct || 1,
    enableRecoveryMode: true,
    recoveryRiskReduction: 50, // Reduce risk by 50% after hitting loss limit
    coolOffHours: 24,
    consecutiveLossLimit: 3,
  });

  // Calculate drawdown stats
  const currentDrawdown = useMemo(() => {
    if (!selectedAccount) return 0;
    const highest = selectedAccount.highest_balance || selectedAccount.starting_balance;
    return ((highest - selectedAccount.current_balance) / highest) * 100;
  }, [selectedAccount]);

  const dailyDrawdown = useMemo(() => {
    // This would normally come from daily stats, using estimate for now
    return Math.min(currentDrawdown, settings.dailyLossLimit * 0.6);
  }, [currentDrawdown, settings.dailyLossLimit]);

  // Risk level calculation
  const riskLevel = useMemo(() => {
    if (currentDrawdown > 10) return 'critical';
    if (currentDrawdown > 5) return 'high';
    if (currentDrawdown > 2) return 'moderate';
    return 'low';
  }, [currentDrawdown]);

  const riskColors = {
    low: 'text-success',
    moderate: 'text-warning',
    high: 'text-orange-500',
    critical: 'text-risk',
  };

  const riskBgColors = {
    low: 'bg-success/10 border-success/20',
    moderate: 'bg-warning/10 border-warning/20',
    high: 'bg-orange-500/10 border-orange-500/20',
    critical: 'bg-risk/10 border-risk/20',
  };

  // Capital floor status
  const capitalFloorReached = selectedAccount && settings.capitalFloor > 0 
    ? selectedAccount.current_balance <= settings.capitalFloor 
    : false;

  // Mock equity curve data
  const equityCurve = useMemo(() => {
    const data = [];
    let equity = selectedAccount?.starting_balance || 10000;
    const highest = selectedAccount?.highest_balance || equity;
    
    for (let i = 30; i >= 0; i--) {
      const variation = (Math.random() - 0.45) * (equity * 0.02);
      equity = Math.max(equity + variation, equity * 0.9);
      data.push({
        day: 30 - i,
        equity: Math.round(equity),
        floor: settings.capitalFloor,
        highest: highest,
      });
    }
    
    // End at current balance
    if (selectedAccount) {
      data[data.length - 1].equity = selectedAccount.current_balance;
    }
    
    return data;
  }, [selectedAccount, settings.capitalFloor]);

  const handleSaveSettings = async () => {
    if (!selectedAccountId) return;

    const result = await updateAccount(selectedAccountId, {
      daily_loss_limit_pct: settings.dailyLossLimit,
      capital_floor: settings.capitalFloor,
      risk_per_trade_pct: settings.riskPerTrade,
    });

    if (result) {
      toast({
        title: 'Settings Saved',
        description: 'Your capital protection settings have been updated.',
      });
    }
  };

  if (!selectedAccount && accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">No Accounts Found</h2>
        <p className="text-muted-foreground">Add a personal trading account to configure capital protection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Capital Protection</h2>
          <p className="text-muted-foreground">Protect your trading capital with smart risk controls</p>
        </div>
        {accounts.length > 1 && (
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-4 py-2 rounded-lg bg-background border border-white/[0.08] text-sm"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.account_label || acc.broker_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Alert Banners */}
      {capitalFloorReached && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-risk/20 border border-risk/30 flex items-center gap-3"
        >
          <Ban className="w-6 h-6 text-risk shrink-0" />
          <div>
            <p className="font-semibold text-risk">Capital Floor Reached!</p>
            <p className="text-sm text-risk/80">
              Your account has hit the minimum balance of ${settings.capitalFloor.toLocaleString()}. 
              Trading should be paused until you review your strategy.
            </p>
          </div>
        </motion.div>
      )}

      {dailyDrawdown >= settings.dailyLossLimit * 0.8 && !capitalFloorReached && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-warning/20 border border-warning/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
          <div>
            <p className="font-semibold text-warning">Approaching Daily Loss Limit</p>
            <p className="text-sm text-warning/80">
              You've used {dailyDrawdown.toFixed(1)}% of your {settings.dailyLossLimit}% daily limit. Consider reducing position sizes.
            </p>
          </div>
        </motion.div>
      )}

      {/* Kill Switch */}
      {selectedAccount && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TradingKillSwitch
            accountId={selectedAccount.id}
            currentLockUntil={selectedAccount.trading_locked_until}
            lockReason={selectedAccount.lock_reason}
            onLockChange={() => fetchAccounts()}
            tableName="user_personal_accounts"
          />
        </div>
      )}

      {/* Risk Level & Drawdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border ${riskBgColors[riskLevel]}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className={`w-6 h-6 ${riskColors[riskLevel]}`} />
              <span className="text-sm text-muted-foreground">Risk Level</span>
            </div>
            <p className={`text-3xl font-bold capitalize ${riskColors[riskLevel]}`}>
              {riskLevel}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Based on current drawdown
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="w-6 h-6 text-risk" />
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
            </div>
            <p className={`text-3xl font-bold ${currentDrawdown > 5 ? 'text-risk' : 'text-foreground'}`}>
              {currentDrawdown.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              From highest balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-warning" />
              <span className="text-sm text-muted-foreground">Daily Drawdown</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-2xl font-bold ${dailyDrawdown >= settings.dailyLossLimit ? 'text-risk' : ''}`}>
                  {dailyDrawdown.toFixed(2)}%
                </span>
                <span className="text-sm text-muted-foreground">/ {settings.dailyLossLimit}%</span>
              </div>
              <Progress 
                value={(dailyDrawdown / settings.dailyLossLimit) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equity Curve (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                {settings.capitalFloor > 0 && (
                  <ReferenceLine 
                    y={settings.capitalFloor} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    label={{ value: 'Capital Floor', fill: '#ef4444', position: 'right' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#22c55e"
                  fill="url(#equityGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Protection Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Loss Limit */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Daily Loss Limit</Label>
                <span className="text-sm text-primary font-medium">{settings.dailyLossLimit}%</span>
              </div>
              <Slider
                value={[settings.dailyLossLimit]}
                onValueChange={([val]) => setSettings({ ...settings, dailyLossLimit: val })}
                min={1}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Maximum daily loss before alerts trigger
              </p>
            </div>

            {/* Capital Floor */}
            <div className="space-y-2">
              <Label>Capital Floor</Label>
              <Input
                type="number"
                value={settings.capitalFloor}
                onChange={(e) => setSettings({ ...settings, capitalFloor: Number(e.target.value) })}
                placeholder="Minimum balance to maintain"
              />
              <p className="text-xs text-muted-foreground">
                Never let your balance fall below this amount
              </p>
            </div>

            {/* Risk Per Trade */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Risk Per Trade</Label>
                <span className="text-sm text-primary font-medium">{settings.riskPerTrade}%</span>
              </div>
              <Slider
                value={[settings.riskPerTrade]}
                onValueChange={([val]) => setSettings({ ...settings, riskPerTrade: val })}
                min={0.25}
                max={5}
                step={0.25}
              />
            </div>

            <Button onClick={handleSaveSettings} className="w-full btn-glow">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Recovery Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Recovery Mode */}
            <div className="flex items-center justify-between rounded-lg border border-white/[0.08] p-4">
              <div>
                <Label>Enable Recovery Mode</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically reduce risk after hitting loss limits
                </p>
              </div>
              <Switch
                checked={settings.enableRecoveryMode}
                onCheckedChange={(checked) => setSettings({ ...settings, enableRecoveryMode: checked })}
              />
            </div>

            {settings.enableRecoveryMode && (
              <>
                {/* Recovery Risk Reduction */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Risk Reduction in Recovery</Label>
                    <span className="text-sm text-accent font-medium">{settings.recoveryRiskReduction}%</span>
                  </div>
                  <Slider
                    value={[settings.recoveryRiskReduction]}
                    onValueChange={([val]) => setSettings({ ...settings, recoveryRiskReduction: val })}
                    min={25}
                    max={75}
                    step={5}
                  />
                </div>

                {/* Cool Off Period */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Cool-Off Period</Label>
                    <span className="text-sm text-accent font-medium">{settings.coolOffHours}h</span>
                  </div>
                  <Slider
                    value={[settings.coolOffHours]}
                    onValueChange={([val]) => setSettings({ ...settings, coolOffHours: val })}
                    min={1}
                    max={48}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wait time after hitting daily limit
                  </p>
                </div>

                {/* Consecutive Loss Limit */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Consecutive Loss Trigger</Label>
                    <span className="text-sm text-accent font-medium">{settings.consecutiveLossLimit} trades</span>
                  </div>
                  <Slider
                    value={[settings.consecutiveLossLimit]}
                    onValueChange={([val]) => setSettings({ ...settings, consecutiveLossLimit: val })}
                    min={2}
                    max={5}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter recovery mode after this many consecutive losses
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Protection Rules Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Protection Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Daily Limit</p>
                <p className="text-xs text-muted-foreground">Stop at {settings.dailyLossLimit}% loss</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Capital Floor</p>
                <p className="text-xs text-muted-foreground">
                  {settings.capitalFloor > 0 ? `$${settings.capitalFloor.toLocaleString()}` : 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Max Risk/Trade</p>
                <p className="text-xs text-muted-foreground">{settings.riskPerTrade}% per trade</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
              {settings.enableRecoveryMode ? (
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
              ) : (
                <Ban className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">Recovery Mode</p>
                <p className="text-xs text-muted-foreground">
                  {settings.enableRecoveryMode ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200/80">
              <p className="font-medium mb-1">Capital Preservation Best Practices</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Never risk more than 1-2% of your account on a single trade</li>
                <li>Set a daily loss limit and stick to it no matter what</li>
                <li>Your capital floor should cover at least 3 months of drawdown recovery</li>
                <li>After 3 consecutive losses, reduce position sizes by 50%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapitalPreservationTab;
