import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, Bot, Gift, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // OTP Login States
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get plan and referral from URL params
  const searchParams = new URLSearchParams(location.search);
  const planName = searchParams.get('plan');
  const planPrice = searchParams.get('price');
  const billingPeriod = searchParams.get('billing') || 'monthly';
  const referralCode = searchParams.get('ref');
  const agentInviteToken = searchParams.get('agent_invite');

  // Auto-switch to signup if plan is in URL
  useEffect(() => {
    if (planName && !user) {
      setIsSignUp(true);
    }
  }, [planName, user]);

  useEffect(() => {
    const checkUserPortal = async () => {
      if (user) {
        // Handle agent invitation acceptance
        if (agentInviteToken) {
          try {
            // Find the agent invitation and link to current user
            const { data: agentInvite, error: inviteError } = await supabase
              .from('admin_agents')
              .select('*')
              .eq('invitation_token', agentInviteToken)
              .eq('status', 'pending')
              .single();

            if (agentInvite && !inviteError) {
              // Update agent record to link with user
              const { error: updateError } = await supabase
                .from('admin_agents')
                .update({
                  user_id: user.id,
                  status: 'active',
                  invitation_accepted_at: new Date().toISOString()
                })
                .eq('id', agentInvite.id);

              if (!updateError) {
                toast({
                  title: "Welcome, Agent!",
                  description: "Your invitation has been accepted. Redirecting to agent dashboard...",
                });
                navigate('/agent', { replace: true });
                return;
              }
            }
          } catch (error) {
            console.error('Error processing agent invite:', error);
          }
        }

        // Check if user is an agent
        const { data: agentData } = await supabase
          .from('admin_agents')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (agentData) {
          navigate('/agent', { replace: true });
          return;
        }

        // Check if this user is an MT5 user - if so, redirect them to MT5 portal
        const { data: mt5User } = await supabase
          .from('mt5_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('portal_type')
          .eq('user_id', user.id)
          .single();

        if (mt5User || profile?.portal_type === 'mt5') {
          toast({
            title: "Wrong Portal",
            description: "This account is registered for MT5 Bots. Redirecting...",
          });
          navigate('/mt5-dashboard', { replace: true });
          return;
        }

        // If user just signed up with a plan, redirect to payment
        if (planName) {
          navigate(`/payment-flow?plan=${planName}&price=${planPrice}&billing=${billingPeriod}`, { replace: true });
          return;
        }

        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    };

    checkUserPortal();
  }, [user, navigate, location, toast, planName, planPrice, billingPeriod, agentInviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (!agreeToTerms) {
          toast({
            title: "Terms required",
            description: "Please agree to the terms and conditions.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { error, data } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          country: country,
          selected_plan: planName,
          plan_price: planPrice,
          referral_code: referralCode
        });

        if (error) throw error;

        // If referred, update profile with referrer
        if (referralCode && data?.user) {
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('referral_code', referralCode)
            .single();

          if (referrerProfile) {
            await supabase
              .from('profiles')
              .update({ referred_by: referrerProfile.user_id })
              .eq('user_id', data.user.id);
          }
        }

        toast({
          title: "Account created!",
          description: "Welcome to Trader Edge Pro.",
        });

        // Redirect to payment flow if plan selected, otherwise questionnaire
        if (planName) {
          navigate(`/payment-flow?plan=${planName}&price=${planPrice}&billing=${billingPeriod}`);
        } else {
          navigate('/questionnaire');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;

        // After successful sign in, check portal type
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        
        if (signedInUser) {
          const { data: mt5User } = await supabase
            .from('mt5_users')
            .select('*')
            .eq('user_id', signedInUser.id)
            .single();

          const { data: profile } = await supabase
            .from('profiles')
            .select('portal_type')
            .eq('user_id', signedInUser.id)
            .single();

          if (mt5User || profile?.portal_type === 'mt5') {
            toast({
              title: "Wrong Portal",
              description: "This account is registered for MT5 Bots. Please use the MT5 sign in page.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            navigate('/mt5-signin');
            return;
          }
        }

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await callEdgeFunction('send-otp', { email: otpEmail });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "Code sent!",
        description: "Check your email for the 6-digit code.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setOtpLoading(true);
    try {
      const { data, error } = await callEdgeFunction('verify-otp', { email: otpEmail, otp: otpCode });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.userExists && data.session) {
        // User exists, set the session directly
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setSessionError) throw setSessionError;

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
        
        navigate('/dashboard');
      } else {
        // User doesn't exist, redirect to signup
        toast({
          title: "Account not found",
          description: "Please sign up to create an account.",
        });
        setShowOtpLogin(false);
        setIsSignUp(true);
        setEmail(otpEmail);
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code. Please request a new one.",
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP Login View
  if (showOtpLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Button
            variant="ghost"
            onClick={() => {
              setShowOtpLogin(false);
              setOtpSent(false);
              setOtpCode('');
            }}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>

          <div className="glass-card p-8 rounded-2xl backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Sign in with OTP</h2>
            <p className="text-muted-foreground text-center mb-8">
              {otpSent ? 'Enter the 6-digit code sent to your email' : 'We\'ll send you a one-time code'}
            </p>

            {!otpSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otpEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otpEmail"
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="trader@example.com"
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otpCode">Verification Code</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest bg-white/5 border-white/10"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Sign In'}
                </Button>

                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Didn't receive the code? Try again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Referral notice */}
        {referralCode && (
          <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm text-success flex items-center gap-2">
              <Gift className="w-4 h-4" />
              You were referred by a friend!
            </p>
          </div>
        )}

        {/* Plan display */}
        {planName && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Selected Plan</p>
            <p className="text-lg font-semibold text-primary capitalize">{planName} - ${planPrice}/{billingPeriod === 'yearly' ? 'year' : 'mo'}</p>
          </div>
        )}

        <div className="glass-card p-8 rounded-2xl backdrop-blur-xl border border-white/10">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">TE</span>
            </div>
            <span className="ml-3 text-xl font-bold">Trader Edge Pro</span>
          </div>

          {/* Toggle */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isSignUp ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isSignUp ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="pl-10 bg-white/5 border-white/10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="pl-10 bg-white/5 border-white/10"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., United States, India, UK"
                      className="pl-10 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="pl-10 bg-white/5 border-white/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white/5 border-white/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    I agree to the{' '}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* OTP Login Option */}
          {!isSignUp && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowOtpLogin(true)}
                className="w-full mt-4"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Sign in with OTP
              </Button>
            </div>
          )}

          {/* MT5 Portal Link */}
          <div className="mt-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Looking for MT5 Bots?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              If you have an MT5 Bot account, please use the dedicated portal.
            </p>
            <Link to="/mt5-signin" className="text-xs text-accent hover:underline">
              Go to MT5 Bot Portal →
            </Link>
          </div>

          {/* Security notice */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-3 h-3 text-success" />
            256-bit SSL encryption
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
