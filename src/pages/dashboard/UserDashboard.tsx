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
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] flex">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            className="fixed left-0 top-0 h-full w-64 bg-background/50 backdrop-blur-xl border-r border-white/[0.08] z-40 flex flex-col"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Logo */}
            <Link to="/" className="h-16 flex items-center justify-center border-b border-white/[0.08] px-2 shrink-0">
              <div className="flex items-center gap-2">
                <LogoScene className="w-10 h-10" scale={1} interactive={false} />
                <span className="text-lg font-bold gradient-text">TraderEdge</span>
              </div>
            </Link>

            {/* Mode Toggle */}
            <div className="px-3 py-3 border-b border-white/[0.08]">
              <DashboardModeToggle />
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute -right-3 top-32 w-6 h-6 rounded-full bg-background border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors z-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Nav Items - Scrollable */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? mode === 'personal_capital'
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/[0.08] shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-risk hover:bg-risk/10 transition-all"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-background/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Expand Sidebar Button - shown when collapsed */}
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="mr-2"
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
              <h1 className="text-xl font-bold">
                {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, {user?.email?.split('@')[0]}
              </p>
            </div>
            <PlanBadge />
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${(dashboardData?.total_pnl || 0) >= 0 ? 'bg-success' : 'bg-risk'}`} />
                <span className="text-sm text-muted-foreground">P&L:</span>
                <span className={`font-semibold ${(dashboardData?.total_pnl || 0) >= 0 ? 'text-success' : 'text-risk'}`}>
                  {(dashboardData?.total_pnl || 0) >= 0 ? '+' : ''}${(dashboardData?.total_pnl || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Win Rate:</span>
                <span className="font-semibold">{dashboardData?.win_rate || 0}%</span>
              </div>
            </div>

            {/* Notification Center */}
            <NotificationCenterDropdown />
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
