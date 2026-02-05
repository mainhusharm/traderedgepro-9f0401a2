import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Mail, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccessPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hasQuestionnaire, setHasQuestionnaire] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending' | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        // Check questionnaire status
        const { data: questionnaireData } = await supabase
          .from('questionnaires')
          .select('id, completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!questionnaireData || !questionnaireData.completed) {
          setHasQuestionnaire(false);
          setTimeout(() => {
            navigate('/questionnaire');
          }, 3000);
        } else {
          setHasQuestionnaire(true);
        }

        // Check latest payment status
        const { data: paymentData } = await supabase
          .from('payments')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setPaymentStatus(paymentData?.status === 'completed' ? 'completed' : 'pending');
      } catch (error) {
        console.error('Error checking status:', error);
        setHasQuestionnaire(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading) {
      checkStatus();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Success Icon */}
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>

            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Welcome to TraderEdge Pro. Your trading journey starts now.
            </p>

            {/* Order Summary */}
            <Card className="bg-card/50 border-white/[0.08] mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono">#TE-{Date.now().toString(36).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-semibold ${paymentStatus === 'completed' ? 'text-success' : 'text-yellow-500'}`}>
                    {paymentStatus === 'completed' ? 'Completed ✓' : 'Pending Verification'}
                  </span>
                </div>
                {paymentStatus !== 'completed' && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                    <span className="text-muted-foreground">Note</span>
                    <span className="text-sm text-muted-foreground">
                      Your payment is being verified. This usually takes 24 hours.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto-redirect notice for users without questionnaire */}
            {hasQuestionnaire === false && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <p className="text-primary font-medium mb-2">
                  🚀 Redirecting to setup...
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to complete your trading profile in a few seconds.
                </p>
              </motion.div>
            )}

            {/* Next Steps */}
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-white/[0.08]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Check Your Email</p>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email with your receipt
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                hasQuestionnaire === false 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-card/50 border-white/[0.08]'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  hasQuestionnaire === false ? 'bg-primary/20' : 'bg-success/10'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${
                    hasQuestionnaire === false ? 'text-primary' : 'text-success'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="font-medium">
                    {hasQuestionnaire === false ? 'Complete Your Trading Profile' : 'Profile Completed ✓'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasQuestionnaire === false 
                      ? 'Fill out the questionnaire to personalize your experience'
                      : 'Your trading profile is already set up'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-white/[0.08]">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Start Trading</p>
                  <p className="text-sm text-muted-foreground">
                    Access signals and start your path to funded trading
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasQuestionnaire === false ? (
                <Link to="/questionnaire">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    Complete Setup Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
              {hasQuestionnaire !== false && (
                <Link to="/risk-management-plan">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Risk Management Plan
                  </Button>
                </Link>
              )}
            </div>

            {/* Support Note */}
            <p className="text-sm text-muted-foreground mt-8">
              Questions? Contact our support team at{' '}
              <a href="mailto:support@traderedge.com" className="text-primary hover:underline">
                support@traderedge.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PaymentSuccessPage;
