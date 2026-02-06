import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingDown, Activity, AlertTriangle, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface PositionSizingResult {
  standardLotSize: number;
  adjustedLotSize: number;
  riskReduction: number;
  maxRiskAmount: number;
  adjustedRiskAmount: number;
  warnings: string[];
}

export const SmartPositionSizer = () => {
  const { user } = useAuth();
  const [accountSize, setAccountSize] = useState(10000);
  const [currentDrawdown, setCurrentDrawdown] = useState(0);
  const [baseRiskPercent, setBaseRiskPercent] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(30);
  const [pipValue, setPipValue] = useState(10); // Default for standard lot
  const [volatilityMultiplier, setVolatilityMultiplier] = useState(1);
  const [result, setResult] = useState<PositionSizingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's account data
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: dashboardData } = await supabase
          .from('dashboard_data')
          .select('account_size, current_drawdown, max_drawdown')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: questionnaire } = await supabase
          .from('questionnaires')
          .select('account_size, risk_percentage')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dashboardData) {
          setAccountSize(dashboardData.account_size || 10000);
          setCurrentDrawdown(dashboardData.current_drawdown || 0);
        } else if (questionnaire) {
          setAccountSize(questionnaire.account_size || 10000);
          setBaseRiskPercent(questionnaire.risk_percentage || 1);
        }
      } catch (error) {
        console.error('Error fetching account data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, [user]);

  // Calculate position size whenever inputs change
  useEffect(() => {
    calculatePosition();
  }, [accountSize, currentDrawdown, baseRiskPercent, stopLossPips, pipValue, volatilityMultiplier]);

  const calculatePosition = () => {
    const warnings: string[] = [];

    // Standard risk calculation
    const standardRiskAmount = accountSize * (baseRiskPercent / 100);
    const standardLotSize = standardRiskAmount / (stopLossPips * pipValue);

    // Drawdown adjustment factor (reduce risk as drawdown increases)
    let drawdownFactor = 1;
    if (currentDrawdown >= 8) {
      drawdownFactor = 0.25; // 75% reduction at 8%+ drawdown
      warnings.push('Critical drawdown level - risk heavily reduced');
    } else if (currentDrawdown >= 5) {
      drawdownFactor = 0.5; // 50% reduction at 5-8% drawdown
      warnings.push('High drawdown - risk reduced by 50%');
    } else if (currentDrawdown >= 3) {
      drawdownFactor = 0.75; // 25% reduction at 3-5% drawdown
      warnings.push('Elevated drawdown - risk reduced by 25%');
    }

    // Volatility adjustment (reduce size in high volatility)
    let volatilityFactor = 1;
    if (volatilityMultiplier >= 2) {
      volatilityFactor = 0.5;
      warnings.push('High volatility detected - position halved');
    } else if (volatilityMultiplier >= 1.5) {
      volatilityFactor = 0.75;
      warnings.push('Elevated volatility - position reduced');
    } else if (volatilityMultiplier < 0.5) {
      volatilityFactor = 1.25; // Slightly increase in low volatility
    }

    // Combined adjustment
    const combinedFactor = drawdownFactor * volatilityFactor;
    const adjustedRiskAmount = standardRiskAmount * combinedFactor;
    const adjustedLotSize = adjustedRiskAmount / (stopLossPips * pipValue);

    // Safety checks
    if (adjustedLotSize < 0.01) {
      warnings.push('Position size below minimum - consider skipping trade');
    }

    const riskReduction = ((1 - combinedFactor) * 100);

    setResult({
      standardLotSize: Math.max(0.01, parseFloat(standardLotSize.toFixed(2))),
      adjustedLotSize: Math.max(0.01, parseFloat(adjustedLotSize.toFixed(2))),
      riskReduction: parseFloat(riskReduction.toFixed(0)),
      maxRiskAmount: parseFloat(standardRiskAmount.toFixed(2)),
      adjustedRiskAmount: parseFloat(adjustedRiskAmount.toFixed(2)),
      warnings
    });
  };

  const getVolatilityLabel = (mult: number): string => {
    if (mult >= 2) return 'Very High';
    if (mult >= 1.5) return 'High';
    if (mult >= 1) return 'Normal';
    if (mult >= 0.5) return 'Low';
    return 'Very Low';
  };

  const getVolatilityColor = (mult: number): string => {
    if (mult >= 2) return 'text-red-400';
    if (mult >= 1.5) return 'text-orange-400';
    if (mult >= 1) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Smart Position Sizer
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Risk-adjusted sizing based on drawdown & volatility
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Account Size ($)</Label>
              <Input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Current Drawdown (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentDrawdown}
                onChange={(e) => setCurrentDrawdown(parseFloat(e.target.value) || 0)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Base Risk (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={baseRiskPercent}
                onChange={(e) => setBaseRiskPercent(parseFloat(e.target.value) || 0)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stop Loss (pips)</Label>
              <Input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 1)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pip Value ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={pipValue}
                onChange={(e) => setPipValue(parseFloat(e.target.value) || 1)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                Volatility
                <span className={`text-xs ${getVolatilityColor(volatilityMultiplier)}`}>
                  ({getVolatilityLabel(volatilityMultiplier)})
                </span>
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="3"
                value={volatilityMultiplier}
                onChange={(e) => setVolatilityMultiplier(parseFloat(e.target.value) || 1)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Standard Size</span>
                  </div>
                  <p className="text-2xl font-bold">{result.standardLotSize} lots</p>
                  <p className="text-xs text-muted-foreground">Risk: ${result.maxRiskAmount}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary">Adjusted Size</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{result.adjustedLotSize} lots</p>
                  <p className="text-xs text-muted-foreground">Risk: ${result.adjustedRiskAmount}</p>
                </div>
              </div>

              {/* Risk Reduction Indicator */}
              {result.riskReduction > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">
                      Risk Reduced by {result.riskReduction}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on current drawdown ({currentDrawdown.toFixed(1)}%) and volatility conditions
                  </p>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  {result.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-orange-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Drawdown Zones */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-2">Drawdown Risk Zones</p>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  <div className="flex-1 bg-green-500/60" title="0-3%: Full risk" />
                  <div className="flex-1 bg-yellow-500/60" title="3-5%: 75% risk" />
                  <div className="flex-1 bg-orange-500/60" title="5-8%: 50% risk" />
                  <div className="flex-1 bg-red-500/60" title="8%+: 25% risk" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>3%</span>
                  <span>5%</span>
                  <span>8%+</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
