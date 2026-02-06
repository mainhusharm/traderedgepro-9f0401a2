import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle, AlertTriangle, XCircle, Info, Shield, Plus, TrendingUp, Brain, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChallengeProgressCard } from '@/components/dashboard/ChallengeProgressCard';
import { PayoutEligibilityCard } from '@/components/dashboard/PayoutEligibilityCard';
import { AddPropAccountModal } from '@/components/dashboard/AddPropAccountModal';
import PreTradeRiskWidget from '@/components/dashboard/PreTradeRiskWidget';
import AccountHealthScore from '@/components/dashboard/AccountHealthScore';
import DailyTradingChecklist from '@/components/dashboard/DailyTradingChecklist';
import OpenTradesWidget from '@/components/dashboard/OpenTradesWidget';
import ChallengeDeadlineBanner from '@/components/dashboard/ChallengeDeadlineBanner';
import PayoutCountdownWidget from '@/components/dashboard/PayoutCountdownWidget';
import RuleChangeAcknowledgment from '@/components/dashboard/RuleChangeAcknowledgment';
import CircuitBreakerWidget from '@/components/dashboard/CircuitBreakerWidget';
import ScalingPlanWidget from '@/components/dashboard/ScalingPlanWidget';
import LotSizeConsistencyAlert from '@/components/dashboard/LotSizeConsistencyAlert';
import TradingHoursConfig from '@/components/dashboard/TradingHoursConfig';
import ProfitTargetConfig from '@/components/dashboard/ProfitTargetConfig';
import TradingKillSwitch from '@/components/dashboard/TradingKillSwitch';
import MistakePatternWidget from '@/components/dashboard/MistakePatternWidget';
import SessionPerformanceWidget from '@/components/dashboard/SessionPerformanceWidget';
import EquityProjectionWidget from '@/components/dashboard/EquityProjectionWidget';
import BreakEvenConfigWidget from '@/components/dashboard/BreakEvenConfigWidget';
import AggregateRiskWidget from '@/components/dashboard/AggregateRiskWidget';
import RiskReportExport from '@/components/dashboard/RiskReportExport';
import ManualTradeNotice from '@/components/dashboard/ManualTradeNotice';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PropFirmRulesTabProps {
  dashboardData: any;
}

// Type for prop accounts until types regenerate
interface PropAccount {
  id: string;
  prop_firm_name: string;
  account_type: string;
  account_size: number;
  account_label: string;
  starting_balance: number;
  current_equity: number;
  current_profit: number;
  profit_target: number;
  daily_dd_limit_pct: number;
  max_dd_limit_pct: number;
  daily_drawdown_used_pct: number;
  max_drawdown_used_pct: number;
  status: string;
  created_at: string;
  trading_locked_until?: string | null;
  lock_reason?: string | null;
}

