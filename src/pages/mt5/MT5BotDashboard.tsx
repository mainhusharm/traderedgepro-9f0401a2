import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Power,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/layout/Header';
import { useAuth } from '@/lib/auth/AuthContext';

const MT5BotDashboard = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [botRunning, setBotRunning] = useState(false);
  
  const [stats] = useState({
    totalTrades: 127,
    winningTrades: 98,
    losingTrades: 29,
    totalPnl: 2847.50,
    todayPnl: 156.20,
    winRate: 77.2,
  });

  const [recentTrades] = useState([
    { id: 1, symbol: 'EURUSD', direction: 'BUY', pnl: 45.30, time: '2 mins ago' },
    { id: 2, symbol: 'GBPUSD', direction: 'SELL', pnl: -23.10, time: '15 mins ago' },
    { id: 3, symbol: 'USDJPY', direction: 'BUY', pnl: 67.80, time: '1 hour ago' },
    { id: 4, symbol: 'XAUUSD', direction: 'SELL', pnl: 89.20, time: '2 hours ago' },
    { id: 5, symbol: 'EURUSD', direction: 'BUY', pnl: -15.60, time: '3 hours ago' },
  ]);

  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bot className="w-8 h-8 text-accent" />
                MT5 Bot Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor and control your automated trading
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                className={isConnected ? 'bg-success/10 text-success' : 'bg-risk/10 text-risk'}
              >
                {isConnected ? (
                  <><Wifi className="w-3 h-3 mr-1" /> Connected</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> Disconnected</>
                )}
              </Badge>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Bot Control */}
          <Card className="bg-card/50 border-white/[0.08] mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${botRunning ? 'bg-success/10' : 'bg-muted/10'}`}>
                    <Power className={`w-8 h-8 ${botRunning ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Trading Bot</h2>
                    <p className="text-muted-foreground">
                      {botRunning ? 'Actively trading on your account' : 'Bot is currently stopped'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-semibold ${botRunning ? 'text-success' : 'text-muted-foreground'}`}>
                      {botRunning ? 'Running' : 'Stopped'}
                    </p>
                  </div>
                  <Switch
                    checked={botRunning}
                    onCheckedChange={setBotRunning}
                  />
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{stats.totalTrades}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-success">{stats.winRate}%</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Winning</p>
                <p className="text-2xl font-bold text-success">{stats.winningTrades}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Losing</p>
                <p className="text-2xl font-bold text-risk">{stats.losingTrades}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Today P&L</p>
                <p className={`text-2xl font-bold ${stats.todayPnl >= 0 ? 'text-success' : 'text-risk'}`}>
                  ${stats.todayPnl.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-success' : 'text-risk'}`}>
                  ${stats.totalPnl.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Trades */}
          <Card className="bg-card/50 border-white/[0.08]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${trade.direction === 'BUY' ? 'bg-success/10' : 'bg-risk/10'}`}>
                        {trade.direction === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-risk" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">{trade.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={trade.direction === 'BUY' ? 'default' : 'destructive'}>
                        {trade.direction}
                      </Badge>
                    </div>
                    <p className={`font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MT5BotDashboard;
