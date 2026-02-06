import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Save,
  X,
  Edit2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAdminApi } from '@/hooks/useAdminApi';

interface VIPSignal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  outcome: string;
  is_vip: boolean;
  reviewed_by: string[] | string | null;
  vip_notes: string | null;
  pnl: number | null;
  risk_amount: number | null;
  lot_size: number | null;
  created_at: string;
}

interface VIPSignalEditModalProps {
  signal: VIPSignal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const VIPSignalEditModal = ({ signal, isOpen, onClose, onUpdate }: VIPSignalEditModalProps) => {
  const { callAdminApi, isLoading } = useAdminApi();
  
  const [editData, setEditData] = useState({
    stop_loss: signal?.stop_loss?.toString() || '',
    take_profit: signal?.take_profit?.toString() || '',
    risk_amount: signal?.risk_amount?.toString() || '',
    lot_size: signal?.lot_size?.toString() || '',
    pnl: signal?.pnl?.toString() || '',
    outcome: signal?.outcome || 'pending',
    vip_notes: signal?.vip_notes || '',
  });

  // Reset form when signal changes
  useState(() => {
    if (signal) {
      setEditData({
        stop_loss: signal.stop_loss?.toString() || '',
        take_profit: signal.take_profit?.toString() || '',
        risk_amount: signal.risk_amount?.toString() || '',
        lot_size: signal.lot_size?.toString() || '',
        pnl: signal.pnl?.toString() || '',
        outcome: signal.outcome || 'pending',
        vip_notes: signal.vip_notes || '',
      });
    }
  });

  const handleSave = async () => {
    if (!signal) return;
    
    try {
      const updates: Record<string, any> = {
        outcome: editData.outcome,
        vip_notes: editData.vip_notes,
      };
      
      if (editData.stop_loss) updates.stop_loss = parseFloat(editData.stop_loss);
      if (editData.take_profit) updates.take_profit = parseFloat(editData.take_profit);
      if (editData.risk_amount) updates.risk_amount = parseFloat(editData.risk_amount);
      if (editData.lot_size) updates.lot_size = parseFloat(editData.lot_size);
      if (editData.pnl) updates.pnl = parseFloat(editData.pnl);
      
      await callAdminApi('update_signal', { 
        signalId: signal.id, 
        updates 
      });
      
      toast.success('VIP Signal updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update signal');
    }
  };

  if (!signal) return null;

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'target_hit': return 'text-success bg-success/10';
      case 'stop_loss_hit': return 'text-risk bg-risk/10';
      case 'breakeven': return 'text-muted-foreground bg-muted/10';
      case 'cancelled': return 'text-warning bg-warning/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Edit VIP Signal - {signal.symbol}
            <Badge className="bg-gradient-to-r from-amber-500 to-purple-500 text-white ml-2">
              VIP
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Signal Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className={`p-3 rounded-lg ${signal.signal_type === 'BUY' ? 'bg-success/10' : 'bg-risk/10'}`}>
              {signal.signal_type === 'BUY' ? (
                <TrendingUp className="w-6 h-6 text-success" />
              ) : (
                <TrendingDown className="w-6 h-6 text-risk" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{signal.symbol}</h3>
              <p className="text-sm text-muted-foreground">
                Entry: {signal.entry_price} • Created: {new Date(signal.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Outcome Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Signal Outcome</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'target_hit', label: 'Won', icon: TrendingUp, color: 'text-success border-success' },
                { value: 'stop_loss_hit', label: 'Lost', icon: TrendingDown, color: 'text-risk border-risk' },
                { value: 'breakeven', label: 'Breakeven', icon: Minus, color: 'text-muted-foreground border-muted-foreground' },
                { value: 'cancelled', label: 'Cancelled', icon: X, color: 'text-warning border-warning' },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={editData.outcome === option.value ? 'default' : 'outline'}
                  className={`flex-col h-auto py-3 ${editData.outcome === option.value ? getOutcomeColor(option.value) : ''}`}
                  onClick={() => setEditData({ ...editData, outcome: option.value })}
                >
                  <option.icon className="w-5 h-5 mb-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Risk Management */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-purple-500/5">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Management (Editable After Trade)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stop Loss</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08300"
                  value={editData.stop_loss}
                  onChange={(e) => setEditData({ ...editData, stop_loss: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Take Profit</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08900"
                  value={editData.take_profit}
                  onChange={(e) => setEditData({ ...editData, take_profit: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Lot Size</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.10"
                  value={editData.lot_size}
                  onChange={(e) => setEditData({ ...editData, lot_size: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Risk Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={editData.risk_amount}
                  onChange={(e) => setEditData({ ...editData, risk_amount: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* P&L */}
          <div className="space-y-2">
            <Label>Final P&L ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter final profit/loss"
              value={editData.pnl}
              onChange={(e) => setEditData({ ...editData, pnl: e.target.value })}
              className={`text-lg font-semibold ${
                parseFloat(editData.pnl) > 0 
                  ? 'text-success' 
                  : parseFloat(editData.pnl) < 0 
                    ? 'text-risk' 
                    : ''
              }`}
            />
          </div>

          {/* VIP Notes */}
          <div className="space-y-2">
            <Label>VIP Notes / Post-Trade Analysis</Label>
            <Textarea
              placeholder="Add post-trade analysis, lessons learned, or notes for VIP members..."
              value={editData.vip_notes}
              onChange={(e) => setEditData({ ...editData, vip_notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Reviewed By */}
          {signal.reviewed_by && (Array.isArray(signal.reviewed_by) ? signal.reviewed_by.length > 0 : signal.reviewed_by) && (
            <div className="p-3 rounded-lg bg-white/5">
              <Label className="text-sm text-muted-foreground">Reviewed By</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(Array.isArray(signal.reviewed_by) ? signal.reviewed_by : [signal.reviewed_by]).map((reviewer) => (
                  <Badge key={reviewer} variant="outline">
                    {reviewer}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-500 to-purple-500 hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VIPSignalEditModal;
