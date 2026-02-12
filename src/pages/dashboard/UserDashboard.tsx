import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard,
  Activity, 
  BarChart3, 
  BookOpen, 
  Building2,
  Shield,
  Bot,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  Target,
  Users,
  UserCheck,
  ChevronLeft,
  Menu,
  Wallet,
  TrendingUp,
  Calculator,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePaymentStatusCheck } from '@/hooks/usePaymentStatusCheck';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import PlanBadge from '@/components/dashboard/PlanBadge';
import NotificationCenterDropdown from '@/components/dashboard/NotificationCenterDropdown';
import { useVIPSignalSound } from '@/hooks/useVIPSignalSound';
import LogoScene from '@/components/canvas/LogoScene';
import { Button } from '@/components/ui/button';
import DashboardModeToggle from '@/components/dashboard/DashboardModeToggle';
import { DashboardModeProvider, useDashboardMode } from '@/lib/context/DashboardModeContext';

// Tab Components - Prop Firm
import OverviewTab from './tabs/OverviewTab';
import SignalsFeedTab from './tabs/SignalsFeedTab';
import PerformanceTab from './tabs/PerformanceTab';
import JournalTab from './tabs/JournalTab';
import PropFirmRulesTab from './tabs/PropFirmRulesTab';
import RiskProtocolTab from './tabs/RiskProtocolTab';
import AICoachTab from './tabs/AICoachTab';
import NotificationCombinedTab from './tabs/NotificationCombinedTab';
import SupportTab from './tabs/SupportTab';
import SettingsTab from './tabs/SettingsTab';
import MilestoneAnalyticsTab from './tabs/MilestoneAnalyticsTab';
import AffiliateTab from './tabs/AffiliateTab';
import LeaderboardTab from './tabs/LeaderboardTab';
import GuidanceTab from './tabs/GuidanceTab';

// Tab Components - Personal Capital
import PersonalOverviewTab from './tabs/personal/PersonalOverviewTab';
import PersonalAccountsTab from './tabs/personal/PersonalAccountsTab';
import IncomeTrackerTab from './tabs/personal/IncomeTrackerTab';
import CompoundingTab from './tabs/personal/CompoundingTab';
import CapitalPreservationTab from './tabs/personal/CapitalPreservationTab';
import TaxReportsTab from './tabs/personal/TaxReportsTab';

