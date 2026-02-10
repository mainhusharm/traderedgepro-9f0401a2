import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Mail, Lock, User, ArrowRight, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MT5Header from '@/components/layout/MT5Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MT5SignupPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    mt5Account: '',
    agreeTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      // First check if this email already exists for a main platform user
      const { data: existingSession } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (existingSession?.user) {
        // Check if this is a main platform user
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('portal_type')
          .eq('user_id', existingSession.user.id)
          .single();

        const { data: existingMt5User } = await supabase
          .from('mt5_users')
          .select('id')
          .eq('user_id', existingSession.user.id)
          .single();

        if (existingProfile && existingProfile.portal_type !== 'mt5' && !existingMt5User) {
          await supabase.auth.signOut();
          toast.error('This email is already registered for the main platform. Please use a different email for MT5 Bots.');
          setIsLoading(false);
          return;
        }

        // User already has MT5 access
        if (existingMt5User) {
          toast.info('Account already exists! Redirecting to dashboard...');
          navigate('/mt5-dashboard');
          return;
        }
      }

      // Sign out if we signed in for checking
      await supabase.auth.signOut();

      // Create new MT5 account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/mt5-payment`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            mt5_account: formData.mt5Account,
            portal_type: 'mt5',
          }
        }
      });

      if (error) {
        // If user already exists error, give clear message
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast.error('An account with this email already exists. Please sign in instead.');
          navigate('/mt5-signin');
          return;
        }
        throw error;
      }

      if (data.user) {
        // Create profile with MT5 portal type - use insert to avoid conflicts
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          portal_type: 'mt5',
          agree_to_terms: formData.agreeTerms,
        });

        // If profile already exists, it means user existed - don't modify
        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Profile creation error:', profileError);
        }

        // Create MT5 user record
        await supabase.from('mt5_users').insert({
          user_id: data.user.id,
          plan_type: 'pending',
          is_active: false,
          payment_verified: false,
        });
      }

      toast.success('Account created! Please check your email to verify, then proceed to payment.');
      navigate('/mt5-payment');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <MT5Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-card/50 border-white/[0.08]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">Get Your MT5 Bot</CardTitle>
                <CardDescription>
                  Create an account to get started with automated trading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt5Account">MT5 Account Number (Optional)</Label>
                    <Input
                      id="mt5Account"
                      placeholder="12345678"
                      value={formData.mt5Account}
                      onChange={(e) => setFormData({ ...formData, mt5Account: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, agreeTerms: checked as boolean })
                      }
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Continue to Payment'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/mt5-signin" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MT5SignupPage;
