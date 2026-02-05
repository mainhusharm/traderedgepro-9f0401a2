import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  PieChart, 
  Receipt, 
  Bot,
  LogOut,
  Calculator,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Building2,
  Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccountantLogout } from '@/lib/auth/AccountantRoute';

// Tab Components
import PaymentsOverviewTab from './tabs/PaymentsOverviewTab';
import AffiliateSalesTab from './tabs/AffiliateSalesTab';
import ProfitSharingTab from './tabs/ProfitSharingTab';
import ExpensesTab from './tabs/ExpensesTab';
import CAAssistantTab from './tabs/CAAssistantTab';
import ContractTab from './tabs/ContractTab';
import BrandCollaborationsTab from './tabs/BrandCollaborationsTab';
import CompanyRegistrationTab from './tabs/CompanyRegistrationTab';

const accountantTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'affiliates', label: 'Affiliate Sales', icon: Users },
  { id: 'profit', label: 'Profit Sharing', icon: PieChart },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'contract', label: 'Contract', icon: FileText, subtitle: 'Partnership Agreement' },
  { id: 'brands', label: 'Brand Collabs', icon: Building2, subtitle: 'Upfront Deals' },
  { id: 'registration', label: 'Company Reg', icon: Landmark, subtitle: '$50K Milestone' },
  { id: 'ca', label: 'CA Assistant', icon: Bot, subtitle: 'AI Legal Advisor' },
];

const AccountantDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const logout = useAccountantLogout();

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
      case 'overview': return <PaymentsOverviewTab />;
      case 'payments': return <PaymentsOverviewTab showFullTable />;
      case 'affiliates': return <AffiliateSalesTab />;
      case 'profit': return <ProfitSharingTab />;
      case 'expenses': return <ExpensesTab />;
      case 'contract': return <ContractTab />;
      case 'brands': return <BrandCollaborationsTab />;
      case 'registration': return <CompanyRegistrationTab />;
      case 'ca': return <CAAssistantTab />;
      default: return <PaymentsOverviewTab />;
    }
  };

  const currentTab = accountantTabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#020202] flex">
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-background/50 backdrop-blur-xl border-r border-white/[0.08] z-40 transition-all flex flex-col ${isSidebarOpen ? 'w-64' : 'w-16'}`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
      >
        <div className="h-20 flex items-center justify-between border-b border-white/[0.08] px-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <div>
                <span className="text-lg font-bold text-foreground">Accountant</span>
                <p className="text-xs text-muted-foreground">Financial Hub</p>
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
          {accountantTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
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
            <h1 className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
              {currentTab?.label}
            </h1>
            <p className="text-sm text-muted-foreground">{currentTab?.subtitle || 'TraderEdge Pro Financial Management'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Partners</p>
              <p className="text-sm font-medium text-foreground">Anchal (60%) • Sahil (40%)</p>
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

export default AccountantDashboard;
