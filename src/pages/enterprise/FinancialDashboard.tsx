import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Users,
  TrendingUp,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Search,
  Calendar,
  Plus,
  Download,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import jsPDF from 'jspdf';

// Sidebar navigation items
const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: BarChart3, label: 'Analytics' },
  { icon: ShoppingCart, label: 'Order' },
  { icon: Users, label: 'Customer' },
  { icon: TrendingUp, label: 'Sales' },
  { icon: MessageSquare, label: 'Message', badge: 12 },
];

const accountItems = [
  { icon: FileText, label: 'Report' },
  { icon: Settings, label: 'Setting' },
];

// Revenue data
const revenueData = [
  { month: 'Jan', value: 3000 },
  { month: 'Feb', value: 2500 },
  { month: 'March', value: 4000 },
  { month: 'April', value: 3500 },
  { month: 'March', value: 5000 },
  { month: 'April', value: 4200 },
  { month: 'J-2026', value: 5500 },
  { month: 'S-14th', value: 6000 },
  { month: 'April', value: 5800 },
];

// Recent orders
const recentOrders = [
  { name: 'Chicken Salad', price: '$6/9.00', status: 'Complete', image: '🥗' },
  { name: 'Caesar noodles', price: '$12.10', status: 'Complete', image: '🍜' },
  { name: 'Stir noodles', price: '$16.10', status: 'Complete', image: '🍝' },
];

const FinancialDashboard = () => {
  const navigate = useNavigate();

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Financial Report - July 2024', 20, 20);
    doc.setFontSize(12);
    doc.text('Total Revenue: $67,200', 20, 40);
    doc.text('Total Orders: 11,000', 20, 50);
    doc.text('Total Sales: $2,77,000', 20, 60);
    doc.text('Total Profit: $35,000', 20, 70);
    doc.save('financial_report_july_2024.pdf');
  };

  return (
    <div className="min-h-screen bg-[#fef7f4] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🍽</span>
            </div>
            <span className="font-semibold text-gray-800">Dainty Food</span>
          </div>
        </div>

        <div className="p-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider px-3">MENU</span>
        </div>

        <nav className="flex-1 px-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                item.active
                  ? 'bg-red-50 text-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}

          <div className="my-4">
            <span className="text-xs text-gray-400 uppercase tracking-wider px-3">ACCOUNT</span>
          </div>

          {accountItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-gray-600 hover:bg-gray-50"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Upgrade Card */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-4 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <span className="text-2xl">👨‍🍳</span>
            </div>
            <p className="text-sm font-medium mb-1">Download Our</p>
            <p className="text-lg font-bold">Mouke APP</p>
            <p className="text-xs opacity-80">Sweetpod seafood</p>
            <Button size="sm" className="mt-3 bg-white text-red-500 hover:bg-white/90 text-xs">
              Download
            </Button>
          </div>
        </div>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => {
              sessionStorage.removeItem('enterprise_dashboard_session');
              navigate('/enterprise-login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search anything"
                className="pl-10 w-64 bg-white border-gray-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>September 23</span>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                Filter
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-red-100 text-red-600 text-xs">MJ</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Mr. JD</p>
                <p className="text-xs text-gray-400">dayjod@hqgmail.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">Stay on top of our restless's rivligered.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Items</button>
            <button className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">Customer</button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Available Dish</p>
                    <p className="text-2xl font-bold text-gray-800">150.00</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      + 3 New Add
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-500">🍽</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Order</p>
                    <p className="text-2xl font-bold text-gray-800">11,000</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      P 60% Done
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-500">📦</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Sale</p>
                    <p className="text-2xl font-bold text-gray-800">2,77000</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      + 7% Growth
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-500">💰</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Profit</p>
                    <p className="text-2xl font-bold text-gray-800">35,000</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      + 4.5% increase
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-500">📊</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Total Revenue */}
            <Card className="col-span-5 bg-white shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">$67,200</p>
                    <CardTitle className="text-sm font-medium text-gray-500">Revenue Generated</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">...</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Gauge */}
            <Card className="col-span-3 bg-white shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
                  <Button variant="ghost" size="sm">...</Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#fee2e2" strokeWidth="12" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="12"
                      strokeDasharray={`${28 * 3.52} 352`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="12"
                      strokeDasharray={`${15 * 3.52} 352`}
                      strokeDashoffset={`${-28 * 3.52}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400">total count</span>
                    <span className="text-3xl font-bold text-gray-800">28%</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>Keep your with used its pecodler</p>
                  <p>valuable impression oh.</p>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-xs text-gray-500">Meet Court</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-xs text-gray-500">Reacgness</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* More Stats & Reminders */}
            <Card className="col-span-4 bg-white shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">More</CardTitle>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400">station management features</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-500">28</p>
                    <p className="text-xs text-gray-500">Receipr</p>
                  </div>
                  <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-500">24</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="flex-1 bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-500">04</p>
                    <p className="text-xs text-gray-500">pending</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Order</p>
                  <div className="space-y-3">
                    {recentOrders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{order.image}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{order.name}</p>
                            <p className="text-xs text-gray-400">{order.price}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-600 text-xs">{order.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Reports */}
            <Card className="col-span-4 bg-white shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Last Reports</CardTitle>
                  <button className="text-xs text-blue-500">See all</button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1 border border-gray-200 rounded-lg p-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">July Report</p>
                    <p className="text-xs text-gray-400">20.02k</p>
                  </div>
                  <div className="flex-1 border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-400">Create New</p>
                  </div>
                </div>
                <Button onClick={generatePDF} variant="outline" className="w-full mt-4 text-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            {/* Your Customer */}
            <Card className="col-span-4 bg-white shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Your Customer</CardTitle>
                  <Button variant="ghost" size="sm">...</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">3750</p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">5410</p>
                    <p className="text-xs text-gray-500">Offline</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-4">
                  <div className="flex-1 h-2 bg-red-400 rounded-l-full" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-r-full" />
                </div>
                <button className="text-xs text-blue-500 mt-3">View More</button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialDashboard;
