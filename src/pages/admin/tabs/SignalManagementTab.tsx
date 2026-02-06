import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Send, 
  TrendingUp, 
  TrendingDown,
  Trash2,
  RefreshCw,
  Target,
  AlertTriangle,
  Crown,
  Star,
  Users,
  Minus,
  Edit2,
  MessageCircle,
  Image,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useAdminApi } from '@/hooks/useAdminApi';
import { toast } from 'sonner';
import VIPSignalEditModal from '@/components/admin/VIPSignalEditModal';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import SignalImageUpload from '@/components/signals/SignalImageUpload';

const CURRENCY_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 
  'NZDUSD', 'USDCHF', 'EURJPY', 'GBPJPY', 'XAUUSD',
  'EURGBP', 'EURAUD', 'AUDJPY', 'CADJPY', 'CHFJPY',
  'NZDJPY', 'GBPAUD', 'GBPCAD', 'GBPNZD', 'AUDNZD',
  'AUDCAD', 'EURCAD', 'EURNZD', 'CADCHF', 'AUDCHF'
];

const CRYPTO_PAIRS = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'BNBUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD'];

const INDICES = ['US30', 'US100', 'US500', 'DE40', 'UK100', 'JP225'];

const COMMODITIES = ['XAGUSD', 'WTIUSD', 'BRNUSD', 'NATGAS'];

const REVIEWERS = ['Expert A', 'Expert B', 'Expert C', 'Expert D'];

const TRADE_TYPES = [
  { value: 'scalp', label: 'Scalp Trade', description: 'Quick 5-30 min trades' },
  { value: 'intraday', label: 'Intraday', description: 'Same day close' },
  { value: 'swing', label: 'Swing Trade', description: '2-5 days hold' },
  { value: 'position', label: 'Position', description: 'Long term hold' },
];

