import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  PieChart,
  AlertTriangle,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import AddPersonalAccountModal from '@/components/dashboard/AddPersonalAccountModal';
import RecordWithdrawalModal from '@/components/dashboard/RecordWithdrawalModal';
import RecordDepositModal from '@/components/dashboard/RecordDepositModal';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const PersonalOverviewTab = () => {
  const { accounts, isLoading, totalPortfolioValue, totalProfit, primaryAccount } = usePersonalAccounts();
  const { monthlyWithdrawals, totalWithdrawals } = useWithdrawals();
  
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const profitPercentage = totalPortfolioValue > 0 
    ? ((totalProfit / (totalPortfolioValue - totalProfit)) * 100)
    : 0;

  const activeAccounts = accounts.filter(a => a.status === 'active');
  
  // Prepare pie chart data
  const pieData = activeAccounts.map(account => ({
    name: account.account_label || account.broker_name,
    value: Number(account.current_balance),
  }));

  // Calculate monthly income goal progress
  const monthlyIncomeGoal = primaryAccount?.monthly_income_goal || 0;
  const incomeProgress = monthlyIncomeGoal > 0 
    ? Math.min((monthlyWithdrawals / monthlyIncomeGoal) * 100, 100)
    : 0;

  // Capital preservation status
  const capitalFloor = primaryAccount?.capital_floor || 0;
  const isNearCapitalFloor = primaryAccount && capitalFloor > 0 
    && Number(primaryAccount.current_balance) < capitalFloor * 1.1;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6 h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Personal Capital Mode</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Track your real trading accounts, manage withdrawals, and grow your personal capital with AI-powered signals.
        </p>
        <Button onClick={() => setShowAddAccount(true)} className="btn-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Account
        </Button>
        
        <AddPersonalAccountModal 
          open={showAddAccount} 
          onClose={() => setShowAddAccount(false)} 
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowAddAccount(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
        <Button onClick={() => setShowDeposit(true)} variant="outline" size="sm">
          <ArrowDownToLine className="w-4 h-4 mr-2" />
          Record Deposit
        </Button>
        <Button onClick={() => setShowWithdrawal(true)} variant="outline" size="sm">
          <ArrowUpFromLine className="w-4 h-4 mr-2" />
          Record Withdrawal
        </Button>
      </div>

      {/* Capital Preservation Alert */}
      {isNearCapitalFloor && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-risk/10 border border-risk/20 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-risk shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-risk">Capital Floor Warning</h4>
            <p className="text-sm text-muted-foreground">
              Your balance is approaching your capital floor of ${capitalFloor.toLocaleString()}. 
              Consider reducing position sizes or pausing trading.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Portfolio Value */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio</p>
                <p className="text-2xl font-bold mt-1">
                  ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">{activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit/Loss */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-success' : 'text-risk'}`}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${totalProfit >= 0 ? 'bg-success/10' : 'bg-risk/10'}`}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-success" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-risk" />
                )}
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className={totalProfit >= 0 ? 'text-success' : 'text-risk'}>
                {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}% return
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Withdrawals */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Withdrawn</p>
                <p className="text-2xl font-bold mt-1">
                  ${monthlyWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <ArrowUpFromLine className="w-6 h-6 text-accent" />
              </div>
            </div>
            {monthlyIncomeGoal > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Goal: ${monthlyIncomeGoal.toLocaleString()}</span>
                  <span>{incomeProgress.toFixed(0)}%</span>
                </div>
                <Progress value={incomeProgress} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                <p className="text-2xl font-bold mt-1 text-success">
                  ${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Lifetime income from trading
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Distribution & Account Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pie Chart */}
        {pieData.length > 1 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Portfolio Distribution
              </CardTitle>
              <CardDescription>Balance across all accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Cards */}
        <div className={pieData.length > 1 ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="grid gap-4 md:grid-cols-2">
            {activeAccounts.map((account) => {
              const accountProfit = Number(account.current_balance) - Number(account.starting_balance);
              const accountReturn = ((accountProfit / Number(account.starting_balance)) * 100);
              const drawdown = account.highest_balance > 0 
                ? ((Number(account.highest_balance) - Number(account.current_balance)) / Number(account.highest_balance)) * 100
                : 0;

              return (
                <Card key={account.id} className="glass-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{account.account_label || account.broker_name}</h4>
                          {account.is_primary && (
                            <span className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{account.broker_name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{account.currency}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <span className="font-bold">${Number(account.current_balance).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">P&L</span>
                        <span className={`font-medium ${accountProfit >= 0 ? 'text-success' : 'text-risk'}`}>
                          {accountProfit >= 0 ? '+' : ''}${accountProfit.toLocaleString()} ({accountReturn.toFixed(1)}%)
                        </span>
                      </div>
                      {drawdown > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">From Peak</span>
                          <span className="text-risk">-{drawdown.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPersonalAccountModal 
        open={showAddAccount} 
        onClose={() => setShowAddAccount(false)} 
      />
      <RecordWithdrawalModal 
        open={showWithdrawal} 
        onClose={() => setShowWithdrawal(false)} 
      />
      <RecordDepositModal 
        open={showDeposit} 
        onClose={() => setShowDeposit(false)} 
      />
    </div>
  );
};

export default PersonalOverviewTab;
