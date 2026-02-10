import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useServiceWorkerPushToasts } from "@/hooks/useServiceWorkerPushToasts";

// Auth & Context
import { AuthProvider } from "@/lib/auth/AuthContext";
import { SubscriptionProvider } from "@/lib/context/SubscriptionContext";
import { TradingPlanProvider } from "@/lib/context/TradingPlanContext";
import ProtectedRoute from "@/lib/auth/ProtectedRoute";
import SubscriptionProtectedRoute from "@/lib/auth/SubscriptionProtectedRoute";
import MT5ProtectedRoute from "@/lib/auth/MT5ProtectedRoute";
import AdminRoute from "@/lib/auth/AdminRoute";
import AgentRoute from "@/lib/auth/AgentRoute";
import ClientRoute from "@/lib/auth/ClientRoute";
import { AccountantRoute } from "@/lib/auth/AccountantRoute";
import { MarketingRoute } from "@/lib/auth/MarketingRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/auth/AuthPage";
import UserDashboard from "./pages/dashboard/UserDashboard";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import QuestionnairePage from "./pages/questionnaire/QuestionnairePage";
import MembershipPage from "./pages/membership/MembershipPage";
import RenewalPage from "./pages/membership/RenewalPage";
import RiskManagementPlanPage from "./pages/RiskManagementPlanPage";
import ConsentFormPage from "./pages/ConsentFormPage";

// Marketing Pages
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import ContactSupportPage from "./pages/ContactSupportPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import FAQPage from "./pages/FAQPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFlowPage from "./pages/payment/PaymentFlowPage";

// MT5 Pages
import MT5BotsPage from "./pages/mt5/MT5BotsPage";
import MT5BotDashboard from "./pages/mt5/MT5BotDashboard";
import MT5UserDashboard from "./pages/mt5/MT5UserDashboard";
import MT5SignupPage from "./pages/mt5/MT5SignupPage";
import MT5PaymentPage from "./pages/mt5/MT5PaymentPage";
import MT5SigninPage from "./pages/mt5/MT5SigninPage";
import MT5AdminDashboard from "./pages/mt5/MT5AdminDashboard";

// Additional Pages
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import HowToPassPropFirmPage from "./pages/HowToPassPropFirmPage";
import AITradingGuidePage from "./pages/AITradingGuidePage";
import AffiliateLinksPage from "./pages/AffiliateLinksPage";
import FuturesPage from "./pages/FuturesPage";
import PropFirmComparisonPage from "./pages/PropFirmComparisonPage";
import ProfilePage from "./pages/ProfilePage";
import AchievementsPage from "./pages/AchievementsPage";
import SignalHistoryPage from "./pages/SignalHistoryPage";
import TrackRecordPage from "./pages/TrackRecordPage";
import NotificationCenterPage from "./pages/NotificationCenterPage";
import AgentLoginPage from "./pages/agent/AgentLoginPage";
import AgentMainDashboard from "./pages/agent/AgentMainDashboard";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import ClientPortalPage from "./pages/client/ClientPortalPage";
import ClientDashboardPage from "./pages/client/ClientDashboardPage";
import MaintenanceMode from "./components/MaintenanceMode";
import TrialExpiredPage from "./pages/TrialExpiredPage";
import MT5TrialExpiredPage from "./pages/mt5/MT5TrialExpiredPage";
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import GlobalChatWidget from "./components/chat/GlobalChatWidget";
import ManagerLoginPage from "./pages/manager/ManagerLoginPage";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";

import CaseStudiesPage from "./pages/CaseStudiesPage";
import SubmitStoryPage from "./pages/SubmitStoryPage";
import AntimatterLanding from "./pages/AntimatterLanding";
import TreasureHuntPage from "./pages/TreasureHuntPage";
import TreasureHuntRevealPage from "./pages/TreasureHuntRevealPage";

// Enterprise Dashboard Pages
import { EnterpriseDashboardRoute } from "./lib/auth/EnterpriseDashboardRoute";
import EnterpriseLoginPage from "./pages/enterprise/EnterpriseLoginPage";
import EnterpriseDashboardLanding from "./pages/enterprise/EnterpriseDashboardLanding";
import OperationsDashboard from "./pages/enterprise/OperationsDashboard";
import FinancialDashboard from "./pages/enterprise/FinancialDashboard";
import SupportDashboard from "./pages/enterprise/SupportDashboard";
import SalesDashboard from "./pages/enterprise/SalesDashboard";
import ExecutiveDashboard from "./pages/enterprise/ExecutiveDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only fetch on first mount / manual refresh (invalidate/refetch) — not on focus/tab changes.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24, // 24h cache in memory
      retry: 1,
    },
  },
});

