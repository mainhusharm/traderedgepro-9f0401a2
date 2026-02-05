import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Globe, 
  DollarSign, 
  FileText, 
  Clock, 
  Star,
  TrendingUp,
  Shield,
  Briefcase,
  Calculator,
  IndianRupee,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bell,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAccountantApi } from '@/hooks/useAccountantApi';

const USD_TO_INR = 83.5;
const REGISTRATION_THRESHOLD = 50000;

interface CountryOption {
  id: string;
  name: string;
  flag: string;
  recommended: boolean;
  setupCost: { min: number; max: number };
  annualCost: { min: number; max: number };
  corporateTax: string;
  timeToRegister: string;
  benefits: string[];
  challenges: string[];
  requirements: string[];
  steps: string[];
  bestFor: string;
  bankingEase: 'Easy' | 'Moderate' | 'Difficult';
  remoteSetup: boolean;
}

const countryOptions: CountryOption[] = [
  {
    id: 'us-wyoming',
    name: 'USA - Wyoming LLC',
    flag: '🇺🇸',
    recommended: true,
    setupCost: { min: 500, max: 1500 },
    annualCost: { min: 100, max: 500 },
    corporateTax: '0% state tax (federal depends on structure)',
    timeToRegister: '1-3 days',
    benefits: [
      'No state income tax on LLCs',
      'Strong privacy protection (anonymous ownership)',
      'No requirement for US residency',
      'Access to US banking & payment processors',
      'High global credibility',
      'Simple annual compliance',
      'No minimum capital requirement',
      'Pass-through taxation available'
    ],
    challenges: [
      'May need US bank account (can use Mercury, Relay)',
      'Federal taxes if US-sourced income',
      'Need registered agent ($50-150/year)'
    ],
    requirements: [
      'Valid passport/ID',
      'Proof of address',
      'EIN (Tax ID) - free from IRS',
      'Registered agent in Wyoming'
    ],
    steps: [
      '1. Choose a unique company name',
      '2. Hire a registered agent (e.g., Northwest, Wyoming Agents)',
      '3. File Articles of Organization online ($100)',
      '4. Create Operating Agreement',
      '5. Apply for EIN from IRS (free, online)',
      '6. Open US bank account (Mercury, Relay - remote friendly)',
      '7. Get payment processor (Stripe Atlas can help)'
    ],
    bestFor: 'SaaS, digital products, global customers - Best overall choice!',
    bankingEase: 'Moderate',
    remoteSetup: true
  },
  {
    id: 'us-delaware',
    name: 'USA - Delaware LLC/C-Corp',
    flag: '🇺🇸',
    recommended: false,
    setupCost: { min: 500, max: 2000 },
    annualCost: { min: 300, max: 800 },
    corporateTax: '8.7% (C-Corp) or pass-through',
    timeToRegister: '1-2 days',
    benefits: [
      'Best for raising VC funding',
      'Favorable corporate law (Court of Chancery)',
      'No state tax on out-of-state income',
      'Easy to convert to C-Corp later',
      'Highest credibility for investors'
    ],
    challenges: [
      'Higher franchise taxes ($300+ annually)',
      'More complex if not raising funding',
      'Need registered agent'
    ],
    requirements: [
      'Valid passport/ID',
      'Proof of address',
      'EIN from IRS',
      'Registered agent in Delaware'
    ],
    steps: [
      '1. Reserve company name',
      '2. Hire registered agent',
      '3. File Certificate of Formation ($90)',
      '4. Create Operating Agreement / Bylaws',
      '5. Apply for EIN',
      '6. Open bank account',
      '7. File annual franchise tax ($300+)'
    ],
    bestFor: 'Planning to raise venture capital or go public',
    bankingEase: 'Moderate',
    remoteSetup: true
  },
  {
    id: 'uae-dubai',
    name: 'UAE - Dubai Free Zone',
    flag: '🇦🇪',
    recommended: true,
    setupCost: { min: 5000, max: 15000 },
    annualCost: { min: 3000, max: 10000 },
    corporateTax: '9% (above AED 375,000 profit)',
    timeToRegister: '2-4 weeks',
    benefits: [
      '0% personal income tax',
      'Easy visa/residency for founders',
      '100% foreign ownership',
      'No currency restrictions',
      'Growing fintech hub',
      'Good for crypto/Web3 businesses',
      'Gateway to Middle East market'
    ],
    challenges: [
      'Higher setup and annual costs',
      'Need physical presence for some activities',
      'Banking can be slow to set up',
      '9% corporate tax introduced recently'
    ],
    requirements: [
      'Passport copy',
      'Proof of address',
      'Business plan',
      'Bank reference letter',
      'CV of shareholders'
    ],
    steps: [
      '1. Choose a Free Zone (DMCC, DIFC, IFZA recommended)',
      '2. Apply for trade license',
      '3. Submit documents & pay fees',
      '4. Get trade license & registration',
      '5. Apply for residence visa (optional)',
      '6. Open corporate bank account',
      '7. Get Emirates ID if resident'
    ],
    bestFor: 'Want residency + tax benefits, Middle East expansion, crypto',
    bankingEase: 'Moderate',
    remoteSetup: false
  },
  {
    id: 'singapore',
    name: 'Singapore Pte. Ltd.',
    flag: '🇸🇬',
    recommended: false,
    setupCost: { min: 1500, max: 4000 },
    annualCost: { min: 1500, max: 5000 },
    corporateTax: '17% (0% on first S$100k for 3 years)',
    timeToRegister: '1-2 days',
    benefits: [
      'Extremely business-friendly',
      'Strong legal system',
      'Tax exemptions for startups',
      'Access to Asian markets',
      'Easy banking',
      'High global trust'
    ],
    challenges: [
      'Need local director (can hire nominee)',
      'Higher ongoing costs',
      'Personal tax if resident',
      'Annual audit required for larger companies'
    ],
    requirements: [
      'At least 1 local director (or nominee)',
      'Local registered address',
      'Company secretary',
      'Minimum 1 shareholder'
    ],
    steps: [
      '1. Reserve company name via ACRA',
      '2. Prepare incorporation documents',
      '3. Appoint local director (or use nominee service)',
      '4. File with ACRA ($300)',
      '5. Receive Certificate of Incorporation',
      '6. Open bank account (DBS, OCBC)',
      '7. Register for GST if revenue > S$1M'
    ],
    bestFor: 'Targeting Asian markets, high credibility needed',
    bankingEase: 'Easy',
    remoteSetup: true
  },
  {
    id: 'uk',
    name: 'UK Limited Company',
    flag: '🇬🇧',
    recommended: false,
    setupCost: { min: 50, max: 500 },
    annualCost: { min: 200, max: 1000 },
    corporateTax: '19-25%',
    timeToRegister: '24-48 hours',
    benefits: [
      'Cheapest to register',
      'Fast online registration',
      'No residency requirement',
      'Easy banking (Wise, Revolut Business)',
      'Good for European market'
    ],
    challenges: [
      '25% corporate tax',
      'Post-Brexit complications for EU',
      'Annual accounts filing',
      'VAT registration if selling to UK/EU'
    ],
    requirements: [
      'Valid ID',
      'Proof of address',
      'UK registered address (can use service)'
    ],
    steps: [
      '1. Check company name availability',
      '2. Register on Companies House website (£12)',
      '3. Receive Certificate of Incorporation',
      '4. Register for Corporation Tax',
      '5. Open business bank account',
      '6. Register for VAT if applicable',
      '7. File annual accounts & confirmation statement'
    ],
    bestFor: 'Budget setup, targeting UK/EU markets',
    bankingEase: 'Easy',
    remoteSetup: true
  },
  {
    id: 'india',
    name: 'India Private Limited',
    flag: '🇮🇳',
    recommended: false,
    setupCost: { min: 200, max: 800 },
    annualCost: { min: 500, max: 2000 },
    corporateTax: '22% + surcharge (25% effective)',
    timeToRegister: '7-15 days',
    benefits: [
      'Low setup costs',
      'Large local market',
      'Easy to operate if based in India',
      'Startup India benefits available',
      'Local payment processors (Razorpay)'
    ],
    challenges: [
      'Higher taxes',
      'Complex compliance (GST, TDS, ROC)',
      'Foreign remittance restrictions',
      'Banking can be bureaucratic'
    ],
    requirements: [
      'Minimum 2 directors (1 must be Indian resident)',
      'Minimum 2 shareholders',
      'Registered office in India',
      'DIN for directors',
      'Digital Signature Certificate'
    ],
    steps: [
      '1. Obtain Digital Signature Certificates (DSC)',
      '2. Apply for Director Identification Number (DIN)',
      '3. Reserve company name on MCA portal',
      '4. File SPICe+ form for incorporation',
      '5. Receive Certificate of Incorporation',
      '6. Apply for PAN & TAN',
      '7. Open current account',
      '8. Register for GST'
    ],
    bestFor: 'Local operations, Indian market focus',
    bankingEase: 'Moderate',
    remoteSetup: false
  },
  {
    id: 'estonia',
    name: 'Estonia e-Residency Company',
    flag: '🇪🇪',
    recommended: false,
    setupCost: { min: 500, max: 1500 },
    annualCost: { min: 500, max: 2000 },
    corporateTax: '0% on retained earnings, 20% on distribution',
    timeToRegister: '2-4 weeks',
    benefits: [
      '0% tax on reinvested profits',
      'Fully remote management',
      'e-Residency program',
      'EU market access',
      'Digital-first infrastructure'
    ],
    challenges: [
      'Need e-Residency card first',
      'Limited banking options',
      'Not suitable for US customers',
      '20% tax when taking money out'
    ],
    requirements: [
      'e-Residency card (€120 + pickup)',
      'Estonian contact person',
      'Estonian address',
      'Share capital €2,500 (can be unpaid)'
    ],
    steps: [
      '1. Apply for e-Residency online (€120)',
      '2. Pick up e-Residency card at embassy',
      '3. Choose service provider (LeapIn, Xolo)',
      '4. Submit incorporation documents',
      '5. Receive registration',
      '6. Open business account (Wise, LHV)',
      '7. Start operations'
    ],
    bestFor: 'Location-independent, EU focus, reinvesting profits',
    bankingEase: 'Difficult',
    remoteSetup: true
  }
];