const PropFirmRulesTab = ({ dashboardData }: PropFirmRulesTabProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Fetch user's prop accounts
  const { data: propAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['user-prop-accounts'],
    queryFn: async (): Promise<PropAccount[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await (supabase
        .from('user_prop_accounts' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any);
      
      if (error) throw error;
      return (data || []) as PropAccount[];
    }
  });

  // Get current user ID for widgets
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const activeAccount = selectedAccountId 
    ? propAccounts?.find(a => a.id === selectedAccountId)
    : propAccounts?.[0];
  
  const propFirm = activeAccount?.prop_firm_name || dashboardData?.prop_firm || 'FTMO';
  const accountType = activeAccount?.account_type || dashboardData?.account_type || 'Challenge Phase 1';
  const accountSize = activeAccount?.account_size || dashboardData?.account_size || 100000;

  const rules = {
    'FTMO': {
      dailyDrawdown: 5,
      maxDrawdown: 10,
      profitTarget: accountType.includes('Phase 1') ? 10 : 5,
      minTradingDays: 4,
      maxTradingDays: 30,
      newsTrading: true,
      weekendHolding: true,
      lotLimit: null
    },
    'Funding Pips': {
      dailyDrawdown: 5,
      maxDrawdown: 10,
      profitTarget: 8,
      minTradingDays: 5,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
      lotLimit: null
    },
    'MyFundedFX': {
      dailyDrawdown: 5,
      maxDrawdown: 12,
      profitTarget: 8,
      minTradingDays: 0,
      maxTradingDays: null,
      newsTrading: false,
      weekendHolding: false,
      lotLimit: 50
    }
  };

  const firmRules = rules[propFirm as keyof typeof rules] || rules['FTMO'];

  const ruleItems = [
    {
      label: 'Daily Drawdown Limit',
      value: `${firmRules.dailyDrawdown}%`,
      amount: `$${(accountSize * firmRules.dailyDrawdown / 100).toLocaleString()}`,
      status: 'good',
      current: (dashboardData?.current_drawdown || 0) < firmRules.dailyDrawdown
    },
    {
      label: 'Maximum Drawdown',
      value: `${firmRules.maxDrawdown}%`,
      amount: `$${(accountSize * firmRules.maxDrawdown / 100).toLocaleString()}`,
      status: 'good',
      current: (dashboardData?.max_drawdown || 0) < firmRules.maxDrawdown
    },
    {
      label: 'Profit Target',
      value: `${firmRules.profitTarget}%`,
      amount: `$${(accountSize * firmRules.profitTarget / 100).toLocaleString()}`,
      status: 'pending',
      progress: Math.min(100, ((dashboardData?.total_pnl || 0) / (accountSize * firmRules.profitTarget / 100)) * 100)
    },
    {
      label: 'Minimum Trading Days',
      value: firmRules.minTradingDays > 0 ? `${firmRules.minTradingDays} days` : 'None',
      status: firmRules.minTradingDays === 0 ? 'good' : 'pending',
      current: true
    },
    {
      label: 'Maximum Trading Period',
      value: firmRules.maxTradingDays ? `${firmRules.maxTradingDays} days` : 'Unlimited',
      status: 'good',
      current: true
    },
    {
      label: 'News Trading',
      value: firmRules.newsTrading ? 'Allowed' : 'Restricted',
      status: firmRules.newsTrading ? 'good' : 'warning',
      current: true
    },
    {
      label: 'Weekend Holding',
      value: firmRules.weekendHolding ? 'Allowed' : 'Not Allowed',
      status: firmRules.weekendHolding ? 'good' : 'warning',
      current: true
    },
    {
      label: 'Lot Size Limit',
      value: firmRules.lotLimit ? `${firmRules.lotLimit} lots` : 'No Limit',
      status: 'good',
      current: true
    }
  ];

  const getStatusIcon = (status: string, current: boolean) => {
    if (!current) return <XCircle className="w-5 h-5 text-risk" />;
    switch (status) {
      case 'good': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'pending': return <Info className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Prop Firm Rules</h2>
            <p className="text-sm text-muted-foreground">Track compliance with {propFirm} requirements</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {propAccounts && propAccounts.length > 0 && (
            <select 
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
              value={selectedAccountId || propAccounts[0]?.id}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {propAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.prop_firm_name} - ${account.account_size.toLocaleString()}
                </option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Rule Change Acknowledgment Modal */}
      <RuleChangeAcknowledgment 
        propFirm={propFirm} 
        accountId={activeAccount?.id}
      />

      {/* Challenge Deadline Banner - Top Priority */}
      <ChallengeDeadlineBanner accountId={activeAccount?.id} />

      {/* Pre-Trade Risk Widget - Most Important */}
      {activeAccount && (
        <PreTradeRiskWidget accountId={activeAccount.id} />
      )}

      {/* Kill Switch & Safety Controls Row - 2 per row, with 5 items: 2+2+1 layout */}
      {activeAccount && currentUser && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <TradingKillSwitch 
              accountId={activeAccount.id} 
              currentLockUntil={activeAccount.trading_locked_until}
              lockReason={activeAccount.lock_reason}
              onLockChange={() => refetchAccounts()}
              tableName="user_prop_accounts"
            />
            <CircuitBreakerWidget accountId={activeAccount.id} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <ScalingPlanWidget accountId={activeAccount.id} />
            <LotSizeConsistencyAlert accountId={activeAccount.id} />
          </div>
          <div className="grid md:grid-cols-1 gap-6">
            <AggregateRiskWidget accountId={activeAccount.id} userId={currentUser.id} />
          </div>
        </>
      )}

      {/* Performance Analytics Row */}
      {activeAccount && currentUser && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SessionPerformanceWidget accountId={activeAccount.id} userId={currentUser.id} />
          <MistakePatternWidget accountId={activeAccount.id} userId={currentUser.id} />
          <EquityProjectionWidget accountId={activeAccount.id} userId={currentUser.id} />
        </div>
      )}

      {/* Account Health, Checklist & Payout Row */}
      {activeAccount && (
        <div className="grid md:grid-cols-3 gap-6">
          <AccountHealthScore accountId={activeAccount.id} />
          <DailyTradingChecklist accountId={activeAccount.id} />
          <PayoutCountdownWidget accountId={activeAccount.id} />
        </div>
      )}

      {/* Trading Configuration Row - 2 per row with 4 items: 2+2 layout */}
      {activeAccount && currentUser && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <ProfitTargetConfig accountId={activeAccount.id} />
            <TradingHoursConfig accountId={activeAccount.id} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <BreakEvenConfigWidget accountId={activeAccount.id} />
            <RiskReportExport accountId={activeAccount.id} userId={currentUser.id} />
          </div>
        </>
      )}

      {/* Manual Trading Notice */}
      <ManualTradeNotice />

      {/* Open Trades Widget */}
      {activeAccount && (
        <OpenTradesWidget accountId={activeAccount.id} />
      )}

      {/* Prop Account Cards */}
      {activeAccount && (
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Challenge Progress
            </TabsTrigger>
            <TabsTrigger value="payout" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Payout Eligibility
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress">
            <ChallengeProgressCard accountId={activeAccount.id} />
          </TabsContent>
          
          <TabsContent value="payout">
            <PayoutEligibilityCard accountId={activeAccount.id} />
          </TabsContent>
        </Tabs>
      )}

      {/* Account Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Account Overview</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Account Size</p>
            <p className="text-2xl font-bold">${accountSize.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Equity</p>
            <p className="text-2xl font-bold text-success">
              ${(dashboardData?.current_equity || accountSize).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <p className="text-lg font-semibold text-success">Compliant</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rules Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {ruleItems.map((rule, index) => (
          <motion.div
            key={rule.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{rule.label}</p>
                <p className="text-2xl font-bold mt-1">{rule.value}</p>
                {rule.amount && (
                  <p className="text-sm text-muted-foreground">{rule.amount}</p>
                )}
              </div>
              {getStatusIcon(rule.status, rule.current !== false)}
            </div>

            {rule.progress !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{rule.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all"
                    style={{ width: `${Math.min(100, rule.progress)}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-xl bg-warning/5 border border-warning/20"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h4 className="font-semibold text-warning mb-2">Important Reminders</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Always check the latest rules on {propFirm}'s official website</li>
              <li>• Rules may change without prior notice</li>
              <li>• Some restrictions may apply during high-impact news events</li>
              <li>• Contact support if you're unsure about any rule</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Add Account Modal */}
      <AddPropAccountModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={refetchAccounts}
      />
    </div>
  );
};

export default PropFirmRulesTab;
