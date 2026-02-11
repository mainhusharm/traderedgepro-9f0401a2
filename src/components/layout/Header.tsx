import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, Moon, BellOff, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthContext';
import { notificationService, type QuietHoursConfig } from '@/services/notificationService';
import LogoSceneAntimatter from '@/components/canvas/LogoSceneAntimatter';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDNDMenu, setShowDNDMenu] = useState(false);
  const [quietHours, setQuietHours] = useState<QuietHoursConfig>({ enabled: false, startTime: '22:00', endTime: '07:00', days: [] });
  const [isDNDActive, setIsDNDActive] = useState(false);
  const dndMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the old landing page for legacy styling
  const isLegacyPage = location.pathname === '/anti';

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifications) => {
      setUnreadCount(notifications.filter(n => !n.read).length);
    });
    setQuietHours(notificationService.getQuietHours());
    return unsubscribe;
  }, []);

  // Check if currently in quiet hours
  useEffect(() => {
    const checkQuietHours = () => {
      const qh = notificationService.getQuietHours();
      if (!qh.enabled) {
        setIsDNDActive(false);
        return;
      }
      const now = new Date();
      const currentDay = now.getDay();
      if (!qh.days.includes(currentDay)) {
        setIsDNDActive(false);
        return;
      }
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = qh.startTime.split(':').map(Number);
      const [endHour, endMin] = qh.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (startMinutes > endMinutes) {
        setIsDNDActive(currentTime >= startMinutes || currentTime < endMinutes);
      } else {
        setIsDNDActive(currentTime >= startMinutes && currentTime < endMinutes);
      }
    };
    checkQuietHours();
    const interval = setInterval(checkQuietHours, 60000);
    return () => clearInterval(interval);
  }, [quietHours]);

  // Close DND menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dndMenuRef.current && !dndMenuRef.current.contains(e.target as Node)) {
        setShowDNDMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Our Approach', href: '/methodology' },
    { label: 'Features', href: '/features' },
    { label: 'Results', href: '/case-studies' },
    { label: 'MT5 Bots', href: '/mt5-bots' },
    { label: 'Prop Firms', href: '/prop-comparison' },
    { label: 'Pricing', href: '/membership' },
    { label: 'FAQ', href: '/faq' },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const element = document.querySelector(href.replace('/', ''));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
  };

  const toggleQuickDND = () => {
    const current = notificationService.getQuietHours();
    if (current.enabled) {
      notificationService.setQuietHours({ ...current, enabled: false });
      setQuietHours({ ...current, enabled: false });
    } else {
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000);
      const startTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
      const newConfig: QuietHoursConfig = {
        enabled: true,
        startTime: startTimeStr,
        endTime: endTimeStr,
        days: [0, 1, 2, 3, 4, 5, 6]
      };
      notificationService.setQuietHours(newConfig);
      setQuietHours(newConfig);
    }
    setShowDNDMenu(false);
  };

  // Legacy page uses old header style
  if (isLegacyPage) {
    return (
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-white/[0.08]' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6">
          <nav className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
                <div className="w-16 h-16 relative">
                  <LogoSceneAntimatter className="w-full h-full" scale={0.8} interactive={!isScrolled} />
                </div>
                <span className="text-xl font-bold gradient-text">TraderEdge Pro</span>
              </motion.div>
            </Link>

            {/* Center Navigation - Spaced out like Antimatter */}
            <div className="hidden md:flex items-center gap-12">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                  whileHover={{ y: -1 }}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>

            {/* CTA - Pill button with arrow like Antimatter */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </button>
                  
                  {/* Notification Bell */}
                  <div className="relative" ref={dndMenuRef}>
                    <button 
                      className={`relative p-2 ${isDNDActive ? 'text-white/30' : 'text-white/70 hover:text-white'} transition-colors`}
                      onClick={() => navigate('/notifications')}
                      onContextMenu={(e) => { e.preventDefault(); setShowDNDMenu(!showDNDMenu); }}
                    >
                      {isDNDActive ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                      {unreadCount > 0 && !isDNDActive && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* DND Dropdown */}
                    <AnimatePresence>
                      {showDNDMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0f0f18]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-3"
                        >
                          <p className="text-xs text-white/40 mb-2 px-1">Do Not Disturb</p>
                          <Button
                            variant={quietHours.enabled ? 'default' : 'outline'}
                            size="sm"
                            className={`w-full justify-start gap-2 ${!quietHours.enabled ? 'border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04]' : ''}`}
                            onClick={toggleQuickDND}
                          >
                            {quietHours.enabled ? <BellOff className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            {quietHours.enabled ? 'Turn Off DND' : 'Enable for 1 hour'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 mt-1 text-white/50 hover:text-white hover:bg-white/[0.04]"
                            onClick={() => { navigate('/dashboard?tab=settings'); setShowDNDMenu(false); }}
                          >
                            Schedule quiet hours...
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/[0.05] transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/auth')}
                    className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <motion.button
                    onClick={() => navigate('/membership')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white text-sm font-medium hover:bg-white/[0.12] transition-all duration-300 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black">
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-white"
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
              className="md:hidden absolute top-20 left-0 right-0 bg-[#0a0a0f]/98 backdrop-blur-2xl border-b border-white/[0.06]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className="text-white/60 hover:text-white transition-colors py-2 text-lg text-left"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
                  {user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center text-white/70 hover:text-white"
                        onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                      >
                        Dashboard
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center relative text-white/70 hover:text-white"
                        onClick={() => { navigate('/notifications'); setIsMobileMenuOpen(false); }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-2 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                      <button
                        className="w-full py-3 rounded-full border border-white/20 text-white text-sm font-medium"
                        onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center text-white/70 hover:text-white"
                        onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                      >
                        Sign In
                      </Button>
                      <button
                        className="w-full py-3 rounded-full bg-white/[0.08] border border-white/[0.12] text-white text-sm font-medium flex items-center justify-center gap-2"
                        onClick={() => { navigate('/membership'); setIsMobileMenuOpen(false); }}
                      >
                        Get Started
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    );
  }

  // Default Antimatter-style header for all pages
  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-[#0a0a0f]/80 backdrop-blur-2xl' : 'bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <nav className="flex items-center justify-between h-20">
          {/* Logo with 3D element */}
          <Link to="/" className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
              <div className="w-14 h-14 relative">
                <LogoSceneAntimatter className="w-full h-full" scale={0.7} interactive={!isScrolled} />
              </div>
              <span className="text-white text-lg font-semibold tracking-[0.15em] uppercase">
                TRADEREDGE PRO
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation - Spaced out Antimatter style */}
          <div className="hidden md:flex items-center gap-12">
            {navItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                whileHover={{ y: -1 }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* CTA Buttons - Antimatter style */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  Dashboard
                </button>
                
                {/* Notification Bell */}
                <div className="relative" ref={dndMenuRef}>
                  <button 
                    className={`relative p-2 ${isDNDActive ? 'text-white/30' : 'text-white/70 hover:text-white'} transition-colors`}
                    onClick={() => navigate('/notifications')}
                    onContextMenu={(e) => { e.preventDefault(); setShowDNDMenu(!showDNDMenu); }}
                  >
                    {isDNDActive ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    {unreadCount > 0 && !isDNDActive && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* DND Dropdown */}
                  <AnimatePresence>
                    {showDNDMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0f0f18]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-3"
                      >
                        <p className="text-xs text-white/40 mb-2 px-1">Do Not Disturb</p>
                        <Button
                          variant={quietHours.enabled ? 'default' : 'outline'}
                          size="sm"
                          className={`w-full justify-start gap-2 ${!quietHours.enabled ? 'border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04]' : ''}`}
                          onClick={toggleQuickDND}
                        >
                          {quietHours.enabled ? <BellOff className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {quietHours.enabled ? 'Turn Off DND' : 'Enable for 1 hour'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 mt-1 text-white/50 hover:text-white hover:bg-white/[0.04]"
                          onClick={() => { navigate('/dashboard?tab=settings'); setShowDNDMenu(false); }}
                        >
                          Schedule quiet hours...
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/[0.05] transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign Out
                </motion.button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  Sign In
                </button>
                <motion.button
                  onClick={() => navigate('/membership')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white text-sm font-medium hover:bg-white/[0.12] transition-all duration-300 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black">
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-white"
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
            className="md:hidden absolute top-20 left-0 right-0 bg-[#0a0a0f]/98 backdrop-blur-2xl border-b border-white/[0.06]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-white/60 hover:text-white transition-colors py-2 text-lg text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
                {user ? (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center text-white/70 hover:text-white"
                      onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center relative text-white/70 hover:text-white"
                      onClick={() => { navigate('/notifications'); setIsMobileMenuOpen(false); }}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                    <button
                      className="w-full py-3 rounded-full border border-white/20 text-white text-sm font-medium"
                      onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center text-white/70 hover:text-white"
                      onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                    >
                      Sign In
                    </Button>
                    <button
                      className="w-full py-3 rounded-full bg-white/[0.08] border border-white/[0.12] text-white text-sm font-medium flex items-center justify-center gap-2"
                      onClick={() => { navigate('/membership'); setIsMobileMenuOpen(false); }}
                    >
                      Get Started
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
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

export default Header;