const CompanyRegistrationTab = () => {
  const { callAccountantApi } = useAccountantApi();
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState<string | null>('us-wyoming');

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(false);
    try {
      const result = await callAccountantApi('get_payments');
      const completedPayments = (result.payments || []).filter((p: any) => p.status === 'completed');
      const total = completedPayments.reduce((sum: number, p: any) => sum + (p.final_price || 0), 0);
      setTotalSales(total);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    }
  };

  const progressPercent = Math.min((totalSales / REGISTRATION_THRESHOLD) * 100, 100);
  const remainingAmount = Math.max(REGISTRATION_THRESHOLD - totalSales, 0);
  const hasReachedThreshold = totalSales >= REGISTRATION_THRESHOLD;

  return (
    <div className="space-y-6">
      {/* Milestone Tracker */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${hasReachedThreshold ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasReachedThreshold ? (
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-7 h-7 text-amber-500" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">Company Registration Milestone</CardTitle>
                  <CardDescription>
                    {hasReachedThreshold 
                      ? '🎉 Congratulations! You\'ve reached the $50,000 threshold!' 
                      : 'Track your progress towards the $50,000 registration milestone'}
                  </CardDescription>
                </div>
              </div>
              <Badge className={hasReachedThreshold ? 'bg-emerald-500' : 'bg-amber-500'}>
                {hasReachedThreshold ? 'ACTION REQUIRED' : 'TRACKING'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Current Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-500">${totalSales.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {(totalSales * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Threshold</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">${REGISTRATION_THRESHOLD.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {(REGISTRATION_THRESHOLD * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{hasReachedThreshold ? 'Exceeded By' : 'Remaining'}</span>
                  </div>
                  <p className={`text-2xl font-bold ${hasReachedThreshold ? 'text-emerald-500' : 'text-amber-500'}`}>
                    ${hasReachedThreshold ? (totalSales - REGISTRATION_THRESHOLD).toFixed(2) : remainingAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{progressPercent.toFixed(1)}% complete</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to Registration Threshold</span>
                <span className="font-medium">{progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            {hasReachedThreshold && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-500">Time to Register Your Company!</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've hit the $50,000 milestone. Review the country options below and choose the best jurisdiction 
                      for your business. <strong>Wyoming LLC</strong> or <strong>Dubai Free Zone</strong> are our top recommendations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Country Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Company Registration Options
          </h2>
          <Badge variant="outline" className="text-xs">
            {countryOptions.length} jurisdictions analyzed
          </Badge>
        </div>

        <div className="grid gap-4">
          {countryOptions.map((country, index) => (
            <motion.div
              key={country.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Collapsible
                open={expandedCountry === country.id}
                onOpenChange={() => setExpandedCountry(expandedCountry === country.id ? null : country.id)}
              >
                <Card className={`border ${country.recommended ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08]'}`}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{country.flag}</span>
                          <div className="text-left">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {country.name}
                              {country.recommended && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                  <Star className="w-3 h-3 mr-1" /> RECOMMENDED
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">{country.bestFor}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-muted-foreground">Setup Cost</p>
                            <p className="text-sm font-medium text-emerald-500">
                              ${country.setupCost.min.toLocaleString()} - ${country.setupCost.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-muted-foreground">Corp Tax</p>
                            <p className="text-sm font-medium">{country.corporateTax}</p>
                          </div>
                          {expandedCountry === country.id ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-6">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-xs">Setup Cost</span>
                          </div>
                          <p className="text-sm font-medium">
                            ${country.setupCost.min.toLocaleString()} - ${country.setupCost.max.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calculator className="w-3 h-3" />
                            <span className="text-xs">Annual Cost</span>
                          </div>
                          <p className="text-sm font-medium">
                            ${country.annualCost.min.toLocaleString()} - ${country.annualCost.max.toLocaleString()}/yr
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">Time to Register</span>
                          </div>
                          <p className="text-sm font-medium">{country.timeToRegister}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Briefcase className="w-3 h-3" />
                            <span className="text-xs">Banking Ease</span>
                          </div>
                          <p className="text-sm font-medium">{country.bankingEase}</p>
                        </div>
                      </div>

                      {/* Benefits & Challenges */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" /> Benefits
                          </h4>
                          <ul className="space-y-1">
                            {country.benefits.map((benefit, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="w-4 h-4" /> Challenges
                          </h4>
                          <ul className="space-y-1">
                            {country.challenges.map((challenge, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" /> Requirements
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {country.requirements.map((req, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Step by Step */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-500" /> Registration Steps
                        </h4>
                        <div className="p-4 rounded-lg bg-white/5 space-y-2">
                          {country.steps.map((step, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{step}</p>
                          ))}
                        </div>
                      </div>

                      {/* Remote Setup Badge */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                        <div className="flex items-center gap-2">
                          <Badge variant={country.remoteSetup ? 'default' : 'secondary'} className="text-xs">
                            {country.remoteSetup ? '✓ Remote Setup Possible' : '✗ Physical Presence Required'}
                          </Badge>
                        </div>
                        {country.recommended && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <ExternalLink className="w-3 h-3 mr-2" />
                            Start Registration
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Recommendation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Our Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🇺🇸</span>
                  <h4 className="font-semibold text-emerald-500">Best Overall: Wyoming LLC</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Cheapest to set up ($500-1500)</li>
                  <li>• 0% state tax, strong privacy</li>
                  <li>• Access to US payment processors (Stripe)</li>
                  <li>• 1-3 days registration</li>
                  <li>• Perfect for global SaaS/digital products</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🇦🇪</span>
                  <h4 className="font-semibold text-blue-500">Best for Residency: Dubai Free Zone</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 0% personal income tax</li>
                  <li>• Easy founder visa/residency</li>
                  <li>• Growing fintech & crypto hub</li>
                  <li>• Higher cost but lifestyle benefits</li>
                  <li>• Gateway to Middle East market</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Pro tip:</strong> For most online businesses, <strong>Wyoming LLC</strong> offers the best balance of 
              low cost, privacy, tax efficiency, and global credibility. If you want residency benefits and 
              are considering relocating, <strong>Dubai</strong> is an excellent choice despite higher costs.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompanyRegistrationTab;
