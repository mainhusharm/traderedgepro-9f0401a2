import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MT5Header from '@/components/layout/MT5Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MT5SigninPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) throw error;
      
      if (data?.user) {
        // Check portal type - if main website user, redirect them
        const { data: profile } = await supabase
          .from('profiles')
          .select('portal_type')
          .eq('user_id', data.user.id)
          .single();

        // Check if user has MT5 access
        const { data: mt5User } = await supabase
          .from('mt5_users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        // If user is from main portal and not MT5 - DO NOT convert them
        if (!mt5User && profile?.portal_type !== 'mt5') {
          toast.error('This account is registered for the main platform. Please sign up separately for MT5 Bots or use the main website.');
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }

        // Only allow access if user has MT5 record
        if (mt5User && mt5User.payment_verified) {
          toast.success('Welcome back!');
          navigate('/mt5-dashboard');
        } else if (mt5User) {
          toast.info('Please complete your payment to access the dashboard');
          navigate('/mt5-payment');
        } else {
          // User has mt5 portal type but no mt5_user record - create it
          await supabase.from('mt5_users').insert({
            user_id: data.user.id,
            plan_type: 'pending',
            is_active: false,
            payment_verified: false,
          });
          navigate('/mt5-payment');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
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
                <CardTitle className="text-2xl">MT5 Bot Access</CardTitle>
                <CardDescription>
                  Sign in to access your MT5 trading bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Access Dashboard'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Don't have a license?{' '}
                    <Link to="/mt5-signup" className="text-accent hover:underline">
                      Get MT5 Bot
                    </Link>
                  </p>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secured with 256-bit encryption</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Looking for the main platform?{' '}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in to TraderEdge Pro
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MT5SigninPage;
