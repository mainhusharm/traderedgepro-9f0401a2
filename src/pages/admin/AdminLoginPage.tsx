import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/config/api';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || mpin.length !== 6) {
      toast.error('Please enter both password and 6-digit MPIN');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await authApi.validateAdminAccess(password, mpin);
      if (error) throw error;

      if (data.success) {
        // Store admin session in sessionStorage (cleared when browser closes)
        sessionStorage.setItem('admin_session', JSON.stringify({
          token: data.token,
          expiresAt: data.expiresAt
        }));
        
        toast.success('Access granted!');
        navigate('/admin');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Failed to verify credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-risk/10 via-transparent to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-background/80 backdrop-blur-xl border-risk/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-risk to-orange-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-risk">Admin Access</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="bg-white/5 border-white/10 pr-10"
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

              {/* MPIN Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  6-Digit MPIN
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={mpin}
                    onChange={(value) => setMpin(value)}
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
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-risk to-orange-500 hover:from-risk/90 hover:to-orange-500/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Access Dashboard
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Unauthorized access attempts are logged
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