// Prop Firm Mode Tabs
const propFirmTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'signals', label: 'Signals Feed', icon: Activity },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'milestone-analytics', label: 'Milestone Analytics', icon: Target },
  { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  { id: 'journal', label: 'Trade Journal', icon: BookOpen },
  { id: 'prop-rules', label: 'Prop Firm Rules', icon: Building2 },
  { id: 'risk', label: 'Risk Protocol', icon: Shield },
  { id: 'ai-coach', label: 'Nexus AI', icon: Bot },
  { id: 'guidance', label: '1-on-1 Guidance', icon: UserCheck },
  { id: 'affiliate', label: 'Affiliate', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Personal Capital Mode Tabs
const personalCapitalTabs = [
  { id: 'pc-overview', label: 'Portfolio Overview', icon: LayoutDashboard },
  { id: 'pc-accounts', label: 'My Accounts', icon: Wallet },
  { id: 'signals', label: 'Signals Feed', icon: Activity },
  { id: 'pc-performance', label: 'Performance', icon: BarChart3 },
  { id: 'pc-income', label: 'Income Tracker', icon: TrendingUp },
  { id: 'pc-compounding', label: 'Compounding', icon: Calculator },
  { id: 'pc-preservation', label: 'Capital Protection', icon: Shield },
  { id: 'journal', label: 'Trade Journal', icon: BookOpen },
  { id: 'pc-tax', label: 'Tax Reports', icon: FileText },
  { id: 'ai-coach', label: 'Nexus AI', icon: Bot },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const DashboardContent = () => {
  const { mode } = useDashboardMode();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get default tab based on mode
  const getDefaultTab = () => mode === 'personal_capital' ? 'pc-overview' : 'overview';
  
  const tabFromUrl = searchParams.get('tab') || getDefaultTab();
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tabs based on current mode
  const tabs = mode === 'personal_capital' ? personalCapitalTabs : propFirmTabs;
  
  // Auto-activate membership when payment is verified
  usePaymentStatusCheck();
  
  // Initialize VIP signal sound notifications
  useVIPSignalSound();

  // Activity tracking for dispute evidence
  const { logDashboardView } = useActivityTracking();

  // Reset to default tab when mode changes
  useEffect(() => {
    const currentTabExists = tabs.some(t => t.id === activeTab);
    if (!currentTabExists) {
      const defaultTab = getDefaultTab();
      setActiveTab(defaultTab);
      setSearchParams({ tab: defaultTab });
    }
  }, [mode, tabs]);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || getDefaultTab();
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  }, [setSearchParams]);

  // Log tab views
  useEffect(() => {
    if (activeTab) {
      logDashboardView(activeTab);
    }
  }, [activeTab, logDashboardView]);

  // Handle navigation state for tab switching (from other pages)
  useEffect(() => {
    const state = location.state as { activeTab?: string } | null;
    if (state?.activeTab) {
      handleTabChange(state.activeTab);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;
      setDashboardData((data as any[] | null)?.[0] ?? null);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      // Prop Firm Tabs
      case 'overview':
        return <OverviewTab dashboardData={dashboardData} />;
      case 'signals':
        return <SignalsFeedTab />;
      case 'performance':
        return <PerformanceTab dashboardData={dashboardData} />;
      case 'milestone-analytics':
        return <MilestoneAnalyticsTab />;
      case 'leaderboard':
        return <LeaderboardTab />;
      case 'journal':
        return <JournalTab />;
      case 'prop-rules':
        return <PropFirmRulesTab dashboardData={dashboardData} />;
      case 'risk':
        return <RiskProtocolTab dashboardData={dashboardData} />;
      case 'ai-coach':
        return <AICoachTab />;
      case 'guidance':
        return <GuidanceTab />;
      case 'affiliate':
        return <AffiliateTab />;
      case 'notifications':
        return <NotificationCombinedTab />;
      case 'support':
        return <SupportTab />;
      case 'settings':
        return <SettingsTab />;
      
      // Personal Capital Tabs
      case 'pc-overview':
        return <PersonalOverviewTab />;
      case 'pc-accounts':
        return <PersonalAccountsTab />;
      case 'pc-performance':
        return <PerformanceTab dashboardData={dashboardData} />;
      case 'pc-income':
        return <IncomeTrackerTab />;
      case 'pc-compounding':
        return <CompoundingTab />;
      case 'pc-preservation':
        return <CapitalPreservationTab />;
      case 'pc-tax':
        return <TaxReportsTab />;
      
      default:
        return mode === 'personal_capital' 
          ? <PersonalOverviewTab /> 
          : <OverviewTab dashboardData={dashboardData} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
        {/* Ambient gradient blurs for loading */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary/20 blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] flex relative overflow-hidden">
      {/* Ambient gradient blurs - Premium background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            className="fixed left-0 top-0 h-full w-64 bg-white/[0.02] backdrop-blur-2xl border-r border-white/[0.08] z-40 flex flex-col"
            initial={{ x: -256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -256, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Sidebar glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.05] via-transparent to-purple-500/[0.05] pointer-events-none" />

            {/* Logo */}
            <Link to="/" className="relative h-16 flex items-center justify-center border-b border-white/[0.08] px-2 shrink-0 group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-2 relative">
                <LogoScene className="w-10 h-10" scale={1} interactive={false} />
                <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">TraderEdge</span>
              </div>
            </Link>

            {/* Mode Toggle */}
            <div className="px-3 py-3 border-b border-white/[0.08] relative">
              <DashboardModeToggle />
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute -right-3 top-32 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm border border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 hover:border-primary/30 transition-all duration-300 z-50 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* Nav Items - Scrollable */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* Active tab gradient background */}
                  {activeTab === tab.id && (
                    <>
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 rounded-xl ${
                          mode === 'personal_capital'
                            ? 'bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border border-accent/30'
                            : 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30'
                        }`}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      />
                      {/* Glow effect for active tab */}
                      <div className={`absolute -inset-1 rounded-xl blur-xl ${
                        mode === 'personal_capital' ? 'bg-accent/20' : 'bg-primary/20'
                      } -z-10`} />
                    </>
                  )}

                  {/* Hover effect */}
                  {activeTab !== tab.id && (
                    <div className="absolute inset-0 bg-white/[0.03] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                  </div>

                  <tab.icon className={`w-4 h-4 shrink-0 relative z-10 transition-colors ${
                    activeTab === tab.id
                      ? mode === 'personal_capital' ? 'text-accent' : 'text-primary'
                      : 'group-hover:text-foreground'
                  }`} />
                  <span className="text-sm font-medium relative z-10">{tab.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/[0.08] shrink-0 relative">
              <button
                onClick={handleLogout}
                className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-risk transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-risk/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <LogOut className="w-4 h-4 shrink-0 relative z-10" />
                <span className="text-sm font-medium relative z-10">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 relative ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-white/[0.02] backdrop-blur-2xl sticky top-0 z-30 relative">
          {/* Header gradient accent */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="flex items-center gap-4">
            {/* Expand Sidebar Button - shown when collapsed */}
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="mr-2 hover:bg-white/[0.05]"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            {/* Logo when sidebar collapsed */}
            {!isSidebarOpen && (
              <Link to="/" className="flex items-center gap-2 mr-4">
                <LogoScene className="w-8 h-8" scale={0.8} interactive={false} />
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, <span className="text-foreground/80">{user?.email?.split('@')[0]}</span>
              </p>
            </div>
            <PlanBadge />
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Stats - Premium styled */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className={`w-2 h-2 rounded-full ${(dashboardData?.total_pnl || 0) >= 0 ? 'bg-success' : 'bg-risk'} ${(dashboardData?.total_pnl || 0) >= 0 ? 'shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <span className="text-sm text-muted-foreground">P&L:</span>
                <span className={`font-semibold ${(dashboardData?.total_pnl || 0) >= 0 ? 'text-success' : 'text-risk'}`}>
                  {(dashboardData?.total_pnl || 0) >= 0 ? '+' : ''}${(dashboardData?.total_pnl || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Win Rate:</span>
                <span className="font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{dashboardData?.win_rate || 0}%</span>
              </div>
            </div>

            {/* Notification Center */}
            <NotificationCenterDropdown />
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 relative">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// Wrapper component that provides the context
const UserDashboard = () => {
  return (
    <DashboardModeProvider>
      <DashboardContent />
    </DashboardModeProvider>
  );
};

export default UserDashboard;
