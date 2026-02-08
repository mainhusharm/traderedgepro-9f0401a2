import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  Workflow,
  ListTodo,
  AlertTriangle,
  BarChart3,
  Users,
  Receipt,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Sidebar navigation items
const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Settings, label: 'Automations' },
  { icon: Workflow, label: 'Workflows' },
  { icon: ListTodo, label: 'Tasks' },
  { icon: AlertTriangle, label: 'Failures' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Users, label: 'Team' },
  { icon: Receipt, label: 'Transactions' },
];

// Automation performance data
const automationData = [
  { day: 'Mon', value: 180 },
  { day: 'Tue', value: 220 },
  { day: 'Wed', value: 280 },
  { day: 'Thu', value: 250 },
  { day: 'Fri', value: 320 },
  { day: 'Sat', value: 380 },
  { day: 'Sun', value: 290 },
];

// Reported cases data
const reportedCasesData = [
  { day: 'Mon', value: 45 },
  { day: 'Tue', value: 52 },
  { day: 'Wed', value: 38 },
  { day: 'Thu', value: 65 },
  { day: 'Fri', value: 48 },
  { day: 'Sat', value: 72 },
  { day: 'Sun', value: 55 },
];

// Failures data
const failuresData = [
  { type: 'API Timeout', time: '09:11', status: 'resolved' },
  { type: 'Database Connection...', time: '04:33', status: 'pending' },
  { type: 'Workflow Syntax Error', time: '04:33', status: 'error' },
  { type: 'DataadicasProstry', time: '2:30m', status: 'warning' },
  { type: 'Fullname Status', time: '09:10', status: 'resolved' },
  { type: 'Workflow Syntax Error', time: '04:32', status: 'error' },
];

// Transactions data
const transactionsData = [
  { product: 'Product B', user: 'Christine R.', status: 'Completed', date: '11 Aug 2024', team: 'Team 32mg' },
  { product: 'Product A', user: 'Christine R.', status: 'Completed', date: '11 Aug 2024', team: 'Team 32mg' },
  { product: 'Product C', user: 'Christine R.', status: 'In-Progress', date: '11 Aug 2024', team: 'Team 32mg' },
  { product: 'Product D', user: 'Christine R.', status: 'Completed', date: '11 Aug 2024', team: 'Team 32mg' },
];

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-500';
      case 'In-Progress': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getFailureIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && <span className="font-semibold text-gray-800">Donezo</span>}
          </div>
        </div>

        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => {
              sessionStorage.removeItem('enterprise_dashboard_session');
              navigate('/enterprise-login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search"
                className="pl-10 w-64 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Bogie</span>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">SA</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Sarah</span>
                <span className="text-xs text-gray-400">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Operational Overview */}
            <Card className="col-span-3 bg-white shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Operational Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Revenue Generated</span>
                      <Badge className="bg-green-100 text-green-600 text-xs">10%</Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">$130,709</p>
                    <p className="text-xs text-gray-400">11 Increases last month</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500">This Month</span>
                    <p className="text-xl font-bold text-gray-800">$130,709</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="12"
                          strokeDasharray={`${42 * 3.52} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-400">08%</span>
                        <span className="text-2xl font-bold text-gray-800">42%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500">Revenue</p>
                </div>
              </CardContent>
            </Card>

            {/* Automation Performance */}
            <Card className="col-span-5 bg-white shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Automation Performance</CardTitle>
                  <Badge className="bg-blue-100 text-blue-600 text-xs">Systems</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={automationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">10 Total This Month</span>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Performance Stats:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-700">Automations</span>
                      <span className="text-gray-400">3m</span>
                      <span className="text-gray-400">12%</span>
                      <span className="text-gray-400">18</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-700">Failures:</span>
                      <span className="text-gray-400">16%</span>
                      <span className="text-gray-400">97%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Failures Overview */}
            <Card className="col-span-4 bg-white shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Failures Overview</CardTitle>
                  <span className="text-xs text-gray-400">Recent Activity</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failuresData.map((failure, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFailureIcon(failure.status)}
                        <span className="text-sm text-gray-700">{failure.type}</span>
                      </div>
                      <span className="text-xs text-gray-400">{failure.time}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-xs text-gray-500">58% Automations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reported Cases */}
            <Card className="col-span-4 bg-white shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Reported Cases</CardTitle>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4 text-gray-400" /></button>
                    <button className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4 text-gray-400" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                      <span className="text-lg font-bold text-gray-700">5</span>
                    </div>
                    <span className="text-xs text-gray-500">Issues</span>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                      <span className="text-lg font-bold text-blue-600">8</span>
                    </div>
                    <span className="text-xs text-gray-500">Errors</span>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                      <span className="text-lg font-bold text-gray-700">5</span>
                    </div>
                    <span className="text-xs text-gray-500">Failures</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">Mobiterm</div>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportedCasesData}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Bar dataKey="value" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card className="col-span-8 bg-white shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Transactions</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Q. Hour" className="w-20 h-8 text-xs" />
                    <Button variant="ghost" size="sm" className="h-8 text-xs">...</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 text-xs text-gray-500 pb-2 border-b border-gray-100">
                    <span>Product</span>
                    <span>Status</span>
                    <span>Team 32mg</span>
                    <span></span>
                  </div>
                  {transactionsData.map((txn, index) => (
                    <div key={index} className="grid grid-cols-4 items-center py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {txn.product[8]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{txn.product}</p>
                          <p className="text-xs text-gray-400">{txn.user}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(txn.status)}`}>
                        {txn.status}
                      </span>
                      <span className="text-sm text-gray-500">{txn.date}</span>
                      <span></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OperationsDashboard;
