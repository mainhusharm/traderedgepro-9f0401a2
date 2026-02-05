import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import RecordWithdrawalModal from '@/components/dashboard/RecordWithdrawalModal';
import RecordDepositModal from '@/components/dashboard/RecordDepositModal';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const IncomeTrackerTab = () => {
  const { accounts, primaryAccount, totalPortfolioValue, totalProfit } = usePersonalAccounts();
  const { withdrawals, deposits, isLoading } = useWithdrawals();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('3m');

  // Calculate monthly income goal progress
  const monthlyGoal = primaryAccount?.monthly_income_goal || 0;
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  // Filter data based on selected account and time
  const filteredWithdrawals = useMemo(() => {
    let filtered = withdrawals;
    if (selectedAccountId !== 'all') {
      filtered = filtered.filter(w => w.account_id === selectedAccountId);
    }
    return filtered;
  }, [withdrawals, selectedAccountId]);

  const filteredDeposits = useMemo(() => {
    let filtered = deposits;
    if (selectedAccountId !== 'all') {
      filtered = filtered.filter(d => d.account_id === selectedAccountId);
    }
    return filtered;
  }, [deposits, selectedAccountId]);

  // This month's withdrawals
  const thisMonthWithdrawals = useMemo(() => {
    return filteredWithdrawals.filter(w => {
      const date = new Date(w.withdrawal_date);
      return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
    });
  }, [filteredWithdrawals, currentMonthStart, currentMonthEnd]);

  const thisMonthIncome = thisMonthWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const goalProgress = monthlyGoal > 0 ? (thisMonthIncome / monthlyGoal) * 100 : 0;

  // Total lifetime stats
  const totalWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const totalDeposited = filteredDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const netCashFlow = totalWithdrawn - totalDeposited;

  // Available to withdraw (profit buffer)
  const safetyBuffer = 0.2; // 20% buffer
  const availableToWithdraw = Math.max(0, totalProfit * (1 - safetyBuffer));

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; withdrawals: number; deposits: number; net: number }> = {};
    const numMonths = timeFilter === '3m' ? 3 : timeFilter === '6m' ? 6 : 12;
    
    // Initialize months
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'yyyy-MM');
      months[key] = {
        month: format(date, 'MMM'),
        withdrawals: 0,
        deposits: 0,
        net: 0,
      };
    }

    // Add withdrawals
    filteredWithdrawals.forEach(w => {
      const key = format(new Date(w.withdrawal_date), 'yyyy-MM');
      if (months[key]) {
        months[key].withdrawals += Number(w.amount);
      }
    });

    // Add deposits
    filteredDeposits.forEach(d => {
      const key = format(new Date(d.deposit_date), 'yyyy-MM');
      if (months[key]) {
        months[key].deposits += Number(d.amount);
      }
    });

    // Calculate net
    Object.values(months).forEach(m => {
      m.net = m.withdrawals - m.deposits;
    });

    return Object.values(months);
  }, [filteredWithdrawals, filteredDeposits, timeFilter]);

  // Cumulative income chart data
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return monthlyData.map(m => {
      cumulative += m.withdrawals;
      return {
        month: m.month,
        cumulative,
      };
    });
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Income Tracker</h2>
          <p className="text-muted-foreground">Track your withdrawals, deposits, and trading income</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.account_label || acc.broker_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowWithdrawalModal(true)} className="btn-glow">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Withdrawal
          </Button>
          <Button variant="outline" onClick={() => setShowDepositModal(true)}>
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Deposit
          </Button>
        </div>
      </div>

      {/* Monthly Goal Progress */}
      {monthlyGoal > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Monthly Income Goal</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(), 'MMMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${thisMonthIncome.toLocaleString()} / ${monthlyGoal.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {goalProgress >= 100 ? '🎉 Goal Achieved!' : `${(100 - goalProgress).toFixed(1)}% to go`}
                </p>
              </div>
            </div>
            <Progress value={Math.min(goalProgress, 100)} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-success mt-1">
                    ${totalWithdrawn.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredWithdrawals.length} withdrawals
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposited</p>
                  <p className="text-2xl font-bold text-accent mt-1">
                    ${totalDeposited.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredDeposits.length} deposits
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingDown className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-success' : 'text-risk'}`}>
                    {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${netCashFlow >= 0 ? 'bg-success/10' : 'bg-risk/10'}`}>
                  <DollarSign className={`w-5 h-5 ${netCashFlow >= 0 ? 'text-success' : 'text-risk'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Available to Withdraw</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ${availableToWithdraw.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    20% safety buffer applied
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Cash Flow by Month</CardTitle>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deposits" name="Deposits" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cumulative Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Total Income"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Tabs defaultValue="withdrawals">
        <TabsList>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No withdrawals recorded yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowWithdrawalModal(true)}>
                    Record Your First Withdrawal
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Account</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWithdrawals.slice(0, 20).map((w) => {
                        const account = accounts.find(a => a.id === w.account_id);
                        return (
                          <tr key={w.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                            <td className="p-4 text-sm">{format(new Date(w.withdrawal_date), 'MMM d, yyyy')}</td>
                            <td className="p-4 text-sm">{account?.account_label || account?.broker_name || 'Unknown'}</td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                w.withdrawal_type === 'profit_take' ? 'bg-success/20 text-success' :
                                w.withdrawal_type === 'emergency' ? 'bg-risk/20 text-risk' :
                                'bg-accent/20 text-accent'
                              }`}>
                                {w.withdrawal_type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-right font-semibold text-success">
                              +${Number(w.amount).toLocaleString()}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground truncate max-w-[200px]">
                              {w.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredDeposits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No deposits recorded yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowDepositModal(true)}>
                    Record Your First Deposit
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Account</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeposits.slice(0, 20).map((d) => {
                        const account = accounts.find(a => a.id === d.account_id);
                        return (
                          <tr key={d.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                            <td className="p-4 text-sm">{format(new Date(d.deposit_date), 'MMM d, yyyy')}</td>
                            <td className="p-4 text-sm">{account?.account_label || account?.broker_name || 'Unknown'}</td>
                            <td className="p-4 text-right font-semibold text-accent">
                              +${Number(d.amount).toLocaleString()}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground truncate max-w-[200px]">
                              {d.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RecordWithdrawalModal
        open={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
      />
      <RecordDepositModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </div>
  );
};

export default IncomeTrackerTab;
