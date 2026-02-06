import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Calendar,
  Activity,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Crown,
  Shield,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useManagerApi } from '@/hooks/useManagerApi';
import { toast } from 'sonner';

// Tab Components
import ManagerOverviewTab from './tabs/ManagerOverviewTab';
import ManagerAgentsTab from './tabs/ManagerAgentsTab';
import ManagerPerformanceTab from './tabs/ManagerPerformanceTab';
import ManagerSchedulesTab from './tabs/ManagerSchedulesTab';
import ManagerSignalsTab from './tabs/ManagerSignalsTab';
import ManagerGuidanceTab from './tabs/ManagerGuidanceTab';
import ManagerMessagesTab from './tabs/ManagerMessagesTab';
import ManagerAnnouncementsTab from './tabs/ManagerAnnouncementsTab';
import ManagerPaymentsTab from './tabs/ManagerPaymentsTab';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'agents', label: 'Agent Management', icon: Users },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'schedules', label: 'Schedules', icon: Calendar },
  { id: 'signals', label: 'Signal Oversight', icon: Activity },
  { id: 'guidance', label: 'Guidance Sessions', icon: Shield },
  { id: 'messages', label: 'Direct Messages', icon: MessageSquare },
  { id: 'announcements', label: 'Announcements', icon: Bell },
];

interface ManagerInfo {
  id: string;
  email: string;
  name: string;
  permissions: {
    can_manage_agents: boolean;
    can_view_performance: boolean;
    can_manage_schedules: boolean;
    can_review_signals: boolean;
    can_manage_guidance: boolean;
    can_send_broadcasts: boolean;
    can_direct_message: boolean;
  };
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logout } = useManagerApi();

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const sessionToken = sessionStorage.getItem('manager_session_token');
      const storedInfo = sessionStorage.getItem('manager_info');

      if (!sessionToken) {
        navigate('/manager/login', { replace: true });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-manager-session', {
          body: { sessionToken }
        });

        if (error || !data?.valid) {
          sessionStorage.removeItem('manager_session_token');
          sessionStorage.removeItem('manager_info');
          navigate('/manager/login', { replace: true });
          return;
        }

        setManagerInfo(data.manager);
      } catch (err) {
        console.error('Session validation error:', err);
        if (storedInfo) {
          setManagerInfo(JSON.parse(storedInfo));
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [navigate]);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'overview';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const renderTabContent = () => {
    if (!managerInfo) return null;

    switch (activeTab) {
      case 'overview':
        return <ManagerOverviewTab />;
      case 'agents':
        return <ManagerAgentsTab />;
      case 'performance':
        return <ManagerPerformanceTab />;
      case 'payments':
        return <ManagerPaymentsTab />;
      case 'schedules':
        return <ManagerSchedulesTab />;
      case 'signals':
        return <ManagerSignalsTab />;
      case 'guidance':
        return <ManagerGuidanceTab />;
      case 'messages':
        return <ManagerMessagesTab />;
      case 'announcements':
        return <ManagerAnnouncementsTab />;
      default:
        return <ManagerOverviewTab />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] flex">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            className="fixed left-0 top-0 h-full w-64 bg-background/50 backdrop-blur-xl border-r border-purple-500/10 z-40 flex flex-col"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Logo */}
            <div className="h-20 flex items-center justify-center border-b border-purple-500/10 px-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Manager</span>
                  <p className="text-xs text-muted-foreground">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-background border border-purple-500/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-colors z-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Nav Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Manager Info & Logout */}
            <div className="p-4 border-t border-purple-500/10 shrink-0 space-y-3">
              <div className="px-4 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <p className="text-sm font-medium text-purple-300">{managerInfo?.name || 'Manager'}</p>
                <p className="text-xs text-muted-foreground truncate">{managerInfo?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="h-20 border-b border-purple-500/10 flex items-center justify-between px-8 bg-background/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
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
            {!isSidebarOpen && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-4">
                <Crown className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold capitalize">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {managerInfo?.name || 'Manager'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-purple-300">Online</span>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-8">
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

export default ManagerDashboard;
