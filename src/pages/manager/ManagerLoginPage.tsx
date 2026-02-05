import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Users, Mail, Loader2, CheckCircle2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Step = 'email' | 'otp' | 'success';

const ManagerLoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [managerInfo, setManagerInfo] = useState<{ name?: string; maskedEmail?: string } | null>(null);
  const [validatingSession, setValidatingSession] = useState(true);

  // Check for existing valid session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const sessionToken = sessionStorage.getItem('manager_session_token');
      if (sessionToken) {
        try {
          const { data, error } = await supabase.functions.invoke('validate-manager-session', {
            body: { sessionToken }
          });
          
          if (!error && data?.valid) {
            navigate('/manager/dashboard', { replace: true });
            return;
          } else {
            sessionStorage.removeItem('manager_session_token');
            sessionStorage.removeItem('manager_info');
          }
        } catch (err) {
          console.error('Session validation error:', err);
        }
      }
      setValidatingSession(false);
    };

    checkExistingSession();
  }, [navigate]);

  const handleSendOTP = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manager-send-otp', {
        body: { email }
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to send OTP');
        return;
      }

      setManagerInfo({
        name: data.managerName,
        maskedEmail: data.maskedEmail
      });
      
      setStep('otp');
      toast.success('OTP sent to your email');
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manager-verify-otp', {
        body: { email, otp }
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid OTP');
        return;
      }

      // Store session
      sessionStorage.setItem('manager_session_token', data.sessionToken);
      sessionStorage.setItem('manager_info', JSON.stringify(data.manager));
      
      setStep('success');
      toast.success('Login successful!');
      
      setTimeout(() => {
        navigate('/manager/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (validatingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-muted-foreground">Validating your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-purple-500/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              {step === 'success' ? (
                <CheckCircle2 className="h-8 w-8 text-white" />
              ) : step === 'otp' ? (
                <Mail className="h-8 w-8 text-white" />
              ) : (
                <Crown className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {step === 'success' 
                ? 'Welcome!' 
                : step === 'otp' 
                  ? 'Enter Verification Code' 
                  : 'Manager Portal'}
            </CardTitle>
            <CardDescription>
              {step === 'success' 
                ? `Logged in as ${managerInfo?.name || 'Manager'}`
                : step === 'otp' 
                  ? `We sent a code to ${managerInfo?.maskedEmail || 'your email'}`
                  : 'Enter your email to access the manager dashboard'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="manager@traderedgepro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500" 
                  onClick={handleSendOTP}
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Login Code
                    </>
                  )}
                </Button>
              </div>
            )}

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
                      <InputOTPSlot index={0} className="bg-white/5 border-white/10" />
                      <InputOTPSlot index={1} className="bg-white/5 border-white/10" />
                      <InputOTPSlot index={2} className="bg-white/5 border-white/10" />
                      <InputOTPSlot index={3} className="bg-white/5 border-white/10" />
                      <InputOTPSlot index={4} className="bg-white/5 border-white/10" />
                      <InputOTPSlot index={5} className="bg-white/5 border-white/10" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500" 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm text-muted-foreground"
                    onClick={() => {
                      setOtp('');
                      handleSendOTP();
                    }}
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
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <Users className="inline w-3 h-3 mr-1" />
            Manager access only. Contact admin for account setup.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ManagerLoginPage;
