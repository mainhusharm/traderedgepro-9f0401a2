import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DollarSign, Users, TrendingUp, Gift, Copy, Check, 
  Percent, Zap, Shield, Award, Upload, Image, Loader2,
  ExternalLink, ChevronRight
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PropFirmRequestForm from '@/components/affiliates/PropFirmRequestForm';

const affiliatePartners = [
  { 
    name: 'FundingTraders', 
    url: 'https://app.fundingtraders.com/login?ref=afi6924691', 
    icon: '💰',
    description: 'Top-rated prop firm with fast payouts'
  },
  { 
    name: 'BlueberryFunded', 
    url: 'https://blueberryfunded.com/?utm_source=affiliate&ref=4802', 
    icon: '🫐',
    description: 'Flexible rules and great scaling'
  },
  { 
    name: 'Funded Firm', 
    url: 'https://my.fundedfirm.com/register?ref=7ac25577d6e1ffa', 
    icon: '🏢',
    description: 'Industry-leading profit splits'
  },
  { 
    name: 'FundingPips', 
    url: 'https://app.fundingpips.com/register?ref=dc5afd84', 
    code: 'dc5afd84', 
    icon: '📊',
    description: 'Competitive challenges with low fees'
  },
];

const AffiliateLinksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Affiliate link states
  const [copied, setCopied] = useState(false);
  const affiliateLink = user ? `https://traderedgepro.com/?ref=${user.id.slice(0, 8)}` : 'https://traderedgepro.com/?ref=YOURCODE';

  // Kickstarter verification states
  const [selectedPartner, setSelectedPartner] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, GIF)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadScreenshot = async () => {
    if (!user) {
      toast.error('Please sign in to submit your verification');
      navigate('/auth?redirect=/affiliates');
      return;
    }

    if (!selectedPartner) {
      toast.error('Please select the affiliate partner you purchased from');
      return;
    }

    if (!selectedFile) {
      toast.error('Please upload a screenshot of your purchase');
      return;
    }

    try {
      setUploading(true);

      // Upload screenshot to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kickstarter-screenshots')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kickstarter-screenshots')
        .getPublicUrl(fileName);

      // Create verification record
      const { error: verificationError } = await supabase
        .from('kickstarter_verifications')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          affiliate_partner: selectedPartner,
          screenshot_url: urlData.publicUrl,
          promo_code: promoCode || null,
          status: 'pending',
        });

      if (verificationError) throw verificationError;

      toast.success('Screenshot uploaded successfully! Please allow 24-48 hours for verification.');
      
      // Reset form
      setSelectedPartner('');
      setPromoCode('');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload screenshot. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const benefits = [
    {
      icon: Percent,
      title: '30% Commission',
      description: 'Earn 30% recurring commission on every referral subscription',
    },
    {
      icon: Zap,
      title: 'Instant Payouts',
      description: 'Get paid automatically every month via PayPal or crypto',
    },
    {
      icon: Shield,
      title: 'Lifetime Tracking',
      description: 'Your referrals are tracked forever with our advanced system',
    },
    {
      icon: Award,
      title: 'Bonus Tiers',
      description: 'Unlock higher commission rates as you bring in more referrals',
    },
  ];

  const tiers = [
    { name: 'Starter', referrals: '1-10', commission: '30%', bonus: '' },
    { name: 'Bronze', referrals: '11-25', commission: '35%', bonus: '$100 bonus' },
    { name: 'Silver', referrals: '26-50', commission: '40%', bonus: '$250 bonus' },
    { name: 'Gold', referrals: '51-100', commission: '45%', bonus: '$500 bonus' },
    { name: 'Platinum', referrals: '100+', commission: '50%', bonus: '$1,000 bonus' },
  ];

  const stats = [
    { label: 'Active Affiliates', value: '2,500+' },
    { label: 'Total Paid Out', value: '$450K+' },
    { label: 'Avg. Monthly Earning', value: '$180' },
    { label: 'Conversion Rate', value: '12%' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero - Left aligned */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-300/80 mb-6">
                <Gift className="w-3.5 h-3.5" />
                Kickstarter + Affiliate
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Get</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">FREE Access</span>
                <br />
                <span className="font-light text-white/50">via affiliate.</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                Buy a funded account through our partner links and get 30 days of TraderEdge Pro free.
                Or earn 30%+ commission by referring others.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="relative pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Prop Firm Request Form - Right after Hero */}
          <div className="mb-12 max-w-3xl mx-auto">
            <PropFirmRequestForm />
          </div>

          {/* Kickstarter Section - Purchase via Affiliate */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-white/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Gift className="w-6 h-6 text-primary" />
                  Kickstarter Plan - Get Started Free
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Step 1: Choose Partner */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">1</div>
                      <h3 className="text-lg font-semibold">Choose a Prop Firm Partner</h3>
                    </div>
                    
                    <div className="grid gap-3">
                      {affiliatePartners.map((partner) => (
                        <a
                          key={partner.name}
                          href={partner.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all group"
                        >
                          <span className="text-2xl">{partner.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold">{partner.name}</p>
                            <p className="text-sm text-muted-foreground">{partner.description}</p>
                            {partner.code && (
                              <p className="text-xs text-primary mt-1">Code: {partner.code}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Upload Proof */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">2</div>
                      <h3 className="text-lg font-semibold">Upload Purchase Proof</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="partner">Select Partner You Purchased From</Label>
                        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select partner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {affiliatePartners.map((partner) => (
                              <SelectItem key={partner.name} value={partner.name}>
                                {partner.icon} {partner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="promo">Promo Code Used (Optional)</Label>
                        <Input
                          id="promo"
                          placeholder="e.g., dc5afd84"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Upload Screenshot of Purchase</Label>
                        <div 
                          className="mt-2 border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {previewUrl ? (
                            <div className="space-y-3">
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-h-32 mx-auto rounded-lg"
                              />
                              <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                              <Button variant="outline" size="sm">
                                Change Image
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload screenshot (PNG, JPG, GIF - Max 5MB)
                              </p>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleUploadScreenshot}
                        disabled={uploading || !selectedPartner || !selectedFile}
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Submit for Verification
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        ⏱️ Verification typically takes 24-48 hours. You'll receive an email once approved.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What You Get */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    What You Get with Kickstarter (Free):
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      'Risk Management Plan (1 month)',
                      'Trading Signals (1 week)',
                      'Basic Risk Calculator',
                      'Phase Tracking Dashboard',
                      '3 Prop Firm Analyzers',
                      'Community Access',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-20">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-muted-foreground text-sm">OR BECOME AN AFFILIATE</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-6 rounded-2xl text-center">
                <p className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Your Affiliate Link */}
          {user && (
            <motion.div 
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="glass-card p-8 rounded-2xl text-center">
                <h2 className="text-2xl font-bold mb-4">Your Affiliate Link</h2>
                <div className="flex items-center gap-4 max-w-xl mx-auto">
                  <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-left overflow-hidden">
                    <code className="text-sm text-primary">{affiliateLink}</code>
                  </div>
                  <Button onClick={handleCopy} variant="outline" className="shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-center mb-12">Why Partner With Us?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="glass-card p-6 rounded-2xl text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/20 rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Commission Tiers */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">Commission Tiers</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              The more referrals you bring in, the higher your commission rate!
            </p>
            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl mx-auto">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 font-semibold">Tier</th>
                    <th className="text-left py-4 px-6 font-semibold">Active Referrals</th>
                    <th className="text-left py-4 px-6 font-semibold">Commission Rate</th>
                    <th className="text-left py-4 px-6 font-semibold">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier, index) => (
                    <tr key={tier.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          index === 0 ? 'bg-muted text-muted-foreground' :
                          index === 1 ? 'bg-amber-500/20 text-amber-500' :
                          index === 2 ? 'bg-slate-400/20 text-slate-400' :
                          index === 3 ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-purple-500/20 text-purple-500'
                        }`}>
                          {tier.name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{tier.referrals}</td>
                      <td className="py-4 px-6">
                        <span className="text-primary font-semibold">{tier.commission}</span>
                      </td>
                      <td className="py-4 px-6 text-accent">{tier.bonus || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Sign Up', description: 'Create your free affiliate account in under 2 minutes', icon: Users },
                { step: '02', title: 'Share Your Link', description: 'Promote TraderEdge Pro to your audience using your unique link', icon: TrendingUp },
                { step: '03', title: 'Earn Commissions', description: 'Get paid for every subscription your referrals make', icon: DollarSign },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="glass-card p-8 rounded-2xl text-center h-full">
                    <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                    <div className="w-14 h-14 mx-auto mb-4 bg-primary/20 rounded-xl flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="glass-card p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of affiliates already earning passive income with TraderEdge Pro.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="btn-glow px-8 py-6 text-lg" asChild>
                  <Link to={user ? '/dashboard' : '/auth'}>
                    {user ? 'View Your Dashboard' : 'Become an Affiliate'}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" asChild>
                  <Link to="/membership">
                    View Membership Plans
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AffiliateLinksPage;
