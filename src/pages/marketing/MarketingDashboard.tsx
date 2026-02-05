import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bot, 
  Target, 
  FileText, 
  Share2, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  Scale,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketingLogout } from '@/lib/auth/MarketingRoute';

// Tab Components
import MarketingOverviewTab from './tabs/MarketingOverviewTab';
import ExecutiveAssistantTab from './tabs/ExecutiveAssistantTab';
import LeadGenerationTab from './tabs/LeadGenerationTab';
import ReceptionistTab from './tabs/ReceptionistTab';
import SEOBlogWriterTab from './tabs/SEOBlogWriterTab';
import SocialMediaTab from './tabs/SocialMediaTab';
import CustomerSupportTab from './tabs/CustomerSupportTab';
import TeamCollaborationTab from './tabs/TeamCollaborationTab';
import LegalComplianceTab from './tabs/LegalComplianceTab';
import MarketingSettingsTab from './tabs/MarketingSettingsTab';
import EngagementExpertTab from './tabs/EngagementExpertTab';

const AI_EMPLOYEES = [
  { id: 'aria', name: 'ARIA', role: 'Executive Assistant', avatar: '👩‍💼', color: 'from-violet-500 to-purple-600' },
  { id: 'blake', name: 'BLAKE', role: 'Lead Generation', avatar: '🎯', color: 'from-emerald-500 to-teal-600' },
  { id: 'nova', name: 'NOVA', role: 'Receptionist', avatar: '👋', color: 'from-pink-500 to-rose-600' },
  { id: 'sage', name: 'SAGE', role: 'SEO Blog Writer', avatar: '✍️', color: 'from-amber-500 to-orange-600' },
  { id: 'maya', name: 'MAYA', role: 'Social Media', avatar: '📱', color: 'from-cyan-500 to-blue-600' },
  { id: 'zoe', name: 'ZOE', role: 'Customer Support', avatar: '💬', color: 'from-indigo-500 to-purple-600' },
  { id: 'lexi', name: 'LEXI', role: 'Legal & Compliance', avatar: '⚖️', color: 'from-slate-500 to-gray-600' },
  { id: 'echo', name: 'ECHO', role: 'Engagement Expert', avatar: '💬', color: 'from-rose-500 to-pink-600' },
];

const marketingTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'aria', label: 'ARIA', subtitle: 'Executive Assistant', icon: Bot, aiEmployee: AI_EMPLOYEES[0] },
  { id: 'blake', label: 'BLAKE', subtitle: 'Lead Generation', icon: Target, aiEmployee: AI_EMPLOYEES[1] },
  { id: 'nova', label: 'NOVA', subtitle: 'Receptionist', icon: MessageSquare, aiEmployee: AI_EMPLOYEES[2] },
  { id: 'sage', label: 'SAGE', subtitle: 'SEO & Blog', icon: FileText, aiEmployee: AI_EMPLOYEES[3] },
  { id: 'maya', label: 'MAYA', subtitle: 'Social Media', icon: Share2, aiEmployee: AI_EMPLOYEES[4] },
  { id: 'zoe', label: 'ZOE', subtitle: 'Customer Support', icon: MessageSquare, aiEmployee: AI_EMPLOYEES[5] },
  { id: 'lexi', label: 'LEXI', subtitle: 'Legal & Compliance', icon: Scale, aiEmployee: AI_EMPLOYEES[6] },
  { id: 'echo', label: 'ECHO', subtitle: 'Engagement Expert', icon: MessageCircle, aiEmployee: AI_EMPLOYEES[7] },
  { id: 'team', label: 'Team Collab', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MarketingDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const logout = useMarketingLogout();

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <MarketingOverviewTab />;
      case 'aria': return <ExecutiveAssistantTab />;
      case 'blake': return <LeadGenerationTab />;
      case 'nova': return <ReceptionistTab />;
      case 'sage': return <SEOBlogWriterTab />;
      case 'maya': return <SocialMediaTab />;
      case 'zoe': return <CustomerSupportTab />;
      case 'lexi': return <LegalComplianceTab />;
      case 'echo': return <EngagementExpertTab />;
      case 'team': return <TeamCollaborationTab />;
      case 'settings': return <MarketingSettingsTab />;
      default: return <MarketingOverviewTab />;
    }
  };

  const currentTab = marketingTabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#020202] flex">
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-background/50 backdrop-blur-xl border-r border-white/[0.08] z-40 transition-all flex flex-col ${isSidebarOpen ? 'w-64' : 'w-16'}`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
      >
        <div className="h-20 flex items-center justify-between border-b border-white/[0.08] px-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <div>
                <span className="text-lg font-bold text-foreground">Marketing</span>
                <p className="text-xs text-muted-foreground">Command Center</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8 shrink-0"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
          {marketingTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {tab.aiEmployee ? (
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tab.aiEmployee.color} flex items-center justify-center text-sm shrink-0`}>
                  {tab.aiEmployee.avatar}
                </div>
              ) : (
                <tab.icon className="w-5 h-5 shrink-0" />
              )}
              {isSidebarOpen && (
                <div className="text-left">
                  <span className="text-sm font-medium block">{tab.label}</span>
                  {tab.subtitle && <span className="text-xs text-muted-foreground">{tab.subtitle}</span>}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/[0.08] p-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className={`flex-1 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <header className="h-20 border-b border-white/[0.08] flex items-center justify-between px-8 bg-background/50 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              {currentTab?.aiEmployee && (
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTab.aiEmployee.color} flex items-center justify-center text-lg`}>
                  {currentTab.aiEmployee.avatar}
                </span>
              )}
              {currentTab?.label}
            </h1>
            <p className="text-sm text-muted-foreground">{currentTab?.subtitle || 'AI-Powered Marketing Operations'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2">
              {AI_EMPLOYEES.slice(0, 5).map((ai) => (
                <div 
                  key={ai.id}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ai.color} flex items-center justify-center text-sm cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => setActiveTab(ai.id)}
                >
                  {ai.avatar}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="p-8">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {renderTabContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MarketingDashboard;
