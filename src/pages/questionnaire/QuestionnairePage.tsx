import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  Wallet, 
  Target, 
  Clock,
  Coins,
  CheckCircle,
  Loader2,
  Plus,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';

const ACCOUNT_TYPES = ['Challenge Phase 1', 'Challenge Phase 2', 'Funded Account', 'Evaluation', 'Instant Funding'];
const ACCOUNT_SIZES = [5000, 10000, 25000, 50000, 100000, 200000, 400000];
const EXPERIENCE_LEVELS = ['Beginner (0-1 years)', 'Intermediate (1-3 years)', 'Advanced (3-5 years)', 'Expert (5+ years)'];
const TRADING_SESSIONS = ['Asian (Tokyo/Sydney)', 'London Open', 'New York Open', 'London Close', 'All Sessions'];
const RISK_RATIOS = ['1:1', '1:1.5', '1:2', '1:3', '1:4'];
const FOREX_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'GBP/JPY', 'XAU/USD'];
const CRYPTO_ASSETS = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'];
const FUTURES_ASSETS = ['ES (S&P 500)', 'NQ (Nasdaq)', 'YM (Dow)', 'CL (Crude Oil)', 'GC (Gold)', 'SI (Silver)', 'ZB (Treasury Bond)', 'RTY (Russell 2000)'];
const TRADES_PER_DAY = ['1-2 trades', '3-5 trades', '6-10 trades', '10+ trades'];

const QuestionnairePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propFirms, setPropFirms] = useState<{ name: string; slug: string }[]>([]);
  const [filteredFirms, setFilteredFirms] = useState<{ name: string; slug: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomFirmDialog, setShowCustomFirmDialog] = useState(false);
  const [customFirmName, setCustomFirmName] = useState('');
  const [customFirmUrl, setCustomFirmUrl] = useState('');
  const [isExtractingCustomFirm, setIsExtractingCustomFirm] = useState(false);
  const [existingRulesInfo, setExistingRulesInfo] = useState<{ hasRules: boolean; extractedAt?: string } | null>(null);
  const [showReExtractDialog, setShowReExtractDialog] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  
  const [formData, setFormData] = useState({
    propFirm: '',
    accountType: '',
    accountSize: 0,
    currentEquity: 0,
    accountNumber: '',
    challengeStep: '',
    riskPercentage: 1,
    riskRewardRatio: '1:2',
    tradingExperience: '',
    tradesPerDay: '1-2 trades',
    tradingSession: '',
    cryptoAssets: [] as string[],
    forexAssets: [] as string[],
    futuresAssets: [] as string[],
    customForexPairs: [] as string[],
    customCryptoAssets: [] as string[],
    customFuturesAssets: [] as string[],
  });

  const [customForexInput, setCustomForexInput] = useState('');
  const [customCryptoInput, setCustomCryptoInput] = useState('');
  const [customFuturesInput, setCustomFuturesInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 5;

  // Load prop firms from database
  useEffect(() => {
    const fetchPropFirms = async () => {
      const { data, error } = await supabase
        .from('prop_firms')
        .select('name, slug')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setPropFirms(data);
        setFilteredFirms(data);
      }
    };
    fetchPropFirms();
  }, []);

  // Filter prop firms based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFirms(propFirms);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFirms(propFirms.filter(f => f.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, propFirms]);

  // Check if selected prop firm already has rules
  useEffect(() => {
    const checkExistingRules = async () => {
      if (!formData.propFirm) {
        setExistingRulesInfo(null);
        return;
      }

      try {
        const { data: propFirm } = await supabase
          .from('prop_firms')
          .select('id')
          .ilike('name', formData.propFirm)
          .maybeSingle();

        if (!propFirm) {
          setExistingRulesInfo({ hasRules: false });
          return;
        }

        const { data: rules } = await supabase
          .from('prop_firm_rules')
          .select('extracted_at')
          .eq('prop_firm_id', propFirm.id)
          .eq('is_current', true)
          .maybeSingle();

        if (rules) {
          setExistingRulesInfo({ 
            hasRules: true, 
            extractedAt: rules.extracted_at 
          });
        } else {
          setExistingRulesInfo({ hasRules: false });
        }
      } catch (error) {
        console.error('Error checking existing rules:', error);
        setExistingRulesInfo(null);
      }
    };

    checkExistingRules();
  }, [formData.propFirm]);

  const handleReExtractRules = async () => {
    if (!formData.propFirm) return;

    setIsReExtracting(true);
    try {
      // Find the prop firm
      const { data: propFirm } = await supabase
        .from('prop_firms')
        .select('id, website_url')
        .ilike('name', formData.propFirm)
        .maybeSingle();

      if (!propFirm?.website_url) {
        toast({
          title: "Error",
          description: "No website found for this prop firm. Cannot re-extract rules.",
          variant: "destructive"
        });
        return;
      }

      // Call the edge function to re-scrape
      const { data, error } = await supabase.functions.invoke('scrape-prop-firm', {
        body: { 
          customFirm: { 
            name: formData.propFirm, 
            website: propFirm.website_url,
            forceReExtract: true
          } 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Rules Updated!",
          description: `${formData.propFirm} rules have been re-extracted and updated.`,
        });
        setExistingRulesInfo({ hasRules: true, extractedAt: new Date().toISOString() });
        setShowReExtractDialog(false);
      } else {
        throw new Error(data?.error || 'Failed to re-extract rules');
      }
    } catch (error: any) {
      console.error('Error re-extracting rules:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to re-extract rules. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReExtracting(false);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.propFirm) newErrors.propFirm = 'Please select a prop firm';
        if (!formData.accountType) newErrors.accountType = 'Please select an account type';
        break;
      case 2:
        if (!formData.accountSize) newErrors.accountSize = 'Please select an account size';
        if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required for support and trade verification';
        break;
      case 3:
        if (!formData.riskRewardRatio) newErrors.riskRewardRatio = 'Please select a risk:reward ratio';
        break;
      case 4:
        if (!formData.tradingExperience) newErrors.tradingExperience = 'Please select your experience level';
        if (!formData.tradingSession) newErrors.tradingSession = 'Please select a trading session';
        break;
      case 5:
        const totalAssets = formData.forexAssets.length + formData.cryptoAssets.length + formData.futuresAssets.length +
          formData.customForexPairs.length + formData.customCryptoAssets.length + formData.customFuturesAssets.length;
        if (totalAssets === 0) {
          newErrors.assets = 'Please select at least one trading asset';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step) && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleAsset = (asset: string, type: 'forex' | 'crypto' | 'futures') => {
    const keyMap = {
      forex: 'forexAssets',
      crypto: 'cryptoAssets',
      futures: 'futuresAssets'
    } as const;
    const key = keyMap[type];
    const currentAssets = formData[key];
    
    if (currentAssets.includes(asset)) {
      setFormData({ ...formData, [key]: currentAssets.filter(a => a !== asset) });
    } else {
      setFormData({ ...formData, [key]: [...currentAssets, asset] });
    }
  };

  const addCustomAsset = (type: 'forex' | 'crypto' | 'futures') => {
    const inputMap = {
      forex: customForexInput,
      crypto: customCryptoInput,
      futures: customFuturesInput
    };
    const keyMap = {
      forex: 'customForexPairs',
      crypto: 'customCryptoAssets',
      futures: 'customFuturesAssets'
    } as const;
    const setterMap = {
      forex: setCustomForexInput,
      crypto: setCustomCryptoInput,
      futures: setCustomFuturesInput
    };
    
    const input = inputMap[type].trim().toUpperCase();
    if (!input) return;
    
    const key = keyMap[type];
    if (!formData[key].includes(input)) {
      setFormData({ ...formData, [key]: [...formData[key], input] });
    }
    setterMap[type]('');
  };

  const removeCustomAsset = (asset: string, type: 'forex' | 'crypto' | 'futures') => {
    const keyMap = {
      forex: 'customForexPairs',
      crypto: 'customCryptoAssets',
      futures: 'customFuturesAssets'
    } as const;
    const key = keyMap[type];
    setFormData({ ...formData, [key]: formData[key].filter(a => a !== asset) });
  };

  const handleAddCustomFirm = async () => {
    if (!customFirmName.trim() || !customFirmUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both firm name and website URL",
        variant: "destructive"
      });
      return;
    }

    setIsExtractingCustomFirm(true);

    try {
      // Call the edge function to scrape and extract rules
      const { data, error } = await supabase.functions.invoke('scrape-prop-firm', {
        body: { 
          customFirm: { 
            name: customFirmName, 
            website: customFirmUrl.startsWith('http') ? customFirmUrl : `https://${customFirmUrl}` 
          } 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success!",
          description: `${customFirmName} has been added and rules extracted. You can now select it.`,
        });
        
        // Refresh prop firms list
        const { data: newFirms } = await supabase
          .from('prop_firms')
          .select('name, slug')
          .eq('is_active', true)
          .order('name');
        
        if (newFirms) {
          setPropFirms(newFirms);
          setFilteredFirms(newFirms);
        }
        
        // Auto-select the new firm
        setFormData({ ...formData, propFirm: customFirmName });
        setShowCustomFirmDialog(false);
        setCustomFirmName('');
        setCustomFirmUrl('');
      } else {
        throw new Error(data?.error || 'Failed to extract rules');
      }
    } catch (error: any) {
      console.error('Error adding custom firm:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add prop firm. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExtractingCustomFirm(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Insert questionnaire
      const { data: questionnaire, error: qError } = await supabase
        .from('questionnaires')
        .insert({
          user_id: user.id,
          prop_firm: formData.propFirm,
          account_type: formData.accountType,
          account_size: formData.accountSize,
          account_number: formData.accountNumber,
          risk_percentage: formData.riskPercentage,
          risk_reward_ratio: formData.riskRewardRatio,
          trading_experience: formData.tradingExperience,
          trades_per_day: formData.tradesPerDay,
          trading_session: formData.tradingSession,
          crypto_assets: formData.cryptoAssets,
          forex_assets: formData.forexAssets,
          futures_assets: formData.futuresAssets,
          custom_forex_pairs: formData.customForexPairs,
          custom_crypto_assets: formData.customCryptoAssets,
          custom_futures_assets: formData.customFuturesAssets,
          completed: true
        })
        .select()
        .single();

      if (qError) throw qError;

      // Create dashboard data - use currentEquity if provided, otherwise accountSize
      const currentEquity = formData.currentEquity > 0 ? formData.currentEquity : formData.accountSize;
      
      const { error: dError } = await supabase
        .from('dashboard_data')
        .insert({
          user_id: user.id,
          questionnaire_id: questionnaire.id,
          prop_firm: formData.propFirm,
          account_type: formData.accountType,
          account_size: formData.accountSize,
          current_equity: currentEquity,
          initial_balance: formData.accountSize
        });

      if (dError) throw dError;

      toast({
        title: "Setup Complete!",
        description: "Your trading profile has been created. Now review your risk management plan.",
      });

      // Navigate to risk management plan first, then dashboard
      navigate('/risk-management-plan');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save questionnaire",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Prop Firm Details</h2>
                <p className="text-muted-foreground">Select your prop firm and account type</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Prop Firm</Label>
                <span className="text-sm text-muted-foreground">{propFirms.length} firms available</span>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prop firms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
              
              {/* Prop Firms Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                {filteredFirms.slice(0, 30).map((firm) => (
                  <button
                    key={firm.slug}
                    onClick={() => setFormData({ ...formData, propFirm: firm.name })}
                    className={`p-4 rounded-lg border transition-all text-sm ${
                      formData.propFirm === firm.name
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {firm.name}
                  </button>
                ))}
              </div>
              
              {filteredFirms.length > 30 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 30 of {filteredFirms.length} firms. Use search to find more.
                </p>
              )}
              
              {filteredFirms.length === 0 && searchQuery && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No prop firms found matching "{searchQuery}"</p>
                </div>
              )}
              
              {/* Custom Firm Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowCustomFirmDialog(true)}
              >
                <Plus className="w-4 h-4" />
                My prop firm is not listed - Add it now
              </Button>

              {/* Existing Rules Info */}
              {formData.propFirm && existingRulesInfo && (
                <div className={`p-3 rounded-lg border ${existingRulesInfo.hasRules ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {existingRulesInfo.hasRules ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {existingRulesInfo.hasRules ? 'Rules already extracted' : 'No rules extracted yet'}
                        </p>
                        {existingRulesInfo.extractedAt && (
                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(existingRulesInfo.extractedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {existingRulesInfo.hasRules && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReExtractDialog(true)}
                        className="gap-1 text-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-extract
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {errors.propFirm && (
                <p className="text-sm text-destructive">{errors.propFirm}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, accountType: type })}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.accountType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.accountType && (
                <p className="text-sm text-destructive">{errors.accountType}</p>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Account Details</h2>
                <p className="text-muted-foreground">Enter your account information</p>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Account Size</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {ACCOUNT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setFormData({ ...formData, accountSize: size })}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.accountSize === size
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    ${size.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentEquity">Current Equity (Optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                If your account has a different equity than the initial size, enter it here
              </p>
              <Input
                id="currentEquity"
                type="number"
                value={formData.currentEquity || ''}
                onChange={(e) => setFormData({ ...formData, currentEquity: parseFloat(e.target.value) || 0 })}
                placeholder="Enter your current equity"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <span className="text-xs text-destructive font-medium">* Required</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                ⚠️ This is mandatory for support. If you face any trading issues, we'll need your account number to review your trade history and provide accurate assistance.
              </p>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Enter your prop firm account number"
                className={`bg-white/5 border-white/10 ${errors.accountNumber ? 'border-destructive' : ''}`}
                required
              />
              {errors.accountNumber && (
                <p className="text-sm text-destructive">{errors.accountNumber}</p>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Risk Management</h2>
                <p className="text-muted-foreground">Configure your risk preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Risk Per Trade: {formData.riskPercentage}%</Label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={formData.riskPercentage}
                onChange={(e) => setFormData({ ...formData, riskPercentage: parseFloat(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative (0.5%)</span>
                <span>Aggressive (3%)</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Risk:Reward Ratio</Label>
              <div className="grid grid-cols-4 gap-3">
                {RISK_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setFormData({ ...formData, riskRewardRatio: ratio })}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.riskRewardRatio === ratio
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Trading Preferences</h2>
                <p className="text-muted-foreground">Tell us about your trading style</p>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Experience Level {errors.tradingExperience && <span className="text-destructive text-sm ml-2">{errors.tradingExperience}</span>}</Label>
              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, tradingExperience: level })}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      formData.tradingExperience === level
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Preferred Trading Session {errors.tradingSession && <span className="text-destructive text-sm ml-2">{errors.tradingSession}</span>}</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRADING_SESSIONS.map((session) => (
                  <button
                    key={session}
                    onClick={() => setFormData({ ...formData, tradingSession: session })}
                    className={`p-4 rounded-lg border transition-all text-sm ${
                      formData.tradingSession === session
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {session}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Trades Per Day</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRADES_PER_DAY.map((trades) => (
                  <button
                    key={trades}
                    onClick={() => setFormData({ ...formData, tradesPerDay: trades })}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.tradesPerDay === trades
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {trades}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Coins className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Trading Assets</h2>
                <p className="text-muted-foreground">Select the assets you trade</p>
              </div>
            </div>

            {errors.assets && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                {errors.assets}
              </div>
            )}

            {/* Forex Pairs */}
            <div className="space-y-4">
              <Label>Forex Pairs</Label>
              <div className="grid grid-cols-3 gap-3">
                {FOREX_PAIRS.map((pair) => (
                  <button
                    key={pair}
                    onClick={() => toggleAsset(pair, 'forex')}
                    className={`p-3 rounded-lg border transition-all text-sm ${
                      formData.forexAssets.includes(pair)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              {/* Custom Forex Pairs */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom pair (e.g., USD/CHF)"
                  value={customForexInput}
                  onChange={(e) => setCustomForexInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAsset('forex'))}
                  className="bg-white/5 border-white/10"
                />
                <Button type="button" variant="outline" onClick={() => addCustomAsset('forex')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.customForexPairs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customForexPairs.map((pair) => (
                    <Badge key={pair} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCustomAsset(pair, 'forex')}>
                      {pair} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Crypto Assets */}
            <div className="space-y-4">
              <Label>Crypto Assets</Label>
              <div className="grid grid-cols-2 gap-3">
                {CRYPTO_ASSETS.map((asset) => (
                  <button
                    key={asset}
                    onClick={() => toggleAsset(asset, 'crypto')}
                    className={`p-3 rounded-lg border transition-all text-sm ${
                      formData.cryptoAssets.includes(asset)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
              {/* Custom Crypto Assets */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom crypto (e.g., DOGE/USD)"
                  value={customCryptoInput}
                  onChange={(e) => setCustomCryptoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAsset('crypto'))}
                  className="bg-white/5 border-white/10"
                />
                <Button type="button" variant="outline" onClick={() => addCustomAsset('crypto')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.customCryptoAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customCryptoAssets.map((asset) => (
                    <Badge key={asset} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCustomAsset(asset, 'crypto')}>
                      {asset} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Futures Assets */}
            <div className="space-y-4">
              <Label>Futures Assets</Label>
              <div className="grid grid-cols-2 gap-3">
                {FUTURES_ASSETS.map((asset) => (
                  <button
                    key={asset}
                    onClick={() => toggleAsset(asset, 'futures')}
                    className={`p-3 rounded-lg border transition-all text-sm ${
                      formData.futuresAssets.includes(asset)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
              {/* Custom Futures Assets */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom futures (e.g., ZN, ZC)"
                  value={customFuturesInput}
                  onChange={(e) => setCustomFuturesInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAsset('futures'))}
                  className="bg-white/5 border-white/10"
                />
                <Button type="button" variant="outline" onClick={() => addCustomAsset('futures')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.customFuturesAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customFuturesAssets.map((asset) => (
                    <Badge key={asset} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCustomAsset(asset, 'futures')}>
                      {asset} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Summary */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-primary">Selected:</strong>{' '}
                {[
                  ...formData.forexAssets, 
                  ...formData.customForexPairs,
                  ...formData.cryptoAssets, 
                  ...formData.customCryptoAssets,
                  ...formData.futuresAssets,
                  ...formData.customFuturesAssets
                ].join(', ') || 'None selected'}
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">{Math.round((step / totalSteps) * 100)}% complete</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-card border border-white/10 rounded-xl p-6 md:p-8">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {step === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Custom Prop Firm Dialog */}
      <Dialog open={showCustomFirmDialog} onOpenChange={setShowCustomFirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Your Prop Firm</DialogTitle>
            <DialogDescription>
              Enter your prop firm details and we'll automatically extract their trading rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Prop Firm Name *</Label>
              <Input
                placeholder="e.g., My Prop Firm"
                value={customFirmName}
                onChange={(e) => setCustomFirmName(e.target.value)}
                disabled={isExtractingCustomFirm}
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL *</Label>
              <Input
                placeholder="https://mypropfirm.com"
                value={customFirmUrl}
                onChange={(e) => setCustomFirmUrl(e.target.value)}
                disabled={isExtractingCustomFirm}
              />
            </div>
            
            {isExtractingCustomFirm && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium text-primary">Extracting Rules...</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI is scanning the website and extracting trading rules. This may take a minute.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCustomFirmDialog(false)}
                disabled={isExtractingCustomFirm}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddCustomFirm}
                disabled={isExtractingCustomFirm || !customFirmName || !customFirmUrl}
              >
                {isExtractingCustomFirm ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Add & Extract Rules'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-Extract Rules Dialog */}
      <Dialog open={showReExtractDialog} onOpenChange={setShowReExtractDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-extract Rules for {formData.propFirm}?</DialogTitle>
            <DialogDescription>
              Rules for this prop firm already exist. Re-extracting will update them with the latest information from their website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isReExtracting && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium text-primary">Re-extracting Rules...</p>
                    <p className="text-sm text-muted-foreground">
                      Updating rules from the prop firm website. This may take a minute.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowReExtractDialog(false)}
                disabled={isReExtracting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReExtractRules}
                disabled={isReExtracting}
              >
                {isReExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Re-extracting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-extract Rules
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionnairePage;
