import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipForward, SkipBack, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  outcome?: string | null;
  pnl?: number | null;
  created_at: string;
}

interface TradeReplayModalProps {
  signal: Signal;
  isOpen: boolean;
  onClose: () => void;
}

export const TradeReplayModal = ({ signal, isOpen, onClose }: TradeReplayModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(signal.entry_price);

  // Simulate price movement
  useEffect(() => {
    if (!isPlaying || progress >= 100) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  // Calculate current price based on progress
  useEffect(() => {
    const entryPrice = signal.entry_price;
    const stopLoss = signal.stop_loss;
    const takeProfit = signal.take_profit;
    const isWin = signal.outcome === 'target_hit';
    const isLoss = signal.outcome === 'stop_loss_hit';

    const targetPrice = isWin ? takeProfit : isLoss ? stopLoss : entryPrice;
    const priceRange = targetPrice - entryPrice;

    // Create realistic price movement with volatility
    const baseProgress = progress / 100;
    const volatility = Math.sin(progress * 0.3) * (Math.abs(priceRange) * 0.1);
    const trendPrice = entryPrice + priceRange * baseProgress;
    
    setCurrentPrice(trendPrice + volatility);
  }, [progress, signal]);

  const resetReplay = () => {
    setProgress(0);
    setCurrentPrice(signal.entry_price);
    setIsPlaying(false);
  };

  const getPriceColor = () => {
    if (currentPrice > signal.entry_price) return 'text-success';
    if (currentPrice < signal.entry_price) return 'text-risk';
    return 'text-muted-foreground';
  };

  const getOutcomeLabel = () => {
    if (signal.outcome === 'target_hit') return { text: 'Target Hit ✅', color: 'text-success' };
    if (signal.outcome === 'stop_loss_hit') return { text: 'Stop Loss Hit ❌', color: 'text-risk' };
    if (signal.outcome === 'cancelled') return { text: 'Breakeven ⚖️', color: 'text-yellow-400' };
    return { text: 'In Progress...', color: 'text-muted-foreground' };
  };

  // Calculate chart dimensions
  const chartHeight = 200;
  const priceMin = Math.min(signal.stop_loss, signal.take_profit, signal.entry_price) * 0.999;
  const priceMax = Math.max(signal.stop_loss, signal.take_profit, signal.entry_price) * 1.001;
  const priceRange = priceMax - priceMin;

  const priceToY = (price: number) => {
    return chartHeight - ((price - priceMin) / priceRange) * chartHeight;
  };

  // Generate price path
  const generatePricePath = () => {
    const points: string[] = [];
    const steps = Math.floor(progress / 2);
    
    for (let i = 0; i <= steps; i++) {
      const x = (i / 50) * 100;
      const progressAtStep = i * 2;
      const baseProgress = progressAtStep / 100;
      
      const entryPrice = signal.entry_price;
      const isWin = signal.outcome === 'target_hit';
      const isLoss = signal.outcome === 'stop_loss_hit';
      const targetPrice = isWin ? signal.take_profit : isLoss ? signal.stop_loss : entryPrice;
      const range = targetPrice - entryPrice;
      
      const volatility = Math.sin(progressAtStep * 0.3) * (Math.abs(range) * 0.1);
      const trendPrice = entryPrice + range * baseProgress;
      const price = trendPrice + volatility;
      
      const y = priceToY(price);
      points.push(`${x}%,${y}`);
    }
    
    return points.join(' ');
  };

  if (!isOpen) return null;

  const outcome = getOutcomeLabel();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-2xl mx-4 p-6 rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                signal.signal_type === 'BUY' 
                  ? 'bg-success/20 text-success' 
                  : 'bg-risk/20 text-risk'
              }`}>
                {signal.signal_type === 'BUY' ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                {signal.signal_type}
              </div>
              <h2 className="text-xl font-bold">{signal.symbol}</h2>
              <span className="text-sm text-muted-foreground">Trade Replay</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price Chart */}
          <div className="relative bg-black/30 rounded-xl p-4 mb-6" style={{ height: chartHeight + 60 }}>
            {/* Price Levels */}
            <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-xs">
              <span className="text-success">{signal.take_profit.toFixed(5)}</span>
              <span className="text-muted-foreground">{signal.entry_price.toFixed(5)}</span>
              <span className="text-risk">{signal.stop_loss.toFixed(5)}</span>
            </div>

            {/* Chart Area */}
            <div className="ml-20 relative" style={{ height: chartHeight }}>
              {/* Take Profit Line */}
              <div 
                className="absolute w-full border-t border-dashed border-success/50"
                style={{ top: priceToY(signal.take_profit) }}
              >
                <span className="absolute right-0 -top-3 text-xs text-success flex items-center gap-1">
                  <Target className="w-3 h-3" /> TP
                </span>
              </div>

              {/* Entry Line */}
              <div 
                className="absolute w-full border-t border-white/30"
                style={{ top: priceToY(signal.entry_price) }}
              >
                <span className="absolute right-0 -top-3 text-xs text-muted-foreground">Entry</span>
              </div>

              {/* Stop Loss Line */}
              <div 
                className="absolute w-full border-t border-dashed border-risk/50"
                style={{ top: priceToY(signal.stop_loss) }}
              >
                <span className="absolute right-0 -top-3 text-xs text-risk flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> SL
                </span>
              </div>

              {/* Price Path */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                <polyline
                  points={generatePricePath()}
                  fill="none"
                  stroke={signal.outcome === 'target_hit' ? 'hsl(var(--success))' : signal.outcome === 'stop_loss_hit' ? 'hsl(var(--risk))' : 'hsl(var(--primary))'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Current Price Dot */}
                {progress > 0 && (
                  <circle
                    cx={`${progress}%`}
                    cy={priceToY(currentPrice)}
                    r="6"
                    fill={signal.outcome === 'target_hit' ? 'hsl(var(--success))' : signal.outcome === 'stop_loss_hit' ? 'hsl(var(--risk))' : 'hsl(var(--primary))'}
                    className="animate-pulse"
                  />
                )}
              </svg>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-2 left-20 right-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Price Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-muted-foreground mb-1">Entry</p>
              <p className="font-mono font-bold">{signal.entry_price.toFixed(5)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-primary mb-1">Current</p>
              <p className={`font-mono font-bold ${getPriceColor()}`}>
                {currentPrice.toFixed(5)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-muted-foreground mb-1">P&L</p>
              <p className={`font-mono font-bold ${(signal.pnl || 0) >= 0 ? 'text-success' : 'text-risk'}`}>
                {(signal.pnl || 0) >= 0 ? '+' : ''}${(signal.pnl || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Outcome Display */}
          <div className={`text-center p-4 rounded-lg mb-6 ${
            signal.outcome === 'target_hit' ? 'bg-success/10 border border-success/30' :
            signal.outcome === 'stop_loss_hit' ? 'bg-risk/10 border border-risk/30' :
            'bg-yellow-500/10 border border-yellow-500/30'
          }`}>
            <p className={`text-lg font-bold ${outcome.color}`}>{outcome.text}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resetReplay}
              className="border-white/20"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 bg-primary hover:bg-primary/90"
              disabled={progress >= 100}
            >
              {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPlaying ? 'Pause' : progress >= 100 ? 'Complete' : 'Play'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProgress(100)}
              className="border-white/20"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
