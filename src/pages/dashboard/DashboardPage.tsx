import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Activity,
  BarChart3,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';

interface DashboardData {
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  current_equity: number;
  account_size: number;
  current_drawdown: number;
  prop_firm: string;
  account_type: string;
}

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence_score: number;
  ai_reasoning: string;
  created_at: string;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
      fetchSignals();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const stats = [
    {
      label: 'Total P&L',
      value: `$${(dashboardData?.total_pnl || 0).toLocaleString()}`,
      change: dashboardData?.total_pnl && dashboardData.total_pnl > 0 ? '+12.5%' : '-5.2%',
      isPositive: (dashboardData?.total_pnl || 0) > 0,
      icon: TrendingUp
    },
    {
      label: 'Win Rate',
      value: `${dashboardData?.win_rate || 0}%`,
      change: '+3.2%',
      isPositive: true,
      icon: Target
    },
    {
      label: 'Total Trades',
      value: dashboardData?.total_trades || 0,
      change: '+8',
      isPositive: true,
      icon: Activity
    },
    {
      label: 'Current Drawdown',
      value: `${dashboardData?.current_drawdown || 0}%`,
      change: '-0.5%',
      isPositive: true,
      icon: Shield
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-primary">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-muted-foreground">
            {dashboardData?.prop_firm && `${dashboardData.prop_firm} • ${dashboardData.account_type}`}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className={`text-xs font-medium ${stat.isPositive ? 'text-success' : 'text-risk'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signals Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-6 rounded-xl"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live Signals
            </h2>
            
            {signals.length > 0 ? (
              <div className="space-y-4">
                {signals.map((signal) => (
                  <div
                    key={signal.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        signal.signal_type === 'BUY' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-risk/20 text-risk'
                      }`}>
                        {signal.signal_type}
                      </div>
                      <div>
                        <p className="font-semibold">{signal.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          Entry: {signal.entry_price}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{signal.confidence_score}% confidence</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(signal.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No signals yet. Complete your questionnaire to start receiving signals.</p>
              </div>
            )}
          </motion.div>

          {/* Account Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-xl"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Account Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Equity</span>
                <span className="font-semibold">${(dashboardData?.current_equity || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Size</span>
                <span className="font-semibold">${(dashboardData?.account_size || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Winning Trades</span>
                <span className="font-semibold text-success">{dashboardData?.winning_trades || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Losing Trades</span>
                <span className="font-semibold text-risk">{dashboardData?.losing_trades || 0}</span>
              </div>
            </div>

            {/* Progress to funding */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-muted-foreground mb-2">Progress to Funding</p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all"
                  style={{ width: `${Math.min((dashboardData?.win_rate || 0), 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData?.win_rate || 0}% complete
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
