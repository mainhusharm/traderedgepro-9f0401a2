import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  UtensilsCrossed,
  Menu,
  Star,
  Settings,
  FileText,
  CreditCard,
  Wallet,
  LogOut,
  Search,
  Calendar,
  ChevronDown,
  ArrowUpRight
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
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// Sidebar items
const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Bell, label: 'Alerts' },
  { icon: UtensilsCrossed, label: 'Food Order' },
  { icon: Menu, label: 'Manage Menu' },
  { icon: Star, label: 'Customer Review' },
  { icon: Settings, label: 'Settings' },
  { icon: FileText, label: 'Reports' },
  { icon: CreditCard, label: 'Payment' },
  { icon: Wallet, label: 'Accounts' },
];

// Today's sales data
const todaySalesData = [
  { hour: '6pm', value: 2500 },
  { hour: '7pm', value: 3200 },
  { hour: '8pm', value: 4100 },
  { hour: '9pm', value: 3800 },
  { hour: '10pm', value: 4500 },
  { hour: '11pm', value: 5200 },
  { hour: '12am', value: 4800 },
];

// Timeline project data
const timelineData = [
  { month: '2pm', value: 40 },
  { month: '3pm', value: 33 },
  { month: '4pm', value: 28 },
  { month: '4pm', value: 35 },
];

// Deal stages
const dealStages = [
  {
    stage: 'Contacted',
    color: 'bg-red-100',
    textColor: 'text-red-600',
    deals: [
      { name: 'Bani Wasp', company: 'Corp Rspn', value: '430 Orders', amount: '24' },
      { name: 'Afflrmgy', company: 'Event Psny', value: '860 Ordis', amount: '24' },
    ]
  },
  {
    stage: 'Negotiation',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    deals: [
      { name: '2585% Remies', company: 'Sustnitnon-niqsny', value: 'Ms used Orders', amount: '' },
      { name: 'Firads Maps', company: 'Con-ar-trob-pq-provins', value: 'hinted seel', amount: '' },
    ]
  },
  {
    stage: 'Offer Sent',
    color: 'bg-blue-100',
    textColor: 'text-blue-600',
    deals: [
      { name: '71 Fiber', amount: '0' },
      { name: '4811 Ulse', value: 'Representation', amount: '41' },
      { name: 'Fissst Hares', company: 'Carbers-sq-prods', value: 'net censpyr', amount: '' },
    ]
  },
  {
    stage: 'Deal Closed',
    color: 'bg-green-100',
    textColor: 'text-green-600',
    deals: [
      { name: 'Magy Viness', company: 'Travelation of Doiclan', value: '$122,540', amount: '', arrow: true },
      { name: 'Braed Weng', company: 'hematiol ar Oxiclan', value: '$194,500', amount: '', arrow: true },
      { name: 'Alrik Close', company: 'Dissesedis at-GIG/2024', value: '$123,500', amount: '', arrow: true },
    ]
  },
];

// Comparison data
const comparisonData = [
  { day: 'Last 4 Days', value: 45000 },
  { day: 'Last Week', value: 62000 },
];

const SalesDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf8f5] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-orange-100 flex flex-col">
        <div className="p-4 border-b border-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="font-semibold text-gray-800">Dowace</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                item.active
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
                placeholder="Q. Search"
                className="pl-10 w-64 bg-orange-50/50 border-orange-100"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-orange-50 rounded-lg">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-sm text-gray-500">Settings</span>
              <span className="text-sm text-gray-500">Sortings</span>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">DW</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">Sales Dashboard</h1>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Today's Sales */}
            <Card className="col-span-4 bg-white shadow-sm border-0 rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Last 5 days</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-800 mb-1">$30,254.00</p>
                <p className="text-xs text-green-500 flex items-center gap-1 mb-4">
                  <ArrowUpRight className="w-3 h-3" />
                  + 2.14% vs last week
                </p>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={todaySalesData}>
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#d4a574" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Project */}
            <Card className="col-span-4 bg-white shadow-sm border-0 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Timeline Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-orange-100 rounded-full h-4">
                      <div className="bg-orange-400 h-4 rounded-full" style={{ width: '40%' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">40%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-orange-100 rounded-full h-4">
                      <div className="bg-orange-300 h-4 rounded-full" style={{ width: '33%' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">33%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-orange-100 rounded-full h-4">
                      <div className="bg-orange-200 h-4 rounded-full" style={{ width: '28%' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">28%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Viser Report */}
            <Card className="col-span-4 bg-white shadow-sm border-0 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Viser Report</CardTitle>
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
                      strokeDasharray={`${65 * 3.14} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400">Flexmode</span>
                    <span className="text-xs text-gray-400">for 45 demo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Pipeline */}
            <div className="col-span-12 grid grid-cols-4 gap-4">
              {dealStages.map((stage, stageIndex) => (
                <div key={stageIndex}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${stage.color} ${stage.textColor} text-xs`}>
                      {stage.stage}
                    </Badge>
                    <span className="text-xs text-gray-400">{stageIndex === 0 ? '0' : ''}</span>
                  </div>
                  <div className="space-y-3">
                    {stage.deals.map((deal, dealIndex) => (
                      <Card key={dealIndex} className="bg-white shadow-sm border-0 rounded-xl">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium text-gray-800">{deal.name}</p>
                          {deal.company && (
                            <p className="text-xs text-gray-500">{deal.company}</p>
                          )}
                          {deal.value && (
                            <p className={`text-sm font-semibold mt-1 ${deal.arrow ? 'text-green-600' : 'text-gray-600'}`}>
                              {deal.value}
                              {deal.arrow && <span className="ml-1">↗</span>}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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
                      strokeDasharray={`${87 * 2.2} 220`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-800">87%</span>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">Developed select</p>
              </div>

              <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-3xl font-bold text-gray-800 text-center">58</p>
                <p className="text-xs text-center text-gray-500 mt-2">Product Demos scheduled</p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="col-span-4 bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Ad Fill Rate by Blo</p>
              <p className="text-xs text-gray-400 mb-2">Automatic tracked</p>
              <p className="text-3xl font-bold text-gray-800">$123,500</p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-500">Standard by</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  <span className="text-gray-500">tax (2%Bldg)</span>
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="col-span-4 bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  <span className="text-xs text-gray-500">Last 4 Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  <span className="text-xs text-gray-500">Last Week</span>
                </div>
              </div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { day: '1', last4: 30, lastWeek: 25 },
                    { day: '2', last4: 45, lastWeek: 35 },
                    { day: '3', last4: 35, lastWeek: 42 },
                    { day: '4', last4: 55, lastWeek: 48 },
                    { day: '5', last4: 48, lastWeek: 52 },
                  ]}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="last4" stroke="#d4a574" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="lastWeek" stroke="#d1d5db" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
