import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, Filter, Calendar, TrendingUp, TrendingDown, Target, X, Search, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  confidence_score: number | null;
  outcome: string | null;
  pnl: number | null;
  created_at: string;
  taken_at: string | null;
  milestone: string | null;
}

const ITEMS_PER_PAGE = 20;

const SignalHistoryPage = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSignals();
    }
  }, [user, currentPage, outcomeFilter, symbolFilter, dateFrom, dateTo, typeFilter]);

  const fetchSignals = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // First, get user's taken signals from user_signal_actions
      let actionsQuery = supabase
        .from('user_signal_actions')
        .select('signal_id, taken_at, outcome, pnl', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('action_type', 'taken')
        .order('taken_at', { ascending: false });

      // Apply outcome filter on actions table
      if (outcomeFilter !== 'all') {
        actionsQuery = actionsQuery.eq('outcome', outcomeFilter);
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      actionsQuery = actionsQuery.range(from, to);

      const { data: actionsData, error: actionsError, count } = await actionsQuery;

      if (actionsError) throw actionsError;

      if (!actionsData || actionsData.length === 0) {
        setSignals([]);
        setTotalCount(count || 0);
        setIsLoading(false);
        return;
      }

      // Get the signal IDs
      const signalIds = actionsData.map(a => a.signal_id);

      // Fetch the institutional signals
      let signalsQuery = supabase
        .from('institutional_signals')
        .select('id, symbol, direction, entry_price, stop_loss, take_profit_1, confidence, created_at')
        .in('id', signalIds);

      // Apply symbol filter
      if (symbolFilter) {
        signalsQuery = signalsQuery.ilike('symbol', `%${symbolFilter}%`);
      }

      // Apply type filter
      if (typeFilter !== 'all') {
        signalsQuery = signalsQuery.eq('direction', typeFilter);
      }

      // Apply date filters
      if (dateFrom) {
        signalsQuery = signalsQuery.gte('created_at', `${dateFrom}T00:00:00`);
      }

      if (dateTo) {
        signalsQuery = signalsQuery.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: signalsData, error: signalsError } = await signalsQuery;

      if (signalsError) throw signalsError;

      // Merge the data
      const mergedSignals: Signal[] = (actionsData || []).map(action => {
        const signal = (signalsData || []).find((s: any) => s.id === action.signal_id);
        if (!signal) return null;
        
        return {
          id: signal.id,
          symbol: signal.symbol,
          signal_type: signal.direction as 'BUY' | 'SELL',
          entry_price: signal.entry_price,
          stop_loss: signal.stop_loss,
          take_profit: signal.take_profit_1,
          confidence_score: signal.confidence,
          outcome: action.outcome,
          pnl: action.pnl,
          created_at: signal.created_at,
          taken_at: action.taken_at,
          milestone: null,
        };
      }).filter(Boolean) as Signal[];

      setSignals(mergedSignals);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setOutcomeFilter('all');
    setSymbolFilter('');
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Stats
  const stats = useMemo(() => {
    const wins = signals.filter(s => s.outcome === 'target_hit').length;
    const losses = signals.filter(s => s.outcome === 'stop_loss_hit').length;
    const totalPnl = signals.reduce((sum, s) => sum + (s.pnl || 0), 0);
    const winRate = signals.length > 0 ? (wins / signals.length) * 100 : 0;

    return { wins, losses, totalPnl, winRate, total: signals.length };
  }, [signals]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (signals.length === 0) {
      toast.error('No signals to export');
      return;
    }

    const headers = ['Date', 'Symbol', 'Type', 'Entry', 'SL', 'TP', 'Confidence', 'Outcome', 'P&L'];
    const rows = signals.map(signal => [
      new Date(signal.created_at).toLocaleDateString(),
      signal.symbol,
      signal.signal_type,
      signal.entry_price.toString(),
      signal.stop_loss?.toString() || '-',
      signal.take_profit?.toString() || '-',
      `${signal.confidence_score || 0}%`,
      getOutcomeLabel(signal.outcome),
      `$${(signal.pnl || 0).toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `signal-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('CSV exported successfully');
  }, [signals]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    if (signals.length === 0) {
      toast.error('No signals to export');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246);
    doc.text('Signal History Report', 14, 22);
    
    // Stats summary
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Signals: ${stats.total} | Win Rate: ${stats.winRate.toFixed(1)}% | P&L: $${stats.totalPnl.toFixed(2)}`, 14, 36);

    // Table
    const tableData = signals.map(signal => [
      new Date(signal.created_at).toLocaleDateString(),
      signal.symbol,
      signal.signal_type,
      signal.entry_price.toString(),
      signal.stop_loss?.toString() || '-',
      signal.take_profit?.toString() || '-',
      `${signal.confidence_score || 0}%`,
      getOutcomeLabel(signal.outcome),
      `$${(signal.pnl || 0).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Date', 'Symbol', 'Type', 'Entry', 'SL', 'TP', 'Conf.', 'Outcome', 'P&L']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    });

    doc.save(`signal-history-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  }, [signals, stats]);

  const getOutcomeStyle = (outcome: string | null) => {
    switch (outcome) {
      case 'target_hit':
        return 'bg-success/20 text-success border-success/30';
      case 'stop_loss_hit':
        return 'bg-risk/20 text-risk border-risk/30';
      case 'cancelled':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getOutcomeLabel = (outcome: string | null) => {
    switch (outcome) {
      case 'target_hit':
        return 'Won';
      case 'stop_loss_hit':
        return 'Lost';
      case 'cancelled':
        return 'BE';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      <main className="relative pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-white/40 hover:text-white/60"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                  <History className="w-3.5 h-3.5" />
                  Trading History
                </span>

                <h1 className="text-4xl sm:text-5xl tracking-tight leading-[1.15] mb-3">
                  <span className="font-light text-white/50">Signal</span>{' '}
                  <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">History</span>
                </h1>
                <p className="text-base text-white/40 font-light">
                  View and analyze your past trading signals.
                </p>
              </div>

              {/* Export Buttons */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-purple-500/30">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center hover:border-purple-500/20 transition-all duration-300">
              <p className="text-2xl font-semibold text-white">{stats.total}</p>
              <p className="text-xs text-white/30 font-light">Total Signals</p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center hover:border-green-500/20 transition-all duration-300">
              <p className="text-2xl font-semibold text-green-400">{stats.wins}</p>
              <p className="text-xs text-white/30 font-light">Wins</p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center hover:border-red-500/20 transition-all duration-300">
              <p className="text-2xl font-semibold text-red-400">{stats.losses}</p>
              <p className="text-xs text-white/30 font-light">Losses</p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center hover:border-purple-500/20 transition-all duration-300">
              <p className="text-2xl font-semibold text-purple-400">{stats.winRate.toFixed(1)}%</p>
              <p className="text-xs text-white/30 font-light">Win Rate</p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center hover:border-purple-500/20 transition-all duration-300">
              <p className={`text-2xl font-semibold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
              </p>
              <p className="text-xs text-white/30 font-light">Total P&L</p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-purple-400" />
              <h3 className="font-medium text-white">Filters</h3>
              {(outcomeFilter !== 'all' || symbolFilter || dateFrom || dateTo || typeFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-white/40 hover:text-white/60">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Symbol</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    placeholder="e.g. EURUSD"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="target_hit">Won</SelectItem>
                    <SelectItem value="stop_loss_hit">Lost</SelectItem>
                    <SelectItem value="cancelled">Breakeven</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden"
          >
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <p className="text-sm text-white/40 font-light">
                Showing {signals.length} of {totalCount} signals
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/40 font-light">No signals found</p>
                <p className="text-sm text-white/30 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/[0.02]">
                    <tr>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Symbol</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Entry</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">SL</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">TP</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Confidence</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Outcome</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((signal, index) => (
                      <motion.tr
                        key={signal.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 text-sm">
                          {new Date(signal.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-bold">{signal.symbol}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            signal.signal_type === 'BUY' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-risk/20 text-risk'
                          }`}>
                            {signal.signal_type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {signal.signal_type}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-sm">{signal.entry_price}</td>
                        <td className="p-4 font-mono text-sm text-risk">{signal.stop_loss || '-'}</td>
                        <td className="p-4 font-mono text-sm text-success">{signal.take_profit || '-'}</td>
                        <td className="p-4">
                          <span className={`text-sm ${
                            (signal.confidence_score || 0) >= 80 ? 'text-success' :
                            (signal.confidence_score || 0) >= 60 ? 'text-blue-400' :
                            'text-muted-foreground'
                          }`}>
                            {signal.confidence_score || 0}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getOutcomeStyle(signal.outcome)}`}>
                            {getOutcomeLabel(signal.outcome)}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${
                          (signal.pnl || 0) >= 0 ? 'text-success' : 'text-risk'
                        }`}>
                          {(signal.pnl || 0) >= 0 ? '+' : ''}${(signal.pnl || 0).toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/[0.05] flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignalHistoryPage;
