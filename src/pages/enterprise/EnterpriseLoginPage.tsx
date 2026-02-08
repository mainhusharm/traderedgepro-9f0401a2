import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ENTERPRISE_CREDENTIALS, createEnterpriseSession, DashboardRole } from '@/lib/auth/EnterpriseDashboardRoute';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const EnterpriseLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/enterprise';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate credentials
      if (password !== ENTERPRISE_CREDENTIALS.password || mpin !== ENTERPRISE_CREDENTIALS.mpin) {
        toast.error('Invalid credentials', {
          description: 'Please check your password and MPIN'
        });
        setIsLoading(false);
        return;
      }

      // Create session with full access (admin gets all roles)
      const roles: DashboardRole[] = ['operations', 'financial', 'support', 'sales', 'executive', 'admin'];
      createEnterpriseSession(roles);

      toast.success('Access granted', {
        description: 'Welcome to Enterprise Dashboards'
      });

      // Navigate to the requested page or enterprise landing
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setMpin(value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-primary/20">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Enterprise Access</CardTitle>
              <CardDescription>
                Enter your credentials to access enterprise dashboards
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="bg-white/5 border-white/10 pr-10"
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

                <div className="space-y-2">
                  <Label htmlFor="mpin" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    MPIN (6 digits)
                  </Label>
                  <Input
                    id="mpin"
                    type="password"
                    value={mpin}
                    onChange={handleMpinChange}
                    placeholder="Enter 6-digit MPIN"
                    className="bg-white/5 border-white/10 text-center tracking-widest text-lg"
                    maxLength={6}
                    required
                  />
                  <div className="flex justify-center gap-1 mt-2">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          i < mpin.length ? 'bg-primary' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || password.length < 6 || mpin.length < 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Access Dashboards
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    This area is restricted to authorized personnel only.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default EnterpriseLoginPage;
