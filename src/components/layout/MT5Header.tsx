import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthContext';

const MT5Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '/mt5-bots#features' },
    { label: 'Pricing', href: '/mt5-bots#pricing' },
    { label: 'How It Works', href: '/mt5-bots#how-it-works' },
    { label: 'FAQ', href: '/mt5-bots#faq' },
    { label: 'Main Site', href: '/' },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (window.location.pathname === path || path === '/mt5-bots') {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    }
    navigate(href);
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-white/[0.08]' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/mt5-bots" className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-accent/20 rounded-xl blur-lg" />
                <div className="relative w-full h-full bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold">
                <span className="text-accent">MT5</span>
                <span className="text-foreground"> Bots</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/mt5-dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline"
                  className="border-white/20"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/mt5-signin')}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-accent hover:bg-accent/90 text-white font-semibold px-6"
                  onClick={() => navigate('/mt5-signup')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/[0.08]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2 text-lg text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08]">
                {user ? (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center"
                      onClick={() => { navigate('/mt5-dashboard'); setIsMobileMenuOpen(false); }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center"
                      onClick={() => { navigate('/mt5-signin'); setIsMobileMenuOpen(false); }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="bg-accent hover:bg-accent/90 w-full justify-center text-white font-semibold"
                      onClick={() => { navigate('/mt5-signup'); setIsMobileMenuOpen(false); }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default MT5Header;
