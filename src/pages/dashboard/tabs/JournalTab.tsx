import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign, Edit2, X, Loader2, Filter, BarChart3, Upload, Image, Sparkles, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import JournalAnalytics from '@/components/dashboard/JournalAnalytics';
import TradeCorrelationAnalysis from '@/components/dashboard/TradeCorrelationAnalysis';

interface JournalEntry {
  id: string;
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  pnl: number;
  pnl_percentage: number;
  status: 'open' | 'closed' | 'cancelled';
  entry_date: string;
  exit_date: string | null;
  setup_type: string | null;
  notes: string | null;
  emotions: string | null;
  tags: string[] | null;
  // New auto-generated fields
  session_taken: string | null;
  mistake_tags: string[] | null;
  is_auto_generated: boolean | null;
  auto_calculated_rr: number | null;
  screenshot_url: string | null;
}

const SETUP_TYPES = ['Breakout', 'Pullback', 'Reversal', 'Range', 'Trend Following', 'News', 'Other'];
const EMOTIONS = ['Confident', 'Anxious', 'FOMO', 'Greedy', 'Fearful', 'Neutral', 'Revenge'];

const SESSION_COLORS: Record<string, { bg: string; text: string }> = {
  asian: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  london: { bg: 'bg-green-500/20', text: 'text-green-400' },
  new_york: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  overlap: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
};

const MISTAKE_COLORS: Record<string, { bg: string; text: string }> = {
  fomo: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  revenge: { bg: 'bg-red-500/20', text: 'text-red-400' },
  oversized: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  session_violation: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  news_trading: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  early_exit: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  moved_sl: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
};

