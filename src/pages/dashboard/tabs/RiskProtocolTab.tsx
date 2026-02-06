import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, AlertTriangle, Calculator, DollarSign, Percent, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RiskProtocolTabProps {
  dashboardData: any;
}

const RiskProtocolTab = ({ dashboardData }: RiskProtocolTabProps) => {
  const accountSize = dashboardData?.account_size || 100000;
  
  const [riskSettings, setRiskSettings] = useState({
    riskPerTrade: 1,
    stopLossPips: 20,
    maxDailyRisk: 5,
    maxDrawdown: 10
  });

  // Calculations
  const riskAmount = (accountSize * riskSettings.riskPerTrade) / 100;
  const lotSize = riskAmount / (riskSettings.stopLossPips * 10); // Simplified calculation
  const maxDailyLoss = (accountSize * riskSettings.maxDailyRisk) / 100;
  const maxDrawdownAmount = (accountSize * riskSettings.maxDrawdown) / 100;
  const tradesUntilMaxLoss = Math.floor(maxDailyLoss / riskAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Risk Protocol</h2>
          <p className="text-sm text-muted-foreground">Configure and monitor your risk management</p>
        </div>
      </div>

      {/* Risk Calculator */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Position Size Calculator
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Risk Per Trade</Label>
                <span className="text-primary font-semibold">{riskSettings.riskPerTrade}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={riskSettings.riskPerTrade}
                onChange={(e) => setRiskSettings({ ...riskSettings, riskPerTrade: parseFloat(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative (0.5%)</span>
                <span>Aggressive (3%)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stop Loss (Pips)</Label>
              <Input
                type="number"
                value={riskSettings.stopLossPips}
                onChange={(e) => setRiskSettings({ ...riskSettings, stopLossPips: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Daily Risk</Label>
                <span className="text-warning font-semibold">{riskSettings.maxDailyRisk}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={riskSettings.maxDailyRisk}
                onChange={(e) => setRiskSettings({ ...riskSettings, maxDailyRisk: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-warning"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Drawdown</Label>
                <span className="text-risk font-semibold">{riskSettings.maxDrawdown}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={riskSettings.maxDrawdown}
                onChange={(e) => setRiskSettings({ ...riskSettings, maxDrawdown: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-risk"
              />
            </div>
          </div>
        </motion.div>

        {/* Calculations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Risk Amount */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Risk Amount Per Trade
              </span>
              <span className="text-2xl font-bold text-primary">${riskAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {riskSettings.riskPerTrade}% of ${accountSize.toLocaleString()}
            </p>
          </div>

          {/* Lot Size */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Recommended Lot Size
              </span>
              <span className="text-2xl font-bold text-success">{lotSize.toFixed(2)} lots</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {riskSettings.stopLossPips} pip stop loss
            </p>
          </div>

          {/* Max Daily Loss */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Max Daily Loss Limit
              </span>
              <span className="text-2xl font-bold text-warning">${maxDailyLoss.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Stop trading after {tradesUntilMaxLoss} consecutive losses
            </p>
          </div>

          {/* Max Drawdown */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Maximum Drawdown
              </span>
              <span className="text-2xl font-bold text-risk">${maxDrawdownAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Account breach at ${(accountSize - maxDrawdownAmount).toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Risk Level Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-4">Current Risk Assessment</h3>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gradient-to-r from-success via-warning to-risk rounded-full overflow-hidden">
              <div 
                className="h-full w-1 bg-white"
                style={{ marginLeft: `${Math.min(100, riskSettings.riskPerTrade * 33)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Conservative</span>
              <span>Moderate</span>
              <span>Aggressive</span>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            riskSettings.riskPerTrade <= 1 ? 'bg-success/20 text-success' :
            riskSettings.riskPerTrade <= 2 ? 'bg-warning/20 text-warning' :
            'bg-risk/20 text-risk'
          }`}>
            {riskSettings.riskPerTrade <= 1 ? 'Low Risk' :
             riskSettings.riskPerTrade <= 2 ? 'Medium Risk' : 'High Risk'}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {riskSettings.riskPerTrade <= 1 
            ? '✅ Great for prop firm challenges. Low risk per trade allows for more recovery opportunities.'
            : riskSettings.riskPerTrade <= 2 
            ? '⚠️ Moderate risk. Suitable for experienced traders with good win rates.'
            : '🚨 High risk approach. Only recommended for very experienced traders with proven strategies.'}
        </p>
      </motion.div>
    </div>
  );
};

export default RiskProtocolTab;
