import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Check, X, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Signal {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number | null;
  confluence_score: number;
  reasoning: string;
  created_at: string;
  agent_reviewed: boolean;
  agent_approved: boolean;
}

const ManagerSignalsTab = () => {
  const { callManagerApi } = useManagerApi();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    const response = await callManagerApi('get_pending_signals');
    if (response?.success) {
      setSignals(response.signals || []);
    }
    setIsLoading(false);
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedSignal) return;
    
    setIsProcessing(true);
    const response = await callManagerApi('approve_signal', {
      signalId: selectedSignal.id,
      approved,
      notes: reviewNotes
    });

    if (response?.success) {
      toast.success(`Signal ${approved ? 'approved' : 'rejected'}`);
      setSelectedSignal(null);
      setReviewNotes('');
      fetchSignals();
    } else {
      toast.error('Failed to process signal');
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pending Signal Reviews</h2>
          <p className="text-sm text-muted-foreground">Review and approve signals before they go to users</p>
        </div>
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          {signals.length} Pending
        </Badge>
      </div>

      {/* Signals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 border-white/5 hover:border-purple-500/20 transition-colors">
              <CardContent className="p-4 space-y-4">
                {/* Signal Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      signal.direction === 'BUY' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {signal.direction === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{signal.symbol}</span>
                        <Badge className={signal.direction === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {signal.direction}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(signal.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">{signal.confluence_score}/10</p>
                    <p className="text-xs text-muted-foreground">Confluence</p>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="font-medium">{signal.entry_price}</p>
                  </div>
                  <div className="p-2 rounded bg-red-500/5">
                    <p className="text-xs text-red-400">SL</p>
                    <p className="font-medium text-red-400">{signal.stop_loss}</p>
                  </div>
                  <div className="p-2 rounded bg-green-500/5">
                    <p className="text-xs text-green-400">TP1</p>
                    <p className="font-medium text-green-400">{signal.take_profit_1}</p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-500"
                  onClick={() => setSelectedSignal(signal)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review Signal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {signals.length === 0 && (
        <Card className="bg-card/50 border-white/5">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending signals to review</p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Review Signal
            </DialogTitle>
          </DialogHeader>

          {selectedSignal && (
            <div className="space-y-4">
              {/* Signal Details */}
              <div className="p-4 rounded-lg bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{selectedSignal.symbol}</span>
                  <Badge className={selectedSignal.direction === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {selectedSignal.direction}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="ml-2 font-medium">{selectedSignal.entry_price}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confluence:</span>
                    <span className="ml-2 font-medium text-purple-400">{selectedSignal.confluence_score}/10</span>
                  </div>
                  <div>
                    <span className="text-red-400">Stop Loss:</span>
                    <span className="ml-2 font-medium">{selectedSignal.stop_loss}</span>
                  </div>
                  <div>
                    <span className="text-green-400">Take Profit 1:</span>
                    <span className="ml-2 font-medium">{selectedSignal.take_profit_1}</span>
                  </div>
                </div>

                {selectedSignal.reasoning && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Analysis:</p>
                    <p className="text-sm">{selectedSignal.reasoning}</p>
                  </div>
                )}
              </div>

              {/* Review Notes */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Review Notes (optional)</p>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this signal..."
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => handleReview(false)}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-500"
                  onClick={() => handleReview(true)}
                  disabled={isProcessing}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerSignalsTab;
