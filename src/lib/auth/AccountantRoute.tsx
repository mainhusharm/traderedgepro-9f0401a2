import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { callEdgeFunction } from '@/config/api';
import { Calculator } from 'lucide-react';

interface AccountantRouteProps {
  children: ReactNode;
}

const SESSION_KEY = 'accountant_session';

export const AccountantRoute = ({ children }: AccountantRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      const { token, expiresAt } = JSON.parse(session);
      if (Date.now() < expiresAt && typeof token === 'string' && token.length > 0) {
        setIsAuthenticated(true);
        return;
      }
      localStorage.removeItem(SESSION_KEY);
    }
    setIsAuthenticated(false);

    const lockout = localStorage.getItem('accountant_lockout');
    if (lockout) {
      const lockoutEnd = parseInt(lockout);
      if (Date.now() < lockoutEnd) {
        setIsLocked(true);
        setLockoutEndTime(lockoutEnd);
      } else {
        localStorage.removeItem('accountant_lockout');
      }
    }
  }, []);

  useEffect(() => {
    if (isLocked && lockoutEndTime) {
      const interval = setInterval(() => {
        if (Date.now() >= lockoutEndTime) {
          setIsLocked(false);
          setLockoutEndTime(null);
          setAttempts(0);
          localStorage.removeItem('accountant_lockout');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockoutEndTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await callEdgeFunction('validate-accountant-access', { mpin: pin });

      if (fnError) throw fnError;

      if (data?.success) {
        const session = {
          token: data.token,
          expiresAt: new Date(data.expiresAt).getTime(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        setError('');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(`Invalid PIN. ${5 - newAttempts} attempts remaining.`);
        setPin('');

        if (newAttempts >= 5) {
          const lockoutEnd = Date.now() + 30 * 60 * 1000;
          localStorage.setItem('accountant_lockout', lockoutEnd.toString());
          setIsLocked(true);
          setLockoutEndTime(lockoutEnd);
          setError('Too many failed attempts. Locked for 30 minutes.');
        }
      }
    } catch (err) {
      console.error('Accountant auth error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!lockoutEndTime) return '';
    const remaining = Math.max(0, lockoutEndTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-500/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Accountant Dashboard</h1>
              <p className="text-muted-foreground mt-2">Enter your 6-digit MPIN to access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit MPIN"
                  disabled={isLocked}
                  className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg">
                  {error}
                  {isLocked && <span className="block mt-1 font-mono">{formatTimeRemaining()}</span>}
                </div>
              )}

              <button
                type="submit"
                disabled={pin.length !== 6 || isLocked || isLoading}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : isLocked ? 'Locked' : 'Access Dashboard'}
              </button>
            </form>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const useAccountantLogout = () => {
  const navigate = useNavigate();
  
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    navigate('/accountant');
  };
  
  return logout;
};
