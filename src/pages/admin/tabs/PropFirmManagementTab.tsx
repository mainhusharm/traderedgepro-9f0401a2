import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Trash2,
  Download,
  Eye,
  TrendingUp,
  Bitcoin,
  DollarSign
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PropFirm {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  last_scraped_at: string | null;
  scrape_status: string | null;
  created_at: string;
}

interface PropFirmRule {
  id: string;
  prop_firm_id: string;
  account_type: string;
  account_sizes: unknown;
  max_daily_loss_percent: number | null;
  max_total_drawdown_percent: number | null;
  profit_target_percent: number | null;
  min_trading_days: number | null;
  max_trading_days: number | null;
  news_trading_allowed: boolean | null;
  weekend_holding_allowed: boolean | null;
  ea_allowed: boolean | null;
  copy_trading_allowed: boolean | null;
  is_current: boolean | null;
  extracted_at: string | null;
}

interface RuleChange {
  id: string;
  prop_firm_id: string;
  account_type: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  detected_at: string | null;
}

const PropFirmManagementTab = () => {
  const [propFirms, setPropFirms] = useState<PropFirm[]>([]);
  const [ruleChanges, setRuleChanges] = useState<RuleChange[]>([]);
  const [selectedFirmRules, setSelectedFirmRules] = useState<PropFirmRule[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<PropFirm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [isScraping, setIsScraping] = useState<string | null>(null);
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState({ current: 0, total: 0 });
  
  // Form state
  const [newFirmName, setNewFirmName] = useState('');
  const [newFirmUrl, setNewFirmUrl] = useState('');
  const [newFirmDescription, setNewFirmDescription] = useState('');

  useEffect(() => {
    fetchPropFirms();
    fetchRuleChanges();
  }, []);

  const fetchPropFirms = async () => {
    try {
      const { data, error } = await supabase
        .from('prop_firms')
        .select('*')
        .order('name');

      if (error) throw error;
      setPropFirms(data || []);
    } catch (error) {
      console.error('Error fetching prop firms:', error);
      toast.error('Failed to load prop firms');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRuleChanges = async () => {
    try {
      const { data, error } = await supabase
        .from('prop_firm_rule_changes')
        .select('*')
        .eq('notified', false)
        .order('detected_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRuleChanges(data || []);
    } catch (error) {
      console.error('Error fetching rule changes:', error);
    }
  };

  const fetchFirmRules = async (firmId: string) => {
    try {
      const { data, error } = await supabase
        .from('prop_firm_rules')
        .select('*')
        .eq('prop_firm_id', firmId)
        .eq('is_current', true)
        .order('account_type');

      if (error) throw error;
      setSelectedFirmRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load rules');
    }
  };

  const handleViewRules = async (firm: PropFirm) => {
    setSelectedFirm(firm);
    await fetchFirmRules(firm.id);
    setShowRulesDialog(true);
  };

  const handleAddPropFirm = async () => {
    if (!newFirmName.trim() || !newFirmUrl.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const slug = newFirmName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { error } = await supabase
        .from('prop_firms')
        .insert({
          name: newFirmName,
          slug,
          website_url: newFirmUrl,
          description: newFirmDescription || null,
        });

      if (error) throw error;

      toast.success('Prop firm added successfully');
      setShowAddDialog(false);
      setNewFirmName('');
      setNewFirmUrl('');
      setNewFirmDescription('');
      fetchPropFirms();
    } catch (error: any) {
      console.error('Error adding prop firm:', error);
      toast.error(error.message || 'Failed to add prop firm');
    }
  };

  const handleScrape = async (firmSlug: string) => {
    setIsScraping(firmSlug);
    
    try {
      const { data, error } = await callEdgeFunction('scrape-prop-firm', { firmSlug });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Scraped ${data.results?.[0]?.rulesCount || 0} rules from ${firmSlug}`);
      } else {
        toast.error(data?.error || 'Scraping failed');
      }
      
      fetchPropFirms();
      fetchRuleChanges();
    } catch (error: any) {
      console.error('Error scraping:', error);
      toast.error(error.message || 'Failed to scrape prop firm rules');
    } finally {
      setIsScraping(null);
    }
  };

  const handleScrapeAllFirms = async () => {
    setIsScrapingAll(true);
    setScrapeProgress({ current: 0, total: 0 });

    const BATCH_SIZE = 10;

    try {
      toast.info('Starting batched scraping… keep this tab open until it finishes.');

      let start = 0;
      let total = 0;
      let totalSuccessful = 0;

      // Run sequential batches to avoid timeouts
      while (true) {
        const { data, error } = await callEdgeFunction('scrape-prop-firm', {
          scrapeAll: true,
          batchStart: start,
          batchSize: BATCH_SIZE,
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Batch scraping failed');

        total = data.totalAvailable || total;
        const processedThisBatch = data.totalProcessed || 0;
        const successfulThisBatch = data.successful || 0;

        totalSuccessful += successfulThisBatch;
        start += processedThisBatch;

        setScrapeProgress({ current: Math.min(start, total), total });

        if (start >= total || processedThisBatch === 0) break;
      }

      toast.success(`Scraping complete: ${totalSuccessful}/${total} firms processed successfully.`);
      fetchPropFirms();
      fetchRuleChanges();
    } catch (error: any) {
      console.error('Error scraping all:', error);
      toast.error(error.message || 'Failed to scrape prop firms');
    } finally {
      setIsScrapingAll(false);
      setScrapeProgress({ current: 0, total: 0 });
    }
  };

  const handleDelete = async (firmId: string) => {
    if (!confirm('Are you sure you want to delete this prop firm? All associated rules will also be deleted.')) {
      return;
    }

    try {
      // First delete rules
      await supabase.from('prop_firm_rules').delete().eq('prop_firm_id', firmId);
      await supabase.from('prop_firm_rule_changes').delete().eq('prop_firm_id', firmId);
      
      const { error } = await supabase
        .from('prop_firms')
        .delete()
        .eq('id', firmId);

      if (error) throw error;

      toast.success('Prop firm deleted');
      fetchPropFirms();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete prop firm');
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/20 text-success border-success/30">Success</Badge>;
      case 'scraping':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Scraping...</Badge>;
      case 'no_content':
        return <Badge className="bg-warning/20 text-warning border-warning/30">No Content</Badge>;
      case 'extraction_failed':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getCategoryIcon = (description: string | null) => {
    if (description?.toLowerCase().includes('crypto')) {
      return <Bitcoin className="w-4 h-4 text-orange-500" />;
    }
    if (description?.toLowerCase().includes('futures')) {
      return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
    return <DollarSign className="w-4 h-4 text-green-500" />;
  };

  const stats = {
    total: propFirms.length,
    scraped: propFirms.filter(f => f.scrape_status === 'success').length,
    pending: propFirms.filter(f => !f.scrape_status || f.scrape_status === 'pending').length,
    recentChanges: ruleChanges.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Prop Firm Rules Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Extract and monitor trading rules from forex, crypto, and futures prop firms
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleScrapeAllFirms} 
            disabled={isScrapingAll}
            className="gap-2"
          >
            <Download className={`w-4 h-4 ${isScrapingAll ? 'animate-bounce' : ''}`} />
            {isScrapingAll
              ? (scrapeProgress.total > 0
                  ? `Scraping ${scrapeProgress.current}/${scrapeProgress.total}…`
                  : 'Starting…')
              : 'Rescrape All Rules'}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Custom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Prop Firm</DialogTitle>
                <DialogDescription>
                  Add a prop firm that's not in our list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Prop Firm Name *</Label>
                  <Input
                    placeholder="e.g., New Prop Firm"
                    value={newFirmName}
                    onChange={(e) => setNewFirmName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website URL *</Label>
                  <Input
                    placeholder="https://example.com"
                    value={newFirmUrl}
                    onChange={(e) => setNewFirmUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Forex / Crypto / Futures prop firm"
                    value={newFirmDescription}
                    onChange={(e) => setNewFirmDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPropFirm}>
                    Add Prop Firm
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Prop Firms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successfully Scraped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.scraped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Scrape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rule Changes Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats.recentChanges}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rule Changes Alert */}
      {ruleChanges.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <CardTitle className="text-warning">Rule Changes Detected</CardTitle>
            </div>
            <CardDescription>
              The following prop firm rules have changed - users may need to update their trading approach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ruleChanges.map((change) => {
                const firm = propFirms.find(f => f.id === change.prop_firm_id);
                return (
                  <div
                    key={change.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/10"
                  >
                    <div>
                      <span className="font-medium">{firm?.name || 'Unknown'}</span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className="text-sm">{change.account_type}</span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className="text-sm text-muted-foreground">{change.field_name.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-destructive line-through">{change.old_value || 'N/A'}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-success">{change.new_value || 'N/A'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prop Firms List */}
      <Card>
        <CardHeader>
          <CardTitle>Prop Firms Database</CardTitle>
          <CardDescription>
            {propFirms.length === 0 
              ? 'Click "Import All Prop Firms" to populate the database with forex, crypto, and futures prop firms'
              : 'All prop firms with their extracted trading rules'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : propFirms.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Prop Firms Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Import all major prop firms from forex, crypto, and futures markets with a single click.
                Our AI will automatically extract their trading rules.
              </p>
              <Button onClick={handleScrapeAllFirms} disabled={isScrapingAll} size="lg">
                <Download className="w-5 h-5 mr-2" />
                Scrape All Firms (Batched)
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({propFirms.length})</TabsTrigger>
                <TabsTrigger value="forex">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Forex
                </TabsTrigger>
                <TabsTrigger value="crypto">
                  <Bitcoin className="w-4 h-4 mr-1" />
                  Crypto
                </TabsTrigger>
                <TabsTrigger value="futures">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Futures
                </TabsTrigger>
              </TabsList>
              
              {['all', 'forex', 'crypto', 'futures'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-3">
                  {propFirms
                    .filter(firm => {
                      if (tab === 'all') return true;
                      return firm.description?.toLowerCase().includes(tab);
                    })
                    .map((firm) => (
                    <div
                      key={firm.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getCategoryIcon(firm.description)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{firm.name}</h4>
                            {getStatusBadge(firm.scrape_status)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <a 
                              href={firm.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {firm.website_url ? new URL(firm.website_url).hostname : 'No URL'}
                            </a>
                            {firm.last_scraped_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(firm.last_scraped_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {firm.scrape_status === 'success' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRules(firm)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Rules
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScrape(firm.slug)}
                          disabled={isScraping === firm.slug}
                        >
                          <RefreshCw className={`w-4 h-4 mr-1 ${isScraping === firm.slug ? 'animate-spin' : ''}`} />
                          {isScraping === firm.slug ? 'Scraping...' : 'Re-scrape'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(firm.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Rules View Dialog */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getCategoryIcon(selectedFirm?.description || null)}
              {selectedFirm?.name} - Trading Rules
            </DialogTitle>
            <DialogDescription>
              Extracted rules from {selectedFirm?.website_url}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedFirmRules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No rules extracted yet</p>
            ) : (
              selectedFirmRules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{rule.account_type}</CardTitle>
                    {rule.account_sizes && (
                      <CardDescription>
                        Account sizes: {(rule.account_sizes as number[]).map(s => `$${s.toLocaleString()}`).join(', ')}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Daily Loss Limit</p>
                        <p className="font-semibold text-destructive">
                          {rule.max_daily_loss_percent != null ? `${rule.max_daily_loss_percent}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Max Drawdown</p>
                        <p className="font-semibold text-destructive">
                          {rule.max_total_drawdown_percent != null ? `${rule.max_total_drawdown_percent}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Profit Target</p>
                        <p className="font-semibold text-success">
                          {rule.profit_target_percent != null ? `${rule.profit_target_percent}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Min Trading Days</p>
                        <p className="font-semibold">
                          {rule.min_trading_days != null ? rule.min_trading_days : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Max Trading Days</p>
                        <p className="font-semibold">
                          {rule.max_trading_days != null ? rule.max_trading_days : 'Unlimited'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">News Trading</p>
                        <p className="font-semibold">
                          {rule.news_trading_allowed ? '✅ Allowed' : rule.news_trading_allowed === false ? '❌ Not Allowed' : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Weekend Holding</p>
                        <p className="font-semibold">
                          {rule.weekend_holding_allowed ? '✅ Allowed' : rule.weekend_holding_allowed === false ? '❌ Not Allowed' : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">EAs/Bots</p>
                        <p className="font-semibold">
                          {rule.ea_allowed ? '✅ Allowed' : rule.ea_allowed === false ? '❌ Not Allowed' : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">Copy Trading</p>
                        <p className="font-semibold">
                          {rule.copy_trading_allowed ? '✅ Allowed' : rule.copy_trading_allowed === false ? '❌ Not Allowed' : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {rule.extracted_at && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Last updated: {format(new Date(rule.extracted_at), 'PPp')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Rule Extraction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">One-Click Import</p>
                <p>Import 28+ prop firms from forex, crypto, and futures markets automatically</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI Rule Extraction</p>
                <p>Our AI scrapes websites and extracts trading rules (daily loss, drawdown, profit targets)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Change Detection</p>
                <p>Automatically detects when rules change and alerts you to notify users</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropFirmManagementTab;
