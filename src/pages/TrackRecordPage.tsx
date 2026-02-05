import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Clock, BarChart3, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrackRecord } from '@/hooks/useTrackRecord';
import { format } from 'date-fns';

const TrackRecordPage = () => {
  const { stats, monthlyPerformance, recentSignals, isLoading, error } = useTrackRecord();

  const hasEnoughData = stats.totalSignals >= 10;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="outline" className="mb-4 text-primary border-primary">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified Performance
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Track Record
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real, verified performance data from our trading signals. No fake numbers, no inflated stats – 
              just honest results updated in real-time.
            </p>
            {stats.startDate && (
              <p className="text-sm text-muted-foreground mt-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data since {format(new Date(stats.startDate), 'MMMM yyyy')}
              </p>
            )}
          </motion.div>

          {/* Low Data Warning */}
          {!isLoading && !hasEnoughData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="p-6 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Building Our Track Record</h3>
                    <p className="text-muted-foreground text-sm">
                      We currently have {stats.totalSignals} signals. We need at least 10 signals to provide 
                      statistically meaningful performance data. Check back soon as we build our verified track record!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Total Signals</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalSignals}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className={`glass-card ${hasEnoughData ? '' : 'opacity-60'}`}>
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                      <p className="text-3xl font-bold text-foreground">
                        {hasEnoughData ? `${stats.winRate.toFixed(1)}%` : '--'}
                      </p>
                      {!hasEnoughData && (
                        <Badge variant="outline" className="mt-1 text-xs">Building data</Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Winning Trades</p>
                      <p className="text-3xl font-bold text-green-500">{stats.winningSignals}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Losing Trades</p>
                      <p className="text-3xl font-bold text-red-500">{stats.losingSignals}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>

          {/* Monthly Performance */}
          {monthlyPerformance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {monthlyPerformance.slice(0, 6).map((month, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-muted/50 text-center"
                      >
                        <p className="text-sm font-medium text-muted-foreground">
                          {month.month} {month.year}
                        </p>
                        <p className="text-xl font-bold text-foreground mt-1">
                          {month.wins + month.losses > 0 ? `${month.winRate.toFixed(0)}%` : '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {month.wins}W / {month.losses}L
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recent Signals Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Recent Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentSignals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No signals yet. Check back soon!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pair</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Entry</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SL</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">TP</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSignals.map((signal) => (
                          <tr key={signal.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {format(new Date(signal.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-foreground">{signal.symbol}</span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={signal.signal_type === 'BUY' ? 'default' : 'destructive'}>
                                {signal.signal_type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-foreground">{signal.entry_price}</td>
                            <td className="py-3 px-4 text-sm text-red-500">{signal.stop_loss}</td>
                            <td className="py-3 px-4 text-sm text-green-500">{signal.take_profit}</td>
                            <td className="py-3 px-4">
                              {signal.outcome === 'target_hit' ? (
                                <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Win
                                </Badge>
                              ) : signal.outcome === 'stop_loss' ? (
                                <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Loss
                                </Badge>
                              ) : (
                                <Badge variant="outline">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              <strong>Disclaimer:</strong> Past performance is not indicative of future results. 
              Trading forex and CFDs involves significant risk of loss. This track record shows 
              historical signal performance and should not be considered financial advice.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackRecordPage;
