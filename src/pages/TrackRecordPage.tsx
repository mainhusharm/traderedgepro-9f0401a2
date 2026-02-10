import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Clock, BarChart3, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrackRecord } from '@/hooks/useTrackRecord';
import { format } from 'date-fns';

const TrackRecordPage = () => {
  const { stats, monthlyPerformance, recentSignals, isLoading, error } = useTrackRecord();

  const hasEnoughData = stats.totalSignals >= 10;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-300/80 mb-6">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified Performance
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Track</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Record</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light">
                Real, verified performance data from our trading signals.
                No fake numbers, no inflated stats –{' '}
                <span className="text-white/60 font-normal">just honest results</span>.
              </p>

              {stats.startDate && (
                <p className="text-sm text-white/30 flex items-center gap-2 mt-4">
                  <Calendar className="w-4 h-4" />
                  Data since {format(new Date(stats.startDate), 'MMMM yyyy')}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Low Data Warning */}
      {!isLoading && !hasEnoughData && (
        <section className="relative px-6 mb-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-300 mb-1">Building Our Track Record</h3>
                <p className="text-sm text-white/40 font-light">
                  We currently have {stats.totalSignals} signals. We need at least 10 signals to provide
                  statistically meaningful performance data.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <section className="relative py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-16" />
                </div>
              ))
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-semibold text-white">{stats.totalSignals}</p>
                  <p className="text-sm text-white/30 font-light">Total Signals</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300 ${!hasEnoughData ? 'opacity-60' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-semibold text-white">
                    {hasEnoughData ? `${stats.winRate.toFixed(1)}%` : '--'}
                  </p>
                  <p className="text-sm text-white/30 font-light">Win Rate</p>
                  {!hasEnoughData && (
                    <Badge variant="outline" className="mt-2 text-xs border-white/10">Building data</Badge>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-green-500/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-semibold text-green-400">{stats.winningSignals}</p>
                  <p className="text-sm text-white/30 font-light">Winning Trades</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-red-500/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-3xl font-semibold text-red-400">{stats.losingSignals}</p>
                  <p className="text-sm text-white/30 font-light">Losing Trades</p>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Monthly Performance */}
      {monthlyPerformance.length > 0 && (
        <section className="relative py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                  Monthly
                </span>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {monthlyPerformance.slice(0, 6).map((month, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center"
                  >
                    <p className="text-xs font-light text-white/30 mb-1">
                      {month.month} {month.year}
                    </p>
                    <p className={`text-2xl font-semibold ${month.wins + month.losses > 0 && month.winRate >= 50 ? 'text-green-400' : 'text-white/40'}`}>
                      {month.wins + month.losses > 0 ? `${month.winRate.toFixed(0)}%` : '--'}
                    </p>
                    <p className="text-xs text-white/20 font-light mt-1">
                      {month.wins}W / {month.losses}L
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Signals Table */}
      <section className="relative py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Recent Signals
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden"
            >
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentSignals.length === 0 ? (
                <div className="text-center py-16">
                  <Target className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/30 font-light">No signals yet. Check back soon!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">Date</th>
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">Pair</th>
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">Type</th>
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">Entry</th>
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">SL</th>
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">TP</th>
                        <th className="text-left py-4 px-5 text-xs font-medium text-white/30 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSignals.map((signal) => (
                        <tr key={signal.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-5 text-sm text-white/40 font-light">
                            {format(new Date(signal.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="py-4 px-5 font-medium text-sm">{signal.symbol}</td>
                          <td className="py-4 px-5">
                            <Badge className={signal.signal_type === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {signal.signal_type}
                            </Badge>
                          </td>
                          <td className="py-4 px-5 text-sm font-mono text-white/60">{signal.entry_price}</td>
                          <td className="py-4 px-5 text-sm font-mono text-red-400">{signal.stop_loss}</td>
                          <td className="py-4 px-5 text-sm font-mono text-green-400">{signal.take_profit}</td>
                          <td className="py-4 px-5">
                            {signal.outcome === 'target_hit' ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Win
                              </Badge>
                            ) : signal.outcome === 'stop_loss' ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                Loss
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-white/10 text-white/40">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="relative py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-white/20 max-w-2xl mx-auto font-light">
            <strong className="text-white/30">Disclaimer:</strong> Past performance is not indicative of future results.
            Trading forex and CFDs involves significant risk of loss. This track record shows
            historical signal performance and should not be considered financial advice.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TrackRecordPage;
