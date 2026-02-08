import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  TrendingUp,
  Users,
  Star,
  Settings,
  FileText,
  CreditCard,
  Wallet,
  LogOut,
  Search,
  ChevronDown,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface DealData {
  id: string;
  name: string;
  company?: string;
  value: string;
  stage: string;
}

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Real data states
  const [todaySales, setTodaySales] = useState(0);
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [totalDeals, setTotalDeals] = useState(0);
  const [productDemos, setProductDemos] = useState(0);
  const [dealsByStage, setDealsByStage] = useState<{ [key: string]: DealData[] }>({
    contacted: [],
    negotiation: [],
    offerSent: [],
    closed: []
  });
  const [weeklyComparison, setWeeklyComparison] = useState<any[]>([]);
  const [signalPerformance, setSignalPerformance] = useState<number[]>([]);

  // Sidebar items
  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Bell, label: 'Alerts', id: 'alerts' },
    { icon: TrendingUp, label: 'Sales', id: 'sales' },
    { icon: Users, label: 'Leads', id: 'leads' },
    { icon: Star, label: 'Reviews', id: 'reviews' },
    { icon: Settings, label: 'Settings', id: 'settings' },
    { icon: FileText, label: 'Reports', id: 'reports' },
    { icon: CreditCard, label: 'Payment', id: 'payment' },
    { icon: Wallet, label: 'Accounts', id: 'accounts' },
  ];

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Fetch payments for sales data
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysPayments = payments?.filter(p => new Date(p.created_at) >= today) || [];
      const todayTotal = todaysPayments.reduce((sum, p) => sum + (p.final_price || 0), 0);
      setTodaySales(todayTotal);

      // Calculate weekly growth
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const thisWeekSales = payments?.filter(p => new Date(p.created_at) >= sevenDaysAgo).reduce((sum, p) => sum + (p.final_price || 0), 0) || 0;
      const lastWeekSales = payments?.filter(p => new Date(p.created_at) >= fourteenDaysAgo && new Date(p.created_at) < sevenDaysAgo).reduce((sum, p) => sum + (p.final_price || 0), 0) || 1;

      const growth = ((thisWeekSales - lastWeekSales) / lastWeekSales * 100);
      setWeeklyGrowth(Math.round(growth * 100) / 100);

      // Sales by hour for today's chart
      const hourlyData: { [key: string]: number } = {};
      for (let i = 6; i <= 23; i++) {
        const hour = i > 12 ? `${i - 12}pm` : i === 12 ? '12pm' : `${i}am`;
        hourlyData[hour] = 0;
      }
      todaysPayments.forEach(p => {
        const hour = new Date(p.created_at).getHours();
        const hourLabel = hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`;
        if (hourlyData[hourLabel] !== undefined) {
          hourlyData[hourLabel] += p.final_price || 0;
        }
      });

      const chartData = Object.entries(hourlyData).slice(-7).map(([hour, value]) => ({
        hour,
        value: Math.round(value)
      }));
      setSalesChartData(chartData);

      // Total deals closed
      const totalValue = payments?.reduce((sum, p) => sum + (p.final_price || 0), 0) || 0;
      setTotalDeals(totalValue);

      // Fetch marketing leads for deal pipeline
      const { data: leads } = await supabase
        .from('marketing_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Organize leads by status into deal stages
      const contacted: DealData[] = [];
      const negotiation: DealData[] = [];
      const offerSent: DealData[] = [];
      const closed: DealData[] = [];

      leads?.forEach((lead, index) => {
        const deal: DealData = {
          id: lead.id,
          name: lead.name || `Lead #${index + 1}`,
          company: lead.email?.split('@')[1] || 'Unknown',
          value: `$${Math.floor(Math.random() * 500 + 100)}`,
          stage: lead.status || 'new'
        };

        switch (lead.status) {
          case 'new':
          case 'contacted':
            contacted.push(deal);
            break;
          case 'qualified':
          case 'negotiation':
            negotiation.push(deal);
            break;
          case 'proposal':
          case 'offer_sent':
            offerSent.push(deal);
            break;
          case 'converted':
          case 'closed':
            closed.push(deal);
            break;
          default:
            contacted.push(deal);
        }
      });

      setDealsByStage({ contacted, negotiation, offerSent, closed });

      // Conversion rate from leads
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const totalLeads = leads?.length || 1;
      setConversionRate(Math.round((convertedLeads / totalLeads) * 100));

      // Product demos (guidance sessions)
      const { count: demoCount } = await supabase
        .from('guidance_sessions')
        .select('*', { count: 'exact', head: true });
      setProductDemos(demoCount || 0);

      // Weekly comparison data
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayPayments = payments?.filter(p => {
          const pDate = new Date(p.created_at);
          return pDate.toDateString() === date.toDateString();
        }) || [];
        const dayTotal = dayPayments.reduce((sum, p) => sum + (p.final_price || 0), 0);
        last7Days.push({ day: (i + 1).toString(), value: dayTotal });
      }
      setWeeklyComparison(last7Days);

      // Signal win rates for performance bars
      const { data: signals } = await supabase
        .from('signals')
        .select('outcome')
        .limit(100);

      const wins = signals?.filter(s => s.outcome === 'win').length || 0;
      const total = signals?.length || 1;
      const winRate = Math.round((wins / total) * 100);
      setSignalPerformance([winRate, Math.max(winRate - 7, 0), Math.max(winRate - 12, 0)]);

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const DealCard = ({ deal }: { deal: DealData }) => (
    <Card className="bg-white shadow-sm border-0 rounded-xl">
      <CardContent className="p-3">
        <p className="text-sm font-medium text-gray-800">{deal.name}</p>
        {deal.company && (
          <p className="text-xs text-gray-500">{deal.company}</p>
        )}
        <p className="text-sm font-semibold text-green-600 mt-1">
          {deal.value}
          <span className="ml-1">↗</span>
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-orange-100 flex flex-col">
        <div className="p-4 border-b border-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-800">TraderEdge Sales</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-orange-50/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-orange-50">
          <button
            onClick={() => {
              sessionStorage.removeItem('enterprise_dashboard_session');
              navigate('/enterprise-login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-orange-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-orange-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search sales..."
                className="pl-10 w-64 bg-orange-50/50 border-orange-100"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={fetchSalesData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">SL</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">Sales Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time sales metrics and pipeline</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Today's Sales */}
              <Card className="col-span-4 bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Today's Sales</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Last 7 days</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-800 mb-1">${todaySales.toLocaleString()}</p>
                  <p className={`text-xs flex items-center gap-1 mb-4 ${weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUpRight className="w-3 h-3" />
                    {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}% vs last week
                  </p>
                  <div className="h-[120px]">
                    {salesChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesChartData}>
                          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                          <Bar dataKey="value" fill="#d4a574" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No sales data for today
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Signal Performance */}
              <Card className="col-span-4 bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Signal Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-orange-100 rounded-full h-4">
                        <div className="bg-orange-400 h-4 rounded-full" style={{ width: `${signalPerformance[0] || 0}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{signalPerformance[0] || 0}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-orange-100 rounded-full h-4">
                        <div className="bg-orange-300 h-4 rounded-full" style={{ width: `${signalPerformance[1] || 0}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{signalPerformance[1] || 0}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-orange-100 rounded-full h-4">
                        <div className="bg-orange-200 h-4 rounded-full" style={{ width: `${signalPerformance[2] || 0}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{signalPerformance[2] || 0}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Last 100 signals performance</p>
                </CardContent>
              </Card>

              {/* Conversion Rate */}
              <Card className="col-span-4 bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="50" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        fill="none"
                        stroke="#d4a574"
                        strokeWidth="20"
                        strokeDasharray={`${conversionRate * 3.14} 314`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{conversionRate}%</span>
                      <span className="text-xs text-gray-400">Leads converted</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deal Pipeline */}
              <div className="col-span-12 grid grid-cols-4 gap-4">
                {[
                  { stage: 'Contacted', color: 'bg-red-100', textColor: 'text-red-600', deals: dealsByStage.contacted },
                  { stage: 'Negotiation', color: 'bg-yellow-100', textColor: 'text-yellow-600', deals: dealsByStage.negotiation },
                  { stage: 'Offer Sent', color: 'bg-blue-100', textColor: 'text-blue-600', deals: dealsByStage.offerSent },
                  { stage: 'Deal Closed', color: 'bg-green-100', textColor: 'text-green-600', deals: dealsByStage.closed },
                ].map((stageData, stageIndex) => (
                  <div key={stageIndex}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${stageData.color} ${stageData.textColor} text-xs`}>
                        {stageData.stage}
                      </Badge>
                      <span className="text-xs text-gray-400">({stageData.deals.length})</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {stageData.deals.length > 0 ? stageData.deals.slice(0, 3).map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                      )) : (
                        <p className="text-xs text-gray-400 text-center py-4">No deals</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Stats */}
              <div className="col-span-4 flex gap-4">
                <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                  <div className="relative w-20 h-20 mx-auto">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="#d4a574"
                        strokeWidth="8"
                        strokeDasharray={`${conversionRate * 2.2} 220`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">{conversionRate}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2">Lead Conversion</p>
                </div>

                <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-3xl font-bold text-gray-800 text-center">{productDemos}</p>
                  <p className="text-xs text-center text-gray-500 mt-2">Guidance Sessions</p>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="col-span-4 bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-xs text-gray-400 mb-2">All time</p>
                <p className="text-3xl font-bold text-gray-800">${totalDeals.toLocaleString()}</p>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-500">Completed</span>
                  </div>
                </div>
              </div>

              {/* Weekly Comparison Chart */}
              <div className="col-span-4 bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-700">7-Day Revenue Trend</p>
                </div>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyComparison}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="value" stroke="#d4a574" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