const JournalTab = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'auto'>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  const [newEntry, setNewEntry] = useState({
    symbol: '',
    trade_type: 'BUY' as 'BUY' | 'SELL',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    lot_size: '0.01',
    pnl: '',
    status: 'open' as 'open' | 'closed',
    setup_type: '',
    notes: '',
    emotions: '',
    tags: '',
    screenshot_url: ''
  });

  // Check for prefill data from signals
  useEffect(() => {
    const prefillData = localStorage.getItem('prefillSignal');
    if (prefillData) {
      try {
        const signal = JSON.parse(prefillData);
        setNewEntry(prev => ({
          ...prev,
          symbol: signal.symbol || '',
          trade_type: signal.signal_type || 'BUY',
          entry_price: signal.entry_price?.toString() || '',
          stop_loss: signal.stop_loss?.toString() || '',
          take_profit: signal.take_profit?.toString() || '',
          notes: `Signal from ${new Date(signal.created_at).toLocaleDateString()} - Confidence: ${signal.confidence_score}%`,
        }));
        setIsAddingEntry(true);
        localStorage.removeItem('prefillSignal');
      } catch (e) {
        console.error('Error parsing prefill signal:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('trade_journal')
        .select('*')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries((data || []) as unknown as JournalEntry[]);
    } catch (error: any) {
      console.error('Error fetching journal:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingScreenshot(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('signal-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signal-images')
        .getPublicUrl(fileName);

      setNewEntry(prev => ({ ...prev, screenshot_url: publicUrl }));
      setScreenshotPreview(publicUrl);
      toast.success('Screenshot uploaded');
    } catch (error: any) {
      console.error('Error uploading screenshot:', error);
      toast.error('Failed to upload screenshot');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleAddEntry = async () => {
    if (!user || !newEntry.symbol || !newEntry.entry_price) {
      toast.error('Symbol and entry price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const entryData = {
        user_id: user.id,
        symbol: newEntry.symbol.toUpperCase(),
        trade_type: newEntry.trade_type,
        entry_price: parseFloat(newEntry.entry_price),
        exit_price: newEntry.exit_price ? parseFloat(newEntry.exit_price) : null,
        stop_loss: newEntry.stop_loss ? parseFloat(newEntry.stop_loss) : null,
        take_profit: newEntry.take_profit ? parseFloat(newEntry.take_profit) : null,
        lot_size: parseFloat(newEntry.lot_size) || 0.01,
        pnl: parseFloat(newEntry.pnl) || 0,
        pnl_percentage: 0,
        status: newEntry.status,
        setup_type: newEntry.setup_type || null,
        notes: newEntry.notes || null,
        emotions: newEntry.emotions || null,
        tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        screenshot_url: newEntry.screenshot_url || null,
        exit_date: newEntry.status === 'closed' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('trade_journal')
        .insert(entryData);

      if (error) throw error;

      toast.success('Trade entry added successfully');
      setIsAddingEntry(false);
      resetForm();
      fetchEntries();
    } catch (error: any) {
      console.error('Error adding entry:', error);
      toast.error('Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('trade_journal')
        .update({
          symbol: newEntry.symbol.toUpperCase(),
          trade_type: newEntry.trade_type,
          entry_price: parseFloat(newEntry.entry_price),
          exit_price: newEntry.exit_price ? parseFloat(newEntry.exit_price) : null,
          stop_loss: newEntry.stop_loss ? parseFloat(newEntry.stop_loss) : null,
          take_profit: newEntry.take_profit ? parseFloat(newEntry.take_profit) : null,
          lot_size: parseFloat(newEntry.lot_size) || 0.01,
          pnl: parseFloat(newEntry.pnl) || 0,
          status: newEntry.status,
          setup_type: newEntry.setup_type || null,
          notes: newEntry.notes || null,
          emotions: newEntry.emotions || null,
          tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
          screenshot_url: newEntry.screenshot_url || null,
          exit_date: newEntry.status === 'closed' ? new Date().toISOString() : null
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      toast.success('Trade entry updated');
      setEditingEntry(null);
      resetForm();
      fetchEntries();
    } catch (error: any) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trade_journal')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entry deleted');
      setEntries(entries.filter(e => e.id !== id));
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const resetForm = () => {
    setNewEntry({
      symbol: '', trade_type: 'BUY', entry_price: '', exit_price: '',
      stop_loss: '', take_profit: '', lot_size: '0.01', pnl: '',
      status: 'open', setup_type: '', notes: '', emotions: '', tags: '',
      screenshot_url: ''
    });
    setScreenshotPreview(null);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      symbol: entry.symbol,
      trade_type: entry.trade_type,
      entry_price: entry.entry_price.toString(),
      exit_price: entry.exit_price?.toString() || '',
      stop_loss: entry.stop_loss?.toString() || '',
      take_profit: entry.take_profit?.toString() || '',
      lot_size: entry.lot_size.toString(),
      pnl: entry.pnl.toString(),
      status: entry.status as 'open' | 'closed',
      setup_type: entry.setup_type || '',
      notes: entry.notes || '',
      emotions: entry.emotions || '',
      tags: entry.tags?.join(', ') || '',
      screenshot_url: entry.screenshot_url || ''
    });
    setScreenshotPreview(entry.screenshot_url || null);
    setIsAddingEntry(true);
  };

  const filteredEntries = entries.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'auto') return e.is_auto_generated === true;
    return e.status === filter;
  });

  const totalPnl = entries.reduce((sum, e) => sum + (e.pnl || 0), 0);
  const closedTrades = entries.filter(e => e.status === 'closed');
  const winningTrades = closedTrades.filter(e => e.pnl > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length * 100).toFixed(1) : '0';
  const autoGenCount = entries.filter(e => e.is_auto_generated).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Trade Journal</h2>
            <p className="text-sm text-muted-foreground">Document and analyze your trades</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            {['all', 'open', 'closed', 'auto'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors flex items-center gap-1 ${
                  filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'auto' && <Sparkles className="w-3 h-3" />}
                {f === 'auto' ? `Auto (${autoGenCount})` : f}
              </button>
            ))}
          </div>
          <Button 
            variant={showAnalytics ? 'default' : 'outline'}
            onClick={() => setShowAnalytics(!showAnalytics)} 
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
          <Button onClick={() => { setIsAddingEntry(true); setEditingEntry(null); resetForm(); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <>
          <JournalAnalytics entries={entries} />
          <TradeCorrelationAnalysis entries={entries} />
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
          <p className="text-2xl font-bold">{entries.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-sm text-muted-foreground mb-1">Open Trades</p>
          <p className="text-2xl font-bold text-warning">{entries.filter(e => e.status === 'open').length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-success">{winRate}%</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
          <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-success' : 'text-risk'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Auto-Generated
          </p>
          <p className="text-2xl font-bold text-primary">{autoGenCount}</p>
        </div>
      </div>

      {/* Add/Edit Entry Form */}
      {isAddingEntry && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingEntry ? 'Edit Trade Entry' : 'New Trade Entry'}</h3>
            <button onClick={() => { setIsAddingEntry(false); setEditingEntry(null); resetForm(); }}>
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Symbol *</Label>
              <Input
                value={newEntry.symbol}
                onChange={(e) => setNewEntry({ ...newEntry, symbol: e.target.value })}
                placeholder="EUR/USD"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newEntry.trade_type === 'BUY' ? 'default' : 'outline'}
                  onClick={() => setNewEntry({ ...newEntry, trade_type: 'BUY' })}
                  className={`flex-1 ${newEntry.trade_type === 'BUY' ? 'bg-success hover:bg-success/90' : ''}`}
                >
                  BUY
                </Button>
                <Button
                  type="button"
                  variant={newEntry.trade_type === 'SELL' ? 'default' : 'outline'}
                  onClick={() => setNewEntry({ ...newEntry, trade_type: 'SELL' })}
                  className={`flex-1 ${newEntry.trade_type === 'SELL' ? 'bg-risk hover:bg-risk/90' : ''}`}
                >
                  SELL
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newEntry.status === 'open' ? 'default' : 'outline'}
                  onClick={() => setNewEntry({ ...newEntry, status: 'open' })}
                  className={`flex-1 ${newEntry.status === 'open' ? 'bg-warning hover:bg-warning/90' : ''}`}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant={newEntry.status === 'closed' ? 'default' : 'outline'}
                  onClick={() => setNewEntry({ ...newEntry, status: 'closed' })}
                  className="flex-1"
                >
                  Closed
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Entry Price *</Label>
              <Input
                type="number"
                step="0.00001"
                value={newEntry.entry_price}
                onChange={(e) => setNewEntry({ ...newEntry, entry_price: e.target.value })}
                placeholder="1.0845"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Exit Price</Label>
              <Input
                type="number"
                step="0.00001"
                value={newEntry.exit_price}
                onChange={(e) => setNewEntry({ ...newEntry, exit_price: e.target.value })}
                placeholder="1.0895"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Stop Loss</Label>
              <Input
                type="number"
                step="0.00001"
                value={newEntry.stop_loss}
                onChange={(e) => setNewEntry({ ...newEntry, stop_loss: e.target.value })}
                placeholder="1.0800"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Take Profit</Label>
              <Input
                type="number"
                step="0.00001"
                value={newEntry.take_profit}
                onChange={(e) => setNewEntry({ ...newEntry, take_profit: e.target.value })}
                placeholder="1.0900"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Lot Size</Label>
              <Input
                type="number"
                step="0.01"
                value={newEntry.lot_size}
                onChange={(e) => setNewEntry({ ...newEntry, lot_size: e.target.value })}
                placeholder="0.01"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>P&L ($)</Label>
              <Input
                type="number"
                value={newEntry.pnl}
                onChange={(e) => setNewEntry({ ...newEntry, pnl: e.target.value })}
                placeholder="250"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Setup Type</Label>
              <select
                value={newEntry.setup_type}
                onChange={(e) => setNewEntry({ ...newEntry, setup_type: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-background border border-white/10 text-foreground [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="" className="bg-background text-foreground">Select...</option>
                {SETUP_TYPES.map(s => <option key={s} value={s} className="bg-background text-foreground">{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emotions/Mindset</Label>
              <select
                value={newEntry.emotions}
                onChange={(e) => setNewEntry({ ...newEntry, emotions: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-background border border-white/10 text-foreground [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="" className="bg-background text-foreground">Select...</option>
                {EMOTIONS.map(e => <option key={e} value={e} className="bg-background text-foreground">{e}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={newEntry.tags}
                onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                placeholder="trend-following, support"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>Trade Screenshot</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploadingScreenshot ? 'Uploading...' : 'Upload Screenshot'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  disabled={uploadingScreenshot}
                />
              </label>
              {screenshotPreview && (
                <div className="relative">
                  <img 
                    src={screenshotPreview} 
                    alt="Screenshot preview" 
                    className="h-16 w-24 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => {
                      setScreenshotPreview(null);
                      setNewEntry(prev => ({ ...prev, screenshot_url: '' }));
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="What went well? What could improve? Lessons learned?"
              className="w-full h-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 resize-none text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={editingEntry ? handleUpdateEntry : handleAddEntry} 
              className="btn-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingEntry ? 'Update Entry' : 'Save Entry'}
            </Button>
            <Button variant="outline" onClick={() => { setIsAddingEntry(false); setEditingEntry(null); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No trades yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Start documenting your trades to track your progress</p>
            <Button onClick={() => setIsAddingEntry(true)}>Add Your First Trade</Button>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6 rounded-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    entry.trade_type === 'BUY' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-risk/20 text-risk'
                  }`}>
                    {entry.trade_type === 'BUY' ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                    {entry.trade_type}
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2 flex-wrap">
                      {entry.symbol}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        entry.status === 'open' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                      }`}>
                        {entry.status}
                      </span>
                      {/* Auto-generated badge */}
                      {entry.is_auto_generated && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      {/* Session badge */}
                      {entry.session_taken && (
                        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                          SESSION_COLORS[entry.session_taken]?.bg || 'bg-muted'
                        } ${SESSION_COLORS[entry.session_taken]?.text || 'text-muted-foreground'}`}>
                          <Clock className="w-3 h-3" />
                          {entry.session_taken.replace('_', ' ')}
                        </span>
                      )}
                      {/* R:R badge */}
                      {entry.auto_calculated_rr && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          entry.auto_calculated_rr >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 
                          entry.auto_calculated_rr >= 1 ? 'bg-amber-500/20 text-amber-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {entry.auto_calculated_rr.toFixed(1)}R
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.entry_date).toLocaleDateString()}
                      {entry.setup_type && <span className="ml-2">• {entry.setup_type}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1 font-bold ${entry.pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                    <DollarSign className="w-4 h-4" />
                    {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}
                  </div>
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-2 rounded-lg hover:bg-risk/10 text-muted-foreground hover:text-risk transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mistake tags */}
              {entry.mistake_tags && entry.mistake_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {entry.mistake_tags.map((tag) => {
                    const colors = MISTAKE_COLORS[tag.toLowerCase()] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
                    return (
                      <span 
                        key={tag} 
                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${colors.bg} ${colors.text}`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {tag.replace('_', ' ')}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entry: </span>
                  <span className="font-mono">{entry.entry_price}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exit: </span>
                  <span className="font-mono">{entry.exit_price || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SL: </span>
                  <span className="font-mono text-risk">{entry.stop_loss || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">TP: </span>
                  <span className="font-mono text-success">{entry.take_profit || '-'}</span>
                </div>
              </div>

              {/* Screenshot thumbnail */}
              {entry.screenshot_url && (
                <div className="mb-3">
                  <a 
                    href={entry.screenshot_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <img 
                      src={entry.screenshot_url} 
                      alt="Trade screenshot" 
                      className="h-12 w-20 object-cover rounded"
                    />
                    <span className="text-xs text-muted-foreground">View screenshot</span>
                  </a>
                </div>
              )}

              {entry.emotions && (
                <div className="mb-3">
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{entry.emotions}</span>
                </div>
              )}

              {entry.notes && (
                <p className="text-sm text-muted-foreground mb-4">{entry.notes}</p>
              )}

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-white/5 text-muted-foreground text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default JournalTab;