const App = () => {
  useServiceWorkerPushToasts();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <TradingPlanProvider>
              <MaintenanceMode>
              <Routes>
                  {/* Public Landing Routes */}
                  <Route path="/" element={<AntimatterLanding />} />
                  <Route path="/home" element={<AntimatterLanding />} />
                  <Route path="/anti" element={<Index />} />
                
                {/* Authentication Routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/signin" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                
                {/* Subscription & Payment Routes */}
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/payment-flow" element={<PaymentFlowPage />} />
                <Route path="/payment" element={<PaymentFlowPage />} />
                <Route path="/renew" element={<RenewalPage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                <Route path="/successful-payment" element={<PaymentSuccessPage />} />
                <Route path="/trial-expired" element={<TrialExpiredPage />} />
                <Route path="/mt5-trial-expired" element={<MT5TrialExpiredPage />} />
                
                {/* Marketing Pages */}
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactSupportPage />} />
                <Route path="/contact-support" element={<ContactSupportPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/terms-of-service" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/track-record" element={<TrackRecordPage />} />

                {/* Blog Routes */}
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                
                {/* SEO Landing Pages */}
                <Route path="/how-to-pass-prop-firm-challenges" element={<HowToPassPropFirmPage />} />
                <Route path="/ai-prop-firm-trading" element={<AITradingGuidePage />} />
                
                {/* Social Proof & Success Stories */}
                <Route path="/case-studies" element={<CaseStudiesPage />} />
                <Route path="/submit-story" element={<SubmitStoryPage />} />
                
                {/* Treasure Hunt Giveaway */}
                <Route path="/treasure-hunt" element={<TreasureHuntPage />} />
                <Route path="/treasure-hunt/reveal" element={<TreasureHuntRevealPage />} />
                
                {/* Trading & Business Pages */}
                <Route path="/futures" element={<FuturesPage />} />
                <Route path="/prop-comparison" element={<PropFirmComparisonPage />} />
                <Route path="/affiliates" element={<AffiliateLinksPage />} />
                <Route path="/affiliate-links" element={<AffiliateLinksPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                
                {/* MT5 Public Routes */}
                <Route path="/mt5-bots" element={<MT5BotsPage />} />
                <Route path="/mt5-signup" element={<MT5SignupPage />} />
                <Route path="/mt5-signin" element={<MT5SigninPage />} />
                <Route path="/mt5-payment" element={<MT5PaymentPage />} />
                <Route path="/mt5-dashboard" element={
                  <MT5ProtectedRoute>
                    <MT5UserDashboard />
                  </MT5ProtectedRoute>
                } />
                
                {/* Onboarding Routes - Protected */}
                <Route path="/questionnaire" element={
                  <ProtectedRoute>
                    <QuestionnairePage />
                  </ProtectedRoute>
                } />
                <Route path="/consent-form" element={
                  <ProtectedRoute>
                    <ConsentFormPage />
                  </ProtectedRoute>
                } />
                <Route path="/risk-management-plan" element={
                  <ProtectedRoute>
                    <RiskManagementPlanPage />
                  </ProtectedRoute>
                } />
                
                {/* Dashboard Routes - Protected + Subscription */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute requiresSubscription={false}>
                      <UserDashboard />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/:tab" element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute requiresSubscription={false}>
                      <DashboardPage />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/user-dashboard" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/signal-history" element={
                  <ProtectedRoute>
                    <SignalHistoryPage />
                  </ProtectedRoute>
                } />
                {/* Redirect /notifications to dashboard notifications tab */}
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" state={{ activeTab: 'notifications' }} replace />
                  </ProtectedRoute>
                } />
                
                {/* MT5 Protected Routes */}
                <Route path="/mt5-dashboard" element={
                  <ProtectedRoute>
                    <MT5BotDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/mt5-admin" element={
                  <AdminRoute>
                    <MT5AdminDashboard />
                  </AdminRoute>
                } />
                
                {/* Agent Routes - OTP Protected */}
                <Route path="/agent" element={<AgentLoginPage />} />
                <Route path="/agent/dashboard" element={
                  <AgentRoute>
                    <AgentMainDashboard />
                  </AgentRoute>
                } />
                
                {/* Client Portal Routes */}
                <Route path="/client" element={<ClientPortalPage />} />
                <Route path="/client/dashboard" element={
                  <ClientRoute>
                    <ClientDashboardPage />
                  </ClientRoute>
                } />
                
                {/* Marketing Command Center - MPIN Protected */}
                <Route path="/marketing" element={
                  <MarketingRoute>
                    <MarketingDashboard />
                  </MarketingRoute>
                } />
                
                {/* Manager Routes - OTP Protected */}
                <Route path="/manager" element={<ManagerLoginPage />} />
                <Route path="/manager/login" element={<ManagerLoginPage />} />
                
                {/* Accountant Dashboard - MPIN Protected */}
                <Route path="/accountant" element={
                  <AccountantRoute>
                    <AccountantDashboard />
                  </AccountantRoute>
                } />
                <Route path="/manager/dashboard" element={<ManagerDashboard />} />

                {/* Enterprise Dashboard Routes */}
                <Route path="/enterprise-login" element={<EnterpriseLoginPage />} />
                <Route path="/enterprise" element={
                  <EnterpriseDashboardRoute requiredRoles={['admin', 'executive', 'operations', 'financial', 'support', 'sales']}>
                    <EnterpriseDashboardLanding />
                  </EnterpriseDashboardRoute>
                } />
                <Route path="/enterprise/operations" element={
                  <EnterpriseDashboardRoute requiredRoles={['admin', 'executive', 'operations']}>
                    <OperationsDashboard />
                  </EnterpriseDashboardRoute>
                } />
                <Route path="/enterprise/financial" element={
                  <EnterpriseDashboardRoute requiredRoles={['admin', 'executive', 'financial']}>
                    <FinancialDashboard />
                  </EnterpriseDashboardRoute>
                } />
                <Route path="/enterprise/support" element={
                  <EnterpriseDashboardRoute requiredRoles={['admin', 'executive', 'support']}>
                    <SupportDashboard />
                  </EnterpriseDashboardRoute>
                } />
                <Route path="/enterprise/sales" element={
                  <EnterpriseDashboardRoute requiredRoles={['admin', 'executive', 'sales']}>
                    <SalesDashboard />
                  </EnterpriseDashboardRoute>
                } />
                <Route path="/enterprise/executive" element={
                  <EnterpriseDashboardRoute requiredRoles={['admin', 'executive']}>
                    <ExecutiveDashboard />
                  </EnterpriseDashboardRoute>
                } />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalChatWidget />
              </MaintenanceMode>
            </TradingPlanProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
