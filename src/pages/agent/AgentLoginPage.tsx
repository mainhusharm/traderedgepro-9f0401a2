import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Shield, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Step = 'email' | 'otp' | 'success';

const AgentLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentInfo, setAgentInfo] = useState<{ name?: string; maskedEmail?: string } | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [invitationProcessed, setInvitationProcessed] = useState(false);

  // Check for existing valid session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const sessionToken = sessionStorage.getItem('agent_session_token');
      if (sessionToken) {
        try {
          const { data, error } = await supabase.functions.invoke('validate-agent-session', {
            body: { sessionToken }
          });
          
          if (!error && data?.valid) {
            navigate('/agent/dashboard', { replace: true });
            return;
          } else {
            // Clear invalid session
            sessionStorage.removeItem('agent_session_token');
            sessionStorage.removeItem('agent_info');
          }
        } catch (err) {
          console.error('Session validation error:', err);
        }
      }
      setValidatingToken(false);
    };

    checkExistingSession();
  }, [navigate]);

  // If invitation token, auto-send OTP after session check is complete
  useEffect(() => {
    if (!validatingToken && invitationToken && !invitationProcessed) {
      setInvitationProcessed(true);
      handleSendOTP(true);
    }
  }, [invitationToken, validatingToken, invitationProcessed]);

  const handleSendOTP = async (isInvitation = false) => {
    if (!isInvitation && !email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const body: { email?: string; invitationToken?: string } = {};
      
      if (isInvitation && invitationToken) {
        body.invitationToken = invitationToken;
      } else {
        body.email = email;
      }

      const { data, error } = await supabase.functions.invoke('agent-send-otp', {
        body
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to send OTP');
        return;
      }

      setAgentInfo({
        name: data.agentName,
        maskedEmail: data.maskedEmail
      });
      
      if (isInvitation) {
        setEmail(data.maskedEmail || '');
      }
      
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
      const body: { email: string; otp: string; invitationToken?: string } = {
        email: agentInfo?.maskedEmail?.includes('***') 
          ? email 
          : email,
        otp
      };
      
      if (invitationToken) {
        body.invitationToken = invitationToken;
      }

      const { data, error } = await supabase.functions.invoke('agent-verify-otp', {
        body
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid OTP');
        return;
      }

      // Store session
      sessionStorage.setItem('agent_session_token', data.sessionToken);
      sessionStorage.setItem('agent_info', JSON.stringify(data.agent));
      
      setStep('success');
      toast.success('Login successful!');
      
      // Navigate after brief delay to show success
      setTimeout(() => {
        navigate('/agent/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp('');
    handleSendOTP(!!invitationToken);
  };

  if (validatingToken || (invitationToken && !invitationProcessed)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {invitationToken ? 'Verifying your invitation...' : 'Validating your session...'}
          </p>
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
              ) : step === 'otp' ? (
                <Mail className="h-8 w-8 text-primary" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'success' 
                ? 'Welcome!' 
                : step === 'otp' 
                  ? 'Enter Verification Code' 
                  : 'Agent Portal'}
            </CardTitle>
            <CardDescription>
              {step === 'success' 
                ? `Logged in as ${agentInfo?.name || 'Agent'}`
                : step === 'otp' 
                  ? `We sent a code to ${agentInfo?.maskedEmail || 'your email'}`
                  : invitationToken 
                    ? 'Verifying your invitation...'
                    : 'Enter your email to receive a login code'}
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
                    placeholder="agent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleSendOTP()}
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
                    'Verify & Login'
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
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AgentLoginPage;
