import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Shield, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { callEdgeFunction } from '@/config/api';

const PAYPAL_CLIENT_ID = "Adhub7PVj7wX5Fey5aNEouD7GHn0Q5MsUgchDYzDb-db3SMiKYSZkZo3-OXQhbHMvfH_evVmqYUQksJo";

interface PayPalPaymentProps {
  amount: number;
  planName: string;
  onPaymentComplete: (transactionId: string, payerEmail: string) => void;
  onBack: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalPayment = ({ amount, planName, onPaymentComplete, onBack }: PayPalPaymentProps) => {
  const [showWarningModal, setShowWarningModal] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [noDisputeAccepted, setNoDisputeAccepted] = useState(false);
  const [step, setStep] = useState<'warning' | 'pay'>('warning');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load PayPal SDK
  useEffect(() => {
    if (step !== 'pay') return;

    const existingScript = document.getElementById('paypal-sdk');
    if (existingScript) {
      if (window.paypal) {
        setSdkLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      toast.error('Failed to load PayPal. Please try again.');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup is handled by keeping the script for reuse
    };
  }, [step]);

  // Render PayPal buttons when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !window.paypal || step !== 'pay') return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Clear previous buttons
    container.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 50,
      },
      createOrder: async () => {
        try {
          setIsProcessing(true);
          const { data, error } = await callEdgeFunction('paypal-create-order', { amount, planName });

          if (error) throw error;
          if (!data?.orderId) throw new Error('Failed to create order');

          return data.orderId;
        } catch (error: any) {
          console.error('Create order error:', error);
          toast.error(error.message || 'Failed to create PayPal order');
          throw error;
        } finally {
          setIsProcessing(false);
        }
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          setIsProcessing(true);
          const { data: captureData, error } = await callEdgeFunction('paypal-capture-order', { orderId: data.orderID });

          if (error) throw error;
          if (!captureData?.success) throw new Error('Failed to capture payment');

          toast.success('Payment successful! Thank you for your purchase.');
          onPaymentComplete(captureData.transactionId, captureData.payerEmail);
        } catch (error: any) {
          console.error('Capture error:', error);
          toast.error(error.message || 'Payment failed. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast.error('PayPal encountered an error. Please try again.');
        setIsProcessing(false);
      },
      onCancel: () => {
        toast.info('Payment cancelled');
        setIsProcessing(false);
      },
    }).render('#paypal-button-container');
  }, [sdkLoaded, step, amount, planName, onPaymentComplete]);

  const handleProceedToPayment = () => {
    if (!termsAccepted || !noDisputeAccepted) {
      toast.error('Please accept both checkboxes to proceed');
      return;
    }
    setShowWarningModal(false);
    setStep('pay');
  };

  return (
    <div className="space-y-6">
      {/* Warning Modal */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-6 h-6" />
              Important Notice - PayPal Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-foreground font-medium mb-2">
                TraderEdge is a DIGITAL SERVICE delivered INSTANTLY
              </p>
              <p className="text-sm text-muted-foreground">
                By proceeding with PayPal payment, you acknowledge and agree to our 
                <strong> NO REFUND POLICY</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <h4 className="font-semibold text-destructive flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Dispute Warning
                </h4>
                <p className="text-sm text-muted-foreground">
                  Filing a PayPal dispute after receiving access to our services is considered <strong>FRAUD</strong>. 
                  We maintain comprehensive records of:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Your terms acceptance (timestamp & IP)</li>
                  <li>• Login history and activity logs</li>
                  <li>• Signals received and dashboard access</li>
                  <li>• Payment confirmation details</li>
                </ul>
                <p className="text-sm text-destructive mt-2 font-medium">
                  Fraudulent disputes result in account termination and potential legal action.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox 
                    id="terms-accept" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <Label htmlFor="terms-accept" className="text-sm text-muted-foreground cursor-pointer">
                    I have read and accept the{' '}
                    <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/refund-policy" target="_blank" className="text-primary hover:underline">Refund Policy</Link>
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox 
                    id="no-dispute" 
                    checked={noDisputeAccepted}
                    onCheckedChange={(checked) => setNoDisputeAccepted(checked as boolean)}
                  />
                  <Label htmlFor="no-dispute" className="text-sm text-muted-foreground cursor-pointer">
                    I understand this is a digital service delivered instantly, and I will NOT file 
                    a dispute after receiving access to the service
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleProceedToPayment} 
                className="flex-1"
                disabled={!termsAccepted || !noDisputeAccepted}
              >
                I Understand, Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">
        {step === 'pay' && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Pay with PayPal</h3>
              <p className="text-muted-foreground text-sm">
                Complete your payment of <span className="text-primary font-bold">${amount}</span> for {planName}
              </p>
            </div>

            {/* Terms Reminder */}
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-warning">
                  <strong>Remember:</strong> All sales are final. By completing this payment, you accept 
                  our no-refund policy. Fraudulent disputes will result in account termination.
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary text-xl">${amount}</span>
              </div>
            </div>

            {/* PayPal Button Container */}
            <div className="min-h-[120px]">
              {!sdkLoaded ? (
                <div className="flex items-center justify-center h-[120px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading PayPal...</span>
                </div>
              ) : (
                <div id="paypal-button-container" className="min-h-[50px]"></div>
              )}
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                <span className="text-sm">Processing payment...</span>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your payment is processed securely through PayPal. We never see or store your payment details.
              </p>
            </div>

            <Button variant="outline" onClick={onBack} className="w-full">
              Back to Payment Methods
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayPalPayment;
