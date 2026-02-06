import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { AlertTriangle, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import RiskMetricsGrid from '@/components/risk-plan/RiskMetricsGrid';
import TradingRulesCard from '@/components/risk-plan/TradingRulesCard';
import ProjectionCalculator from '@/components/risk-plan/ProjectionCalculator';
import BreakevenCalculator from '@/components/risk-plan/BreakevenCalculator';
import PropFirmRulesCard from '@/components/risk-plan/PropFirmRulesCard';

interface TradingPlan {
  propFirm: string;
  accountType: string;
  accountSize: number;
  riskPercentage: number;
  riskRewardRatio: string;
  tradesPerDay: string;
  tradingSession: string;
}

const RiskManagementPlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TradingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlan();
    }
  }, [user]);

  const fetchPlan = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPlan({
          propFirm: data.prop_firm,
          accountType: data.account_type,
          accountSize: data.account_size,
          riskPercentage: data.risk_percentage || 1,
          riskRewardRatio: data.risk_reward_ratio || '2:1',
          tradesPerDay: data.trades_per_day || '1-2',
          tradingSession: data.trading_session || 'any',
        });
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!plan) return null;

    const riskAmount = plan.accountSize * (plan.riskPercentage / 100);
    const [rewardMultiplier] = plan.riskRewardRatio.split(':').map(Number);
    const targetProfit = riskAmount * rewardMultiplier;
    const maxDailyLoss = plan.accountSize * 0.05;
    const maxTotalDrawdown = plan.accountSize * 0.10;

    return { riskAmount, targetProfit, maxDailyLoss, maxTotalDrawdown };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Trading Plan Found</h2>
            <p className="text-sm text-muted-foreground mb-6">Complete the questionnaire to generate your personalized risk management plan.</p>
            <Button onClick={() => navigate('/questionnaire')} className="w-full">
              Complete Questionnaire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Risk Management Plan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {plan.propFirm} • {plan.accountType} • ${plan.accountSize.toLocaleString()}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/questionnaire')}>
              <FileText className="w-4 h-4 mr-1.5" />
              Edit Plan
            </Button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {metrics && (
            <RiskMetricsGrid
              metrics={metrics}
              riskPercentage={plan.riskPercentage}
              accountSize={plan.accountSize}
              riskRewardRatio={plan.riskRewardRatio}
            />
          )}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Projection Calculator - Takes more space */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <ProjectionCalculator
              accountSize={plan.accountSize}
              riskPercentage={plan.riskPercentage}
              riskRewardRatio={plan.riskRewardRatio}
            />
          </motion.div>

          {/* Side Column */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PropFirmRulesCard propFirmName={plan.propFirm} accountType={plan.accountType} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <BreakevenCalculator riskRewardRatio={plan.riskRewardRatio} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TradingRulesCard
                riskPercentage={plan.riskPercentage}
                tradesPerDay={plan.tradesPerDay}
                tradingSession={plan.tradingSession}
                riskRewardRatio={plan.riskRewardRatio}
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default RiskManagementPlanPage;
