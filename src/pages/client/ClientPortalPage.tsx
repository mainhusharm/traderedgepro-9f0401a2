import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Shield, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { callEdgeFunction } from '@/config/api';

type Step = 'loading' | 'verify' | 'otp' | 'success' | 'error';

interface ClientInfo {
  name?: string;
  maskedEmail?: string;
  agentName?: string;
}

const ClientPortalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('token');
  
  const [step, setStep] = useState<Step>('loading');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Check for existing valid session or validate token
  useEffect(() => {
    const initialize = async () => {
      // First check for existing session
      const sessionToken = sessionStorage.getItem('client_session_token');
      if (sessionToken) {
        try {
          const { data, error } = await callEdgeFunction('validate-client-session', { sessionToken });
          
          if (!error && data?.valid) {
            sessionStorage.setItem('client_info', JSON.stringify(data.client));
            navigate('/client/dashboard', { replace: true });
            return;
          } else {
            sessionStorage.removeItem('client_session_token');
            sessionStorage.removeItem('client_info');
          }
        } catch (err) {
          console.error('Session validation error:', err);
        }
      }

      // If no valid session, check for access token
      if (!accessToken) {
        setErrorMessage('No access token provided. Please use the link sent to you.');
        setStep('error');
        return;
      }

      // Send OTP automatically
      try {
        const { data, error } = await callEdgeFunction('client-send-otp', { accessToken });

        if (error || !data?.success) {
          setErrorMessage(data?.error || 'Invalid access link. Please contact your agent.');
          setStep('error');
          return;
        }

        setClientInfo({
          name: data.clientName,
          maskedEmail: data.maskedEmail
        });
        setStep('otp');
        toast.success('Verification code sent to your email');
      } catch (err) {
        console.error('Error sending OTP:', err);
        setErrorMessage('Failed to verify access link. Please try again.');
        setStep('error');
      }
    };

    initialize();
  }, [accessToken, navigate]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await callEdgeFunction('client-verify-otp', { accessToken, otp });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid verification code');
        return;
      }

      // Store session
      sessionStorage.setItem('client_session_token', data.sessionToken);
      sessionStorage.setItem('client_info', JSON.stringify(data.client));
      
      setClientInfo(prev => ({ ...prev, agentName: data.client.agentName }));
      setStep('success');
      toast.success('Verification successful!');
      
      // Navigate after brief delay
      setTimeout(() => {
        navigate('/client/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast.error('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setOtp('');
    
    try {
      const { data, error } = await callEdgeFunction('client-send-otp', { accessToken });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to resend code');
        return;
      }

      toast.success('New verification code sent');
    } catch (err) {
      console.error('Error resending OTP:', err);
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step === 'success' ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : step === 'error' ? (
                <AlertCircle className="h-8 w-8 text-destructive" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'success' 
                ? 'Welcome!' 
                : step === 'error'
                  ? 'Access Error'
                  : 'Verify Your Identity'}
            </CardTitle>
            <CardDescription>
              {step === 'success' 
                ? `Welcome${clientInfo?.name ? `, ${clientInfo.name}` : ''}!`
                : step === 'error'
                  ? errorMessage
                  : `Enter the code sent to ${clientInfo?.maskedEmail || 'your email'}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'otp' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm text-muted-foreground"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Didn't receive the code? Resend
                  </Button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </motion.div>
                <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {step === 'error' && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-muted-foreground">
                  If you believe this is an error, please contact your agent for a new access link.
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Go to Homepage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ClientPortalPage;
