import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, DollarSign, User, TrendingUp, RefreshCw, IndianRupee, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccountantApi } from '@/hooks/useAccountantApi';

interface ProfitConfig {
  id: string;
  partner_name: string;
  partner_role: string;
  share_percentage: number;
  is_active: boolean;
}

interface PaymentSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

const USD_TO_INR = 83.5;

const ProfitSharingTab = () => {
  const { callAccountantApi, isLoading } = useAccountantApi();
  const [config, setConfig] = useState<ProfitConfig[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configResult, paymentsResult, expensesResult] = await Promise.all([
        callAccountantApi('get_profit_config'),
        callAccountantApi('get_payments'),
        callAccountantApi('get_expenses')
      ]);

      setConfig(configResult.config || []);

      const completedPayments = (paymentsResult.payments || []).filter((p: any) => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + (p.final_price || 0), 0);
      const affiliateCommissions = completedPayments.reduce((sum: number, p: any) => sum + (p.affiliate_commission || 0), 0);
      
      const expenses = expensesResult.expenses || [];
      const totalExpenses = expenses.reduce((sum: number, e: any) => {
        // Convert INR expenses to USD for calculation
        const amount = e.currency === 'INR' ? (e.amount || 0) / USD_TO_INR : (e.amount || 0);
        return sum + amount;
      }, 0) + affiliateCommissions;

      const netProfit = totalRevenue - totalExpenses;

      setSummary({ totalRevenue, totalExpenses, netProfit });
    } catch (error) {
      console.error('Failed to fetch profit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const partnerShares = config.map(partner => ({
    ...partner,
    shareAmount: (summary.netProfit * partner.share_percentage) / 100
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">${summary.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(summary.totalRevenue * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">${summary.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(summary.totalExpenses * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <PieChart className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                ${summary.netProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(summary.netProfit * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Profit Distribution */}
      <Card className="border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            Profit Distribution
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partnerShares.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border-2 ${index === 0 ? 'border-purple-500/30 bg-purple-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${index === 0 ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                            <User className={`w-7 h-7 ${index === 0 ? 'text-purple-500' : 'text-cyan-500'}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{partner.partner_name}</h3>
                            <p className="text-sm text-muted-foreground">{partner.partner_role}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${index === 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                          <Percent className="w-4 h-4" />
                          <span className="font-bold">{partner.share_percentage}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-white/[0.08]">
                        <p className="text-sm text-muted-foreground mb-2">Share of Net Profit</p>
                        <div className="flex items-baseline gap-3">
                          <span className={`text-3xl font-bold ${partner.shareAmount >= 0 ? (index === 0 ? 'text-purple-400' : 'text-cyan-400') : 'text-red-400'}`}>
                            ${partner.shareAmount.toFixed(2)}
                          </span>
                          <span className="text-lg text-muted-foreground">
                            ₹{(partner.shareAmount * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Distribution Bar */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-lg">Profit Split Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex rounded-lg overflow-hidden h-12">
              {partnerShares.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  className={`flex items-center justify-center ${index === 0 ? 'bg-purple-500' : 'bg-cyan-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${partner.share_percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <span className="text-white font-bold text-sm">
                    {partner.partner_name} ({partner.share_percentage}%)
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Anchal: ${partnerShares[0]?.shareAmount.toFixed(2) || '0.00'}</span>
              <span>Sahil: ${partnerShares[1]?.shareAmount.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitSharingTab;
