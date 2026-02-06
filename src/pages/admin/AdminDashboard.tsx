import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Bot,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  AlertCircle,
  BarChart3,
  Package,
  PieChart,
  Gift,
  Ticket,
  UserCheck,
  Shield,
  Mail,
  Bell,
  Megaphone,
  Send,
  Code2,
  Sparkles,
  Gauge,
  UserPlus,
  Rocket,
  Brain,
  FileCheck,
  Crosshair
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Construction, Building2 } from 'lucide-react';

// Tab Components
import AdminOverviewTab from './tabs/AdminOverviewTab';
import SignalManagementTab from './tabs/SignalManagementTab';
import UserManagementTab from './tabs/UserManagementTab';
import PaymentManagementTab from './tabs/PaymentManagementTab';
import TicketManagementTab from './tabs/TicketManagementTab';
import AdminSettingsTab from './tabs/AdminSettingsTab';
import CryptoPaymentReviewTab from './tabs/CryptoPaymentReviewTab';
import AllPaymentsReviewTab from './tabs/AllPaymentsReviewTab';
import MT5OrdersManagementTab from './tabs/MT5OrdersManagementTab';
import MT5AnalyticsTab from './tabs/MT5AnalyticsTab';
import KickstarterVerificationTab from './tabs/KickstarterVerificationTab';
import CouponManagementTab from './tabs/CouponManagementTab';
import GuidanceManagementTab from './tabs/GuidanceManagementTab';
import AgentManagement from '@/components/admin/AgentManagement';
import EmailDiagnosticsTab from './tabs/EmailDiagnosticsTab';
import PushNotificationStatsTab from './tabs/PushNotificationStatsTab';
import BroadcastCenterTab from './tabs/BroadcastCenterTab';
import EmailCampaignsTab from './tabs/EmailCampaignsTab';
import MaintenanceTab from './tabs/MaintenanceTab';
import PropFirmManagementTab from './tabs/PropFirmManagementTab';
import EngineerBotTab from './tabs/EngineerBotTab';
import MarketingAIOverviewTab from './tabs/MarketingAIOverviewTab';
import { PerformanceMonitorTab } from './tabs/PerformanceMonitorTab';
import { UserActivityTab } from './tabs/UserActivityTab';
import LaunchGiveawayTab from './tabs/LaunchGiveawayTab';
import InstitutionalBotTab from './tabs/InstitutionalBotTab';
import RuleSubmissionsTab from './tabs/RuleSubmissionsTab';
import TradeManagementTab from './tabs/TradeManagementTab';
import TreasureHuntTab from './tabs/TreasureHuntTab';
import AdminPropFirmRequestsTab from './tabs/AdminPropFirmRequestsTab';
import { Gem } from 'lucide-react';

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'user-activity', label: 'User Activity', icon: UserPlus },
  { id: 'treasure-hunt', label: 'Treasure Hunt', icon: Gem },
  { id: 'launch-giveaway', label: 'Launch Giveaway', icon: Rocket },
  { id: 'marketing-ai', label: 'Marketing AI', icon: Sparkles },
  { id: 'signals', label: 'Signal Management', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'agents', label: 'Agents', icon: Shield },
  { id: 'institutional', label: 'Signal Bot', icon: Brain },
  { id: 'trade-management', label: 'Trade Monitor', icon: Crosshair },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'all-payments', label: 'All Payments', icon: DollarSign },
  { id: 'crypto', label: 'Crypto Review', icon: DollarSign },
  { id: 'mt5', label: 'MT5 Orders', icon: Package },
  { id: 'mt5-analytics', label: 'MT5 Analytics', icon: PieChart },
  { id: 'kickstarter', label: 'Kickstarter', icon: Gift },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'guidance', label: '1-on-1 Guidance', icon: UserCheck },
  { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
  { id: 'email', label: 'Email Diagnostics', icon: Mail },
  { id: 'push', label: 'Push Stats', icon: Bell },
  { id: 'broadcast', label: 'Broadcast Center', icon: Megaphone },
  { id: 'campaigns', label: 'Email Campaigns', icon: Send },
  { id: 'prop-firms', label: 'Prop Firm Rules', icon: Building2 },
  { id: 'prop-requests', label: 'Prop Requests', icon: FileCheck },
  { id: 'rule-submissions', label: 'Rule Submissions', icon: FileCheck },
  { id: 'engineer', label: 'Engineer Bot', icon: Code2 },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'maintenance', label: 'Maintenance', icon: Construction },
  { id: 'settings', label: 'Settings', icon: Settings },
];
interface AdminStats {
  users: { total: number; newThisWeek: number; activeMembers: number };
  signals: { total: number; today: number };
  payments: { totalRevenue: number; completedCount: number };
  bots: any[];
  tickets: { pending: number };
}

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { callAdminApi } = useAdminApi();

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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await callAdminApi('get_stats');
      setStats(result);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
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
      case 'overview':
        return <AdminOverviewTab stats={stats} onRefresh={fetchStats} onTabChange={handleTabChange} />;
      case 'user-activity':
        return <UserActivityTab />;
      case 'treasure-hunt':
        return <TreasureHuntTab />;
      case 'launch-giveaway':
        return <LaunchGiveawayTab />;
      case 'marketing-ai':
        return <MarketingAIOverviewTab />;
      case 'signals':
        return <SignalManagementTab />;
      case 'users':
        return <UserManagementTab />;
      case 'agents':
        return <AgentManagement />;
      case 'institutional':
        return <InstitutionalBotTab />;
      case 'trade-management':
        return <TradeManagementTab />;
      case 'payments':
        return <PaymentManagementTab />;
      case 'all-payments':
        return <AllPaymentsReviewTab />;
      case 'crypto':
        return <CryptoPaymentReviewTab />;
      case 'mt5':
        return <MT5OrdersManagementTab />;
      case 'mt5-analytics':
        return <MT5AnalyticsTab />;
      case 'kickstarter':
        return <KickstarterVerificationTab />;
      case 'coupons':
        return <CouponManagementTab />;
      case 'guidance':
        return <GuidanceManagementTab />;
      case 'tickets':
        return <TicketManagementTab />;
      case 'email':
        return <EmailDiagnosticsTab />;
      case 'push':
        return <PushNotificationStatsTab />;
      case 'broadcast':
        return <BroadcastCenterTab />;
      case 'campaigns':
        return <EmailCampaignsTab />;
      case 'prop-firms':
        return <PropFirmManagementTab />;
      case 'prop-requests':
        return <AdminPropFirmRequestsTab />;
      case 'rule-submissions':
        return <RuleSubmissionsTab />;
      case 'engineer':
        return <EngineerBotTab />;
      case 'performance':
        return <PerformanceMonitorTab />;
      case 'maintenance':
        return <MaintenanceTab />;
      case 'settings':
        return <AdminSettingsTab />;
      default:
        return <AdminOverviewTab stats={stats} onRefresh={fetchStats} onTabChange={setActiveTab} />;
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
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-background/50 backdrop-blur-xl border-r border-white/[0.08] z-40 transition-all flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-white/[0.08] px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-risk to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">AD</span>
            </div>
            {isSidebarOpen && (
              <div>
                <span className="text-lg font-bold text-foreground">Admin</span>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-risk/10 text-risk border border-risk/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto border-t border-white/[0.08] p-4 space-y-2">
          <button
            onClick={() => navigate('/marketing')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-all"
          >
            <Megaphone className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Marketing AI</span>}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">User Dashboard</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-risk hover:bg-risk/10 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="h-20 border-b border-white/[0.08] flex items-center justify-between px-8 bg-background/50 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-risk capitalize">
              {adminTabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              Admin Control Panel
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Users:</span>
                <span className="font-semibold">{stats?.users.total || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Revenue:</span>
                <span className="font-semibold text-success">
                  ${stats?.payments.totalRevenue?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Tickets:</span>
                <span className="font-semibold">{stats?.tickets.pending || 0}</span>
              </div>
            </div>

            {/* Toggle Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
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

export default AdminDashboard;
