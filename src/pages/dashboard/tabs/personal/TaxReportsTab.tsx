import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Filter,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfYear, endOfYear, subYears, isWithinInterval, parseISO } from 'date-fns';

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entry_date: string;
  exit_date: string | null;
  pnl: number;
  outcome: string;
}

const TaxReportsTab = () => {
  const { user } = useAuth();
  const { accounts, totalProfit } = usePersonalAccounts();
  const { withdrawals, deposits } = useWithdrawals();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [taxRate, setTaxRate] = useState(25);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const yearStart = startOfYear(new Date(parseInt(selectedYear), 0));
  const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0));

  // Fetch trades for the year
  const fetchTrades = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('id, symbol, signal_type, created_at, pnl, outcome')
        .eq('user_id', user.id)
        .gte('created_at', yearStart.toISOString())
        .lte('created_at', yearEnd.toISOString())
        .neq('outcome', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTrades((data || []).map(t => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.signal_type || 'unknown',
        entry_date: t.created_at,
        exit_date: null,
        pnl: t.pnl || 0,
        outcome: t.outcome || 'unknown',
      })));
    } catch (err) {
      console.error('Error fetching trades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on year change
  useState(() => {
    fetchTrades();
  });

  // Filter withdrawals/deposits by year
  const yearWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      const date = new Date(w.withdrawal_date);
      return isWithinInterval(date, { start: yearStart, end: yearEnd });
    });
  }, [withdrawals, yearStart, yearEnd]);

  const yearDeposits = useMemo(() => {
    return deposits.filter(d => {
      const date = new Date(d.deposit_date);
      return isWithinInterval(date, { start: yearStart, end: yearEnd });
    });
  }, [deposits, yearStart, yearEnd]);

  // Calculate P&L summary
  const summary = useMemo(() => {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const netPnl = grossProfit - grossLoss;
    
    const totalWithdrawn = yearWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const totalDeposited = yearDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
    
    const estimatedTax = netPnl > 0 ? netPnl * (taxRate / 100) : 0;
    const netAfterTax = netPnl - estimatedTax;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      grossProfit,
      grossLoss,
      netPnl,
      totalWithdrawn,
      totalDeposited,
      estimatedTax,
      netAfterTax,
    };
  }, [trades, yearWithdrawals, yearDeposits, taxRate]);

  // Generate CSV export
  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Direction', 'P&L', 'Outcome'];
    const rows = trades.map(t => [
      format(new Date(t.entry_date), 'yyyy-MM-dd'),
      t.symbol,
      t.direction,
      t.pnl.toFixed(2),
      t.outcome,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tax Reports</h2>
          <p className="text-muted-foreground">Generate P&L reports for tax filing purposes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={printReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Tax Rate Setting */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calculator className="w-5 h-5 text-primary" />
            <Label className="whitespace-nowrap">Estimated Tax Rate:</Label>
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
              className="w-24"
              min={0}
              max={100}
            />
            <span className="text-muted-foreground">%</span>
            <p className="text-xs text-muted-foreground ml-4">
              This is for estimation only. Consult a tax professional for accurate calculations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Gross Profit</span>
              </div>
              <p className="text-2xl font-bold text-success">
                ${summary.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.winningTrades} winning trades
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-risk/20 bg-risk/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-5 h-5 text-risk" />
                <span className="text-sm text-muted-foreground">Gross Loss</span>
              </div>
              <p className="text-2xl font-bold text-risk">
                -${summary.grossLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.losingTrades} losing trades
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={`border-${summary.netPnl >= 0 ? 'primary' : 'risk'}/20 bg-${summary.netPnl >= 0 ? 'primary' : 'risk'}/5`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className={`w-5 h-5 ${summary.netPnl >= 0 ? 'text-primary' : 'text-risk'}`} />
                <span className="text-sm text-muted-foreground">Net P&L</span>
              </div>
              <p className={`text-2xl font-bold ${summary.netPnl >= 0 ? 'text-primary' : 'text-risk'}`}>
                {summary.netPnl >= 0 ? '+' : '-'}${Math.abs(summary.netPnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalTrades} total trades
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calculator className="w-5 h-5 text-warning" />
                <span className="text-sm text-muted-foreground">Estimated Tax</span>
              </div>
              <p className="text-2xl font-bold text-warning">
                ${summary.estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                At {taxRate}% tax rate
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedYear} Tax Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-muted-foreground">Gross Trading Profit</span>
                <span className="font-medium text-success">+${summary.grossProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-muted-foreground">Gross Trading Loss</span>
                <span className="font-medium text-risk">-${summary.grossLoss.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-muted-foreground font-medium">Net Trading Income</span>
                <span className={`font-bold ${summary.netPnl >= 0 ? 'text-success' : 'text-risk'}`}>
                  {summary.netPnl >= 0 ? '+' : ''}${summary.netPnl.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-muted-foreground">Total Withdrawn</span>
                <span className="font-medium">${summary.totalWithdrawn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-muted-foreground">Total Deposited</span>
                <span className="font-medium">${summary.totalDeposited.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.08]">
                <span className="text-muted-foreground">Estimated Tax ({taxRate}%)</span>
                <span className="font-medium text-warning">${summary.estimatedTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 pt-4">
                <span className="text-lg font-semibold">Net After Tax</span>
                <span className={`text-lg font-bold ${summary.netAfterTax >= 0 ? 'text-success' : 'text-risk'}`}>
                  ${summary.netAfterTax.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trading Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{summary.totalTrades}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{summary.winRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                <p className="text-sm text-muted-foreground">Winning Trades</p>
                <p className="text-2xl font-bold text-success">{summary.winningTrades}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                <p className="text-sm text-muted-foreground">Losing Trades</p>
                <p className="text-2xl font-bold text-risk">{summary.losingTrades}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                <p className="text-sm text-muted-foreground">Avg Win</p>
                <p className="text-2xl font-bold text-success">
                  ${summary.winningTrades > 0 ? (summary.grossProfit / summary.winningTrades).toFixed(0) : 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                <p className="text-sm text-muted-foreground">Avg Loss</p>
                <p className="text-2xl font-bold text-risk">
                  ${summary.losingTrades > 0 ? (summary.grossLoss / summary.losingTrades).toFixed(0) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Trade History - {selectedYear}</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchTrades} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trades recorded for {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Direction</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">P&L</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 50).map((trade) => (
                    <tr key={trade.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="p-4 text-sm">
                        {format(new Date(trade.entry_date), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4 text-sm font-medium">{trade.symbol}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          trade.direction === 'buy' || trade.direction === 'long'
                            ? 'bg-success/20 text-success'
                            : 'bg-risk/20 text-risk'
                        }`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          trade.outcome === 'target_hit' ? 'bg-success/20 text-success' :
                          trade.outcome === 'stopped_out' ? 'bg-risk/20 text-risk' :
                          'bg-muted/20 text-muted-foreground'
                        }`}>
                          {trade.outcome.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {trades.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Showing first 50 trades. Export CSV for complete data.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-warning/80">
              <p className="font-medium mb-1">Tax Disclaimer</p>
              <p>
                This report is for informational purposes only and should not be considered tax advice.
                Tax laws vary by jurisdiction and personal circumstances. Always consult with a qualified
                tax professional or accountant before filing your taxes. Trading income may be subject to
                different tax treatments depending on your location and trading frequency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxReportsTab;