const SignalManagementTab = () => {
  const [signals, setSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [useCustomSymbol, setUseCustomSymbol] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customMessageSignal, setCustomMessageSignal] = useState<any>(null);
  const [customMessageTitle, setCustomMessageTitle] = useState('');
  const [customMessageContent, setCustomMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [newSignal, setNewSignal] = useState({
    symbol: 'EURUSD',
    direction: 'BUY',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    takeProfit2: '',
    takeProfit3: '',
    confidence: 75,
    analysis: '',
    milestone: 'M1',
    isVip: false,
    reviewedBy: [] as string[],
    vipNotes: '',
    tradeType: 'intraday',
    imageUrl: null as string | null,
  });

  const { callAdminApi, isLoading: apiLoading } = useAdminApi();

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const result = await callAdminApi('get_signals', { limit: 20 });
      setSignals(result.signals || []);
    } catch (error) {
      toast.error('Failed to fetch signals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSignal = async () => {
    const symbolToUse = useCustomSymbol ? customSymbol.toUpperCase().trim() : newSignal.symbol;
    
    if (!symbolToUse) {
      toast.error('Symbol is required');
      return;
    }
    
    if (!newSignal.entryPrice) {
      toast.error('Entry price is required');
      return;
    }

    if (!newSignal.stopLoss) {
      toast.error('Stop Loss is required for trade management');
      return;
    }

    if (!newSignal.takeProfit) {
      toast.error('Take Profit 1 is required for trade management');
      return;
    }

    if (newSignal.isVip && newSignal.reviewedBy.length < 2) {
      toast.error('VIP signals require at least 2 expert reviews');
      return;
    }

    setIsCreating(true);
    try {
      await callAdminApi('create_signal', {
        ...newSignal,
        symbol: symbolToUse,
        is_vip: newSignal.isVip,
        reviewed_by: newSignal.reviewedBy,
        vip_notes: newSignal.vipNotes,
        trade_type: newSignal.tradeType,
        image_url: newSignal.imageUrl,
        take_profit_2: newSignal.takeProfit2 || null,
        take_profit_3: newSignal.takeProfit3 || null,
        // Enable automatic trade management
        enable_trade_management: true,
      });
      toast.success(newSignal.isVip ? 'VIP Signal created with auto-management!' : 'Signal created with auto-management!');
      fetchSignals();
      fetchSignals();
      setNewSignal({
        symbol: 'EURUSD',
        direction: 'BUY',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        takeProfit2: '',
        takeProfit3: '',
        confidence: 75,
        analysis: '',
        milestone: 'M1',
        isVip: false,
        reviewedBy: [],
        vipNotes: '',
        tradeType: 'intraday',
        imageUrl: null,
      });
      setUseCustomSymbol(false);
      setCustomSymbol('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create signal');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    try {
      await callAdminApi('delete_signal', { signalId });
      toast.success('Signal deleted');
      fetchSignals();
    } catch (error) {
      toast.error('Failed to delete signal');
    }
  };

  const handleUpdateOutcome = async (signalId: string, outcome: string) => {
    try {
      await callAdminApi('update_signal', { 
        signalId, 
        updates: { outcome } 
      });
      toast.success('Signal outcome updated');
      fetchSignals();
    } catch (error) {
      toast.error('Failed to update signal');
    }
  };

  const handleSendToDiscord = async (signal: any) => {
    try {
      const { data, error } = await callEdgeFunction('send-discord-signal', {
        symbol: signal.symbol,
        signal_type: signal.signal_type,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        confidence_score: signal.confidence_score,
        analysis: signal.ai_reasoning,
        is_vip: signal.is_vip,
        trade_type: signal.trade_type,
        reviewed_by: signal.reviewed_by,
        vip_notes: signal.vip_notes,
      });

      if (error) throw error;
      toast.success('Signal sent to Discord!');
    } catch (error: any) {
      console.error('Failed to send to Discord:', error);
      toast.error(error.message || 'Failed to send to Discord');
    }
  };

  const handleSendCustomMessage = async () => {
    if (!customMessageSignal || !customMessageTitle.trim() || !customMessageContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSendingMessage(true);
    try {
      await callAdminApi('add_signal_message', {
        signalId: customMessageSignal.id,
        title: customMessageTitle.trim(),
        content: customMessageContent.trim(),
        messageType: 'admin_update',
      });
      toast.success('Message sent to users!');
      setCustomMessageSignal(null);
      setCustomMessageTitle('');
      setCustomMessageContent('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Signal Form */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Create New Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Symbol */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Symbol</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Custom</Label>
                  <Switch
                    checked={useCustomSymbol}
                    onCheckedChange={setUseCustomSymbol}
                  />
                </div>
              </div>
              {useCustomSymbol ? (
                <Input
                  placeholder="Enter custom symbol (e.g., GBPNZD)"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              ) : (
                <Select
                  value={newSignal.symbol}
                  onValueChange={(value) => setNewSignal({ ...newSignal, symbol: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="header-forex" disabled className="font-semibold text-primary">— Forex —</SelectItem>
                    {CURRENCY_PAIRS.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                    <SelectItem value="header-crypto" disabled className="font-semibold text-primary">— Crypto —</SelectItem>
                    {CRYPTO_PAIRS.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                    <SelectItem value="header-indices" disabled className="font-semibold text-primary">— Indices —</SelectItem>
                    {INDICES.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                    <SelectItem value="header-commodities" disabled className="font-semibold text-primary">— Commodities —</SelectItem>
                    {COMMODITIES.map(pair => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label>Direction</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newSignal.direction === 'BUY' ? 'default' : 'outline'}
                  className={newSignal.direction === 'BUY' ? 'bg-success hover:bg-success/90' : ''}
                  onClick={() => setNewSignal({ ...newSignal, direction: 'BUY' })}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  BUY
                </Button>
                <Button
                  type="button"
                  variant={newSignal.direction === 'SELL' ? 'default' : 'outline'}
                  className={newSignal.direction === 'SELL' ? 'bg-risk hover:bg-risk/90' : ''}
                  onClick={() => setNewSignal({ ...newSignal, direction: 'SELL' })}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  SELL
                </Button>
              </div>
            </div>

            {/* Milestone */}
            <div className="space-y-2">
              <Label>Milestone</Label>
              <Select
                value={newSignal.milestone}
                onValueChange={(value) => setNewSignal({ ...newSignal, milestone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M1">M1 - Entry</SelectItem>
                  <SelectItem value="M2">M2 - Confirmation</SelectItem>
                  <SelectItem value="M3">M3 - Target</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trade Type */}
            <div className="space-y-2">
              <Label>Trade Type</Label>
              <Select
                value={newSignal.tradeType}
                onValueChange={(value) => setNewSignal({ ...newSignal, tradeType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entry Price */}
            <div className="space-y-2">
              <Label>Entry Price *</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.08500"
                value={newSignal.entryPrice}
                onChange={(e) => setNewSignal({ ...newSignal, entryPrice: e.target.value })}
              />
            </div>

            {/* Stop Loss */}
            <div className="space-y-2">
              <Label>Stop Loss *</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.08300"
                value={newSignal.stopLoss}
                onChange={(e) => setNewSignal({ ...newSignal, stopLoss: e.target.value })}
              />
            </div>

            {/* Take Profit 1 */}
            <div className="space-y-2">
              <Label>Take Profit 1 * (33% close)</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.08900"
                value={newSignal.takeProfit}
                onChange={(e) => setNewSignal({ ...newSignal, takeProfit: e.target.value })}
              />
            </div>

            {/* Take Profit 2 */}
            <div className="space-y-2">
              <Label>Take Profit 2 (33% close)</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.09200"
                value={newSignal.takeProfit2}
                onChange={(e) => setNewSignal({ ...newSignal, takeProfit2: e.target.value })}
              />
            </div>

            {/* Take Profit 3 */}
            <div className="space-y-2">
              <Label>Take Profit 3 (Runner)</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="1.09500"
                value={newSignal.takeProfit3}
                onChange={(e) => setNewSignal({ ...newSignal, takeProfit3: e.target.value })}
              />
            </div>

            {/* Confidence */}
            <div className="space-y-2 md:col-span-2">
              <Label>Confidence: {newSignal.confidence}%</Label>
              <Slider
                value={[newSignal.confidence]}
                onValueChange={(value) => setNewSignal({ ...newSignal, confidence: value[0] })}
                min={50}
                max={100}
                step={5}
              />
            </div>

            {/* Analysis */}
            <div className="space-y-2 md:col-span-2">
              <Label>Analysis / Reasoning</Label>
              <Textarea
                placeholder="Detailed market analysis and reasoning for this signal..."
                value={newSignal.analysis}
                onChange={(e) => setNewSignal({ ...newSignal, analysis: e.target.value })}
                rows={3}
              />
            </div>

            {/* Chart Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Chart Screenshot
              </Label>
              <SignalImageUpload
                imageUrl={newSignal.imageUrl}
                onImageChange={(url) => setNewSignal({ ...newSignal, imageUrl: url })}
              />
            </div>

            {/* VIP Signal Toggle */}
            <div className="space-y-4 md:col-span-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <Label className="text-base font-semibold">VIP Signal</Label>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-500">Pro & Enterprise</Badge>
                </div>
                <Switch
                  checked={newSignal.isVip}
                  onCheckedChange={(checked) => setNewSignal({ ...newSignal, isVip: checked })}
                />
              </div>
              
              {newSignal.isVip && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Reviewed By (Select 2-4 Experts)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {REVIEWERS.map((reviewer) => (
                        <Button
                          key={reviewer}
                          type="button"
                          variant={newSignal.reviewedBy.includes(reviewer) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (newSignal.reviewedBy.includes(reviewer)) {
                              setNewSignal({
                                ...newSignal,
                                reviewedBy: newSignal.reviewedBy.filter(r => r !== reviewer)
                              });
                            } else if (newSignal.reviewedBy.length < 4) {
                              setNewSignal({
                                ...newSignal,
                                reviewedBy: [...newSignal.reviewedBy, reviewer]
                              });
                            }
                          }}
                        >
                          {reviewer}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {newSignal.reviewedBy.length}/4 experts selected (minimum 2 required)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>VIP Notes (Consensus & Extra Analysis)</Label>
                    <Textarea
                      placeholder="Additional notes from expert panel review..."
                      value={newSignal.vipNotes}
                      onChange={(e) => setNewSignal({ ...newSignal, vipNotes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleCreateSignal} 
              disabled={isCreating || !newSignal.entryPrice || (newSignal.isVip && newSignal.reviewedBy.length < 2)}
              className={newSignal.isVip ? "bg-gradient-to-r from-amber-500 to-purple-500 hover:opacity-90" : "bg-primary hover:bg-primary/90"}
            >
              {newSignal.isVip ? <Crown className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isCreating ? 'Broadcasting...' : newSignal.isVip ? 'Broadcast VIP Signal' : 'Broadcast Signal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Signals */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>Recent Signals</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">VIP Only</Label>
              <Switch
                checked={showVipOnly}
                onCheckedChange={setShowVipOnly}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchSignals}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No signals created yet
            </div>
          ) : (
            <div className="space-y-4">
              {signals
                .filter(s => !showVipOnly || s.is_vip)
                .map((signal) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/[0.08]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${signal.signal_type === 'BUY' ? 'bg-success/10' : 'bg-risk/10'}`}>
                      {signal.signal_type === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-risk" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{signal.symbol}</span>
                        <Badge variant={signal.signal_type === 'BUY' ? 'default' : 'destructive'}>
                          {signal.signal_type}
                        </Badge>
                        <Badge variant="outline">{signal.milestone}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Entry: {signal.entry_price} | SL: {signal.stop_loss || 'N/A'} | TP: {signal.take_profit || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm">{signal.confidence_score}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(signal.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {signal.is_vip && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-purple-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    
                    <Select
                      value={signal.outcome}
                      onValueChange={(value) => handleUpdateOutcome(signal.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="target_hit">
                          <span className="flex items-center gap-2 text-success">
                            <TrendingUp className="w-3 h-3" /> Target Hit
                          </span>
                        </SelectItem>
                        <SelectItem value="stop_loss_hit">
                          <span className="flex items-center gap-2 text-risk">
                            <TrendingDown className="w-3 h-3" /> SL Hit
                          </span>
                        </SelectItem>
                        <SelectItem value="breakeven">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Minus className="w-3 h-3" /> Breakeven
                          </span>
                        </SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/10"
                      onClick={() => handleSendToDiscord(signal)}
                      title="Send to Discord"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-400 hover:bg-purple-500/10"
                      onClick={() => setCustomMessageSignal(signal)}
                      title="Send Custom Message to Users"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>

                    {signal.is_vip && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-500 hover:text-amber-500 hover:bg-amber-500/10"
                        onClick={() => {
                          setSelectedSignal(signal);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-risk hover:text-risk hover:bg-risk/10"
                      onClick={() => handleDeleteSignal(signal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VIPSignalEditModal
        signal={selectedSignal}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSignal(null);
        }}
        onUpdate={fetchSignals}
      />

      {/* Custom Message Dialog */}
      <Dialog open={!!customMessageSignal} onOpenChange={(open) => !open && setCustomMessageSignal(null)}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Send Custom Message to Users
            </DialogTitle>
          </DialogHeader>
          
          {customMessageSignal && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  customMessageSignal.signal_type === 'BUY' ? 'bg-success/20' : 'bg-risk/20'
                }`}>
                  {customMessageSignal.signal_type === 'BUY' ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-risk" />
                  )}
                </div>
                <div>
                  <span className="font-bold">{customMessageSignal.symbol}</span>
                  <Badge className={`ml-2 ${customMessageSignal.signal_type === 'BUY' ? 'bg-success/20 text-success' : 'bg-risk/20 text-risk'}`}>
                    {customMessageSignal.signal_type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message Title</Label>
                <Input
                  placeholder="e.g., Important Update, Market News, Take Partial Profits..."
                  value={customMessageTitle}
                  onChange={(e) => setCustomMessageTitle(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Message Content</Label>
                <Textarea
                  placeholder="Enter your message for users watching this signal..."
                  value={customMessageContent}
                  onChange={(e) => setCustomMessageContent(e.target.value)}
                  rows={4}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCustomMessageSignal(null);
                    setCustomMessageTitle('');
                    setCustomMessageContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-500"
                  onClick={handleSendCustomMessage}
                  disabled={isSendingMessage || !customMessageTitle.trim() || !customMessageContent.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSendingMessage ? 'Sending...' : 'Send to Users'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignalManagementTab;
