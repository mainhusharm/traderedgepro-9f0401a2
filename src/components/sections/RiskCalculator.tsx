import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Calculator, Shield } from 'lucide-react';

type InstrumentType = 'forex' | 'futures' | 'crypto';

// Instrument-specific configurations
const INSTRUMENT_CONFIGS = {
  forex: {
    label: 'Forex',
    pipValue: 0.0001,
    pipValueJPY: 0.01,
    pipValuePerLot: 10, // $10 per pip per standard lot
    goldPipValue: 0.1,
    goldPipValuePerLot: 10,
    description: 'Major & minor currency pairs',
  },
  futures: {
    label: 'Futures',
    tickSize: 0.25, // E-mini S&P 500
    tickValue: 12.50, // $12.50 per tick
    contractMultiplier: 50, // E-mini S&P multiplier
    description: 'Index & commodity futures',
  },
  crypto: {
    label: 'Crypto',
    standardLotSize: 1, // 1 BTC/ETH
    pipValue: 1, // $1 per point
    description: 'Bitcoin, Ethereum, etc.',
  },
};

const RiskCalculator = () => {
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('forex');
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopLoss, setStopLoss] = useState(20);
  const [dailyDrawdown, setDailyDrawdown] = useState(5);

  // Calculate risk metrics based on instrument type
  const calculateRiskMetrics = () => {
    const maxDailyLoss = (accountSize * dailyDrawdown) / 100;
    const riskPerTrade = (accountSize * riskPercent) / 100;
    const maxTrades = Math.floor(maxDailyLoss / riskPerTrade);

    let lotSize = 0;
    let positionLabel = 'Lot Size';

    switch (instrumentType) {
      case 'forex': {
        const pipValuePerLot = INSTRUMENT_CONFIGS.forex.pipValuePerLot;
        lotSize = riskPerTrade / (stopLoss * pipValuePerLot);
        positionLabel = 'Lot Size';
        break;
      }
      case 'futures': {
        const tickValue = INSTRUMENT_CONFIGS.futures.tickValue;
        const ticksForStopLoss = stopLoss;
        lotSize = riskPerTrade / (ticksForStopLoss * tickValue);
        positionLabel = 'Contracts';
        break;
      }
      case 'crypto': {
        lotSize = riskPerTrade / stopLoss;
        positionLabel = 'Position ($)';
        break;
      }
    }

    return {
      maxDailyLoss,
      riskPerTrade,
      lotSize: Math.max(0.01, lotSize),
      maxTrades,
      positionLabel,
    };
  };

  const metrics = calculateRiskMetrics();

  const getRiskLevel = () => {
    if (riskPercent <= 1) return { level: 'Conservative', color: 'text-success', bg: 'bg-success/10' };
    if (riskPercent <= 2) return { level: 'Moderate', color: 'text-warning', bg: 'bg-warning/10' };
    return { level: 'Aggressive', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const riskLevel = getRiskLevel();

  const getStopLossLabel = () => {
    switch (instrumentType) {
      case 'forex':
        return 'Stop Loss (Pips)';
      case 'futures':
        return 'Stop Loss (Ticks)';
      case 'crypto':
        return 'Stop Loss ($)';
    }
  };

  const getStopLossRange = () => {
    switch (instrumentType) {
      case 'forex':
        return { min: 5, max: 100, step: 5 };
      case 'futures':
        return { min: 2, max: 50, step: 1 };
      case 'crypto':
        return { min: 10, max: 500, step: 10 };
    }
  };

  const stopLossRange = getStopLossRange();

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        {/* Centered layout */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Risk Management
            </span>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              Prop Firm Rule Tracker
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Calculate your position sizes and ensure you never breach your prop firm's risk parameters.
            </p>
          </motion.div>

          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Instrument Type Selector */}
            <div className="mb-8">
              <label className="text-sm text-muted-foreground mb-3 block">Select Instrument Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(INSTRUMENT_CONFIGS) as InstrumentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setInstrumentType(type)}
                    className={`p-4 rounded-xl border transition-all ${
                      instrumentType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20 text-muted-foreground'
                    }`}
                  >
                    <span className="font-semibold block">{INSTRUMENT_CONFIGS[type].label}</span>
                    <span className="text-xs opacity-70">{INSTRUMENT_CONFIGS[type].description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk level indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary" />
                <span className="text-xl font-semibold text-foreground">Position Calculator</span>
              </div>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${riskLevel.color} ${riskLevel.bg}`}>
                {riskLevel.level} Risk
              </span>
            </div>

            {/* Sliders */}
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Account Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground">Account Balance</label>
                  <span className="text-lg font-bold text-foreground">${accountSize.toLocaleString()}</span>
                </div>
                <Slider
                  value={[accountSize]}
                  onValueChange={(v) => setAccountSize(v[0])}
                  min={5000}
                  max={200000}
                  step={5000}
                  className="[&>span:first-child]:bg-muted [&>span:first-child>span]:bg-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>$5K</span>
                  <span>$200K</span>
                </div>
              </div>

              {/* Daily Drawdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground">Daily Drawdown Limit</label>
                  <span className="text-lg font-bold text-foreground">{dailyDrawdown}%</span>
                </div>
                <Slider
                  value={[dailyDrawdown]}
                  onValueChange={(v) => setDailyDrawdown(v[0])}
                  min={1}
                  max={10}
                  step={0.5}
                  className="[&>span:first-child]:bg-muted [&>span:first-child>span]:bg-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>10%</span>
                </div>
              </div>

              {/* Risk Per Trade */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground">Risk Per Trade</label>
                  <span className="text-lg font-bold text-foreground">{riskPercent}%</span>
                </div>
                <Slider
                  value={[riskPercent]}
                  onValueChange={(v) => setRiskPercent(v[0])}
                  min={0.25}
                  max={5}
                  step={0.25}
                  className="[&>span:first-child]:bg-muted [&>span:first-child>span]:bg-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0.25%</span>
                  <span>5%</span>
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground">{getStopLossLabel()}</label>
                  <span className="text-lg font-bold text-foreground">{stopLoss}</span>
                </div>
                <Slider
                  value={[stopLoss]}
                  onValueChange={(v) => setStopLoss(v[0])}
                  min={stopLossRange.min}
                  max={stopLossRange.max}
                  step={stopLossRange.step}
                  className="[&>span:first-child]:bg-muted [&>span:first-child>span]:bg-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{stopLossRange.min}</span>
                  <span>{stopLossRange.max}</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-muted/30 rounded-2xl p-5 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Max Daily Loss</span>
                <span className="text-2xl font-bold text-destructive">${metrics.maxDailyLoss.toFixed(0)}</span>
              </div>
              <div className="bg-muted/30 rounded-2xl p-5 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Risk Per Trade</span>
                <span className="text-2xl font-bold text-warning">${metrics.riskPerTrade.toFixed(0)}</span>
              </div>
              <div className="bg-muted/30 rounded-2xl p-5 text-center">
                <span className="text-xs text-muted-foreground block mb-1">{metrics.positionLabel}</span>
                <span className="text-2xl font-bold text-primary">
                  {instrumentType === 'crypto' 
                    ? `$${metrics.lotSize.toFixed(0)}`
                    : metrics.lotSize.toFixed(2)
                  }
                </span>
              </div>
              <div className="bg-muted/30 rounded-2xl p-5 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Max Trades/Day</span>
                <span className="text-2xl font-bold text-success">{metrics.maxTrades}</span>
              </div>
            </div>

            {/* Calculation Formula */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <p className="text-xs text-muted-foreground mb-2">📐 Calculation Formula:</p>
              <p className="text-sm font-mono text-foreground">
                {instrumentType === 'forex' && (
                  <>Lot Size = Risk Amount ÷ (Stop Loss Pips × $10/pip)<br />
                  = ${metrics.riskPerTrade.toFixed(2)} ÷ ({stopLoss} × $10) = {metrics.lotSize.toFixed(2)} lots</>
                )}
                {instrumentType === 'futures' && (
                  <>Contracts = Risk Amount ÷ (Stop Loss Ticks × $12.50/tick)<br />
                  = ${metrics.riskPerTrade.toFixed(2)} ÷ ({stopLoss} × $12.50) = {metrics.lotSize.toFixed(2)} contracts</>
                )}
                {instrumentType === 'crypto' && (
                  <>Position Size = Risk Amount ÷ Stop Loss Distance<br />
                  = ${metrics.riskPerTrade.toFixed(2)} ÷ ${stopLoss} = ${metrics.lotSize.toFixed(0)} position</>
                )}
              </p>
            </div>

            {/* Pro Tip */}
            <div className={`rounded-2xl p-5 ${riskLevel.bg} border border-white/[0.05]`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 ${riskLevel.color} shrink-0 mt-0.5`} />
                <div>
                  <span className={`font-semibold ${riskLevel.color}`}>Pro Tip:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {riskPercent <= 1
                      ? 'Conservative approach — perfect for prop firm challenges. This gives you room for losing streaks.'
                      : riskPercent <= 2
                      ? 'Balanced risk level — suitable for experienced traders. Monitor your drawdown closely.'
                      : 'High risk approach — not recommended for challenges. Consider reducing your risk percentage.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RiskCalculator;