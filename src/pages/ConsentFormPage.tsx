import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserConsent } from '@/hooks/useUserConsent';

const ConsentFormPage = () => {
  const navigate = useNavigate();
  const { signConsent, hasSignedConsent } = useUserConsent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    riskDisclosure: false,
    electronicSignature: false,
  });

  const allConsented = Object.values(consents).every(Boolean);

  const handleSubmit = async () => {
    if (!allConsented) {
      toast.error('Please accept all terms to continue');
      return;
    }

    setIsSubmitting(true);
    try {
      await signConsent(consents);
      toast.success('Terms accepted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing consent:', error);
      toast.error('Failed to save consent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already signed, redirect
  if (hasSignedConsent) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto p-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 mb-6">
            <Shield className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl tracking-tight mb-3">
            <span className="font-light text-white/50">Legal</span>{' '}
            <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Agreements</span>
          </h1>
          <p className="text-white/40 font-light">Please review and accept the following terms to access trading signals</p>
        </motion.div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 rounded-md border border-white/10 p-4 mb-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>By using TradingNexus, you agree to these terms of service. Our platform provides trading signals and educational content for informational purposes only.</p>
                  <p>You acknowledge that trading involves significant risk and past performance does not guarantee future results. You are solely responsible for your trading decisions.</p>
                  <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of any changes.</p>
                  <p>You must be at least 18 years old to use this service. Users are responsible for ensuring compliance with their local laws regarding trading and financial services.</p>
                </div>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={consents.terms}
                  onCheckedChange={(checked) => setConsents(prev => ({ ...prev, terms: !!checked }))}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  I have read and agree to the Terms of Service
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 rounded-md border border-white/10 p-4 mb-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>We collect and process your personal data to provide our services. This includes your name, email, trading preferences, and activity data.</p>
                  <p>Your data is encrypted and stored securely. We do not sell your personal information to third parties.</p>
                  <p>You have the right to access, correct, or delete your personal data at any time by contacting support.</p>
                  <p>We may use anonymized data for analytics and improving our services. You can opt out of marketing communications at any time.</p>
                </div>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={consents.privacy}
                  onCheckedChange={(checked) => setConsents(prev => ({ ...prev, privacy: !!checked }))}
                />
                <label htmlFor="privacy" className="text-sm cursor-pointer">
                  I have read and agree to the Privacy Policy
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-warning/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Shield className="w-5 h-5" />
                Risk Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 rounded-md border border-warning/20 p-4 mb-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-semibold text-warning">IMPORTANT RISK WARNING:</p>
                  <p>Trading forex, futures, and other financial instruments carries a high level of risk and may not be suitable for all investors.</p>
                  <p>The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.</p>
                  <p>You could lose more than your initial investment. Only trade with money you can afford to lose.</p>
                  <p>Our signals and analysis are educational tools and not financial advice. Always do your own research before making any trading decisions.</p>
                  <p>Past performance is not indicative of future results. No representation is being made that any account will or is likely to achieve profits or losses similar to those discussed.</p>
                </div>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="riskDisclosure"
                  checked={consents.riskDisclosure}
                  onCheckedChange={(checked) => setConsents(prev => ({ ...prev, riskDisclosure: !!checked }))}
                />
                <label htmlFor="riskDisclosure" className="text-sm cursor-pointer">
                  I understand and accept the risks involved in trading
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Electronic Signature Agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                By checking this box, you agree that your electronic signature is legally binding and equivalent to a handwritten signature. 
                This consent will be recorded with your IP address and timestamp for legal purposes.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="electronicSignature"
                  checked={consents.electronicSignature}
                  onCheckedChange={(checked) => setConsents(prev => ({ ...prev, electronicSignature: !!checked }))}
                />
                <label htmlFor="electronicSignature" className="text-sm cursor-pointer">
                  I agree to use electronic signatures and confirm all information is accurate
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={!allConsented || isSubmitting}
            className="w-full btn-glow"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept All & Access Signals
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentFormPage;
