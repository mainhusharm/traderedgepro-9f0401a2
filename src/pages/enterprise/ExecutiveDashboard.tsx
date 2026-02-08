import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Clock,
  Copy,
  FileText,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Send,
  Globe,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Sidebar items
const sidebarItems = [
  { icon: LayoutGrid, active: true },
  { icon: Clock },
  { icon: Copy },
  { icon: FileText },
];

// Savings chart data
const savingsData = [
  { day: 'Saturday', value: 12 },
  { day: 'Sunday', value: 15 },
  { day: 'Monday', value: 18 },
  { day: 'Tuesday', value: 25 },
  { day: 'Wednesday', value: 22 },
  { day: 'Thursday', value: 28 },
];

// Transaction chart data
const transactionData = [
  { day: 'Sunday', insert: 35, expense: 20 },
  { day: 'Sunday', insert: 50, expense: 25 },
  { day: 'Monday', insert: 40, expense: 18 },
  { day: 'Tuesday', insert: 30, expense: 35 },
  { day: 'Wednesday', insert: 45, expense: 22 },
  { day: 'Thursday', insert: 55, expense: 28 },
];

// Invoice data
const invoiceData = [
  { name: 'Gregory McBride', invoiceId: '#K2SJ79', avatar: 'GM' },
  { name: 'Joseph Powell', invoiceId: '#K2 P1GR', avatar: 'JP' },
  { name: 'Jared Pinto', invoiceId: '#KM/024', avatar: 'JP' },
  { name: 'Jared Pinto', invoiceId: '#FX/P1J34', avatar: 'JP' },
];

// Last transactions
const lastTransactions = [
  { name: 'Cameron Watkins', date: '29 April 2023', amount: '+$235.78 USD', type: 'credit' },
  { name: 'Georgia Goddard', date: '26 April 2023', amount: '-$145.99 USD', type: 'debit' },
  { name: 'Bailey Thorpe', date: '21 April 2023', amount: '+$235.76 USD', type: 'credit' },
  { name: 'Emma Andrews', date: '18 April 2023', amount: '-$12.29 USD', type: 'debit' },
];

const ExecutiveDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Dark Sidebar */}
      <aside className="w-16 bg-[#1a1a2e] flex flex-col items-center py-6">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-8">
          <span className="text-white text-lg">↩</span>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                item.active
                  ? 'bg-white/20 text-white'
                  : 'text-gray-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            sessionStorage.removeItem('enterprise_dashboard_session');
            navigate('/enterprise-login');
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Account Overview */}
            <div className="col-span-3 space-y-4">
              {/* Current Amount */}
              <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-3xl font-bold text-gray-800">$6,21,982.70</p>
                  <p className="text-xs text-gray-500">Current Account</p>
                </CardContent>
              </Card>

              {/* Deposits & Withdraw */}
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">$2,18,571</p>
                    <p className="text-xs text-gray-500">Deposits</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">$1,21,927</p>
                    <p className="text-xs text-gray-500">Withdraw</p>
                  </div>
                </div>
              </div>

              {/* Credit Limits */}
              <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-gray-500">Credit Limits</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">$128 - $2013</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Quote Limits</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">$321 - $1,234</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              {/* Your Invoice */}
              <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Your Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {invoiceData.map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">{invoice.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{invoice.name}</p>
                          <p className="text-xs text-gray-400">Invoice ID: {invoice.invoiceId}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-xs text-blue-500 p-0">
                    View All Invoice
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Financial Dashboard */}
            <div className="col-span-5 space-y-4">
              <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">Financial Dashboard</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Savings Chart */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Savings</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Weekly</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={savingsData}>
                          <defs>
                            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1a1a2e" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#1a1a2e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis hide />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#1a1a2e" fill="url(#savingsGradient)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <span>Tax</span>
                      <span className="font-medium">12.25</span>
                      <span className="text-gray-300">|</span>
                      <span>Cap</span>
                      <span className="font-medium">13.25</span>
                    </div>
                  </div>

                  {/* Transaction Chart */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Transaction</p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-800 rounded-full" />
                          <span className="text-gray-500">Insert</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          <span className="text-gray-500">Expense</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactionData}>
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis hide />
                          <Tooltip />
                          <Bar dataKey="insert" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Expense Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Expense</p>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-lg font-bold text-gray-800">$14,591</p>
                        <p className="text-xs text-gray-400">Household</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">$19,123</p>
                        <p className="text-xs text-gray-400">Utility Bill</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">$21,859</p>
                        <p className="text-xs text-gray-400">Food</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">$12,724</p>
                        <p className="text-xs text-gray-400">Entertainment</p>
                      </div>
                    </div>
                  </div>

                  {/* Webinar Banner */}
                  <div className="mt-6 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">👨‍💼</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Join Figest Webinar of the</p>
                        <p className="text-sm font-medium text-gray-800">Year: Cash Knowledge from</p>
                        <p className="text-sm font-medium text-gray-800">Expert</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-gray-800 hover:bg-gray-900 text-white">
                      Let's Try
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Cards & Transactions */}
            <div className="col-span-4 space-y-4">
              {/* Credit Cards */}
              <div className="flex gap-4">
                <Card className="flex-1 bg-[#1a1a2e] text-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-8 h-6 bg-yellow-400 rounded" />
                      <span className="text-xs opacity-60">VISA</span>
                    </div>
                    <p className="text-lg font-mono tracking-wider mb-2">**** 98765</p>
                    <div className="flex justify-between text-xs">
                      <div>
                        <p className="opacity-60">Exp</p>
                        <p>12.25</p>
                      </div>
                      <div>
                        <p className="opacity-60">Cap</p>
                        <p>13.25</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-1 bg-gray-100 shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-8 h-6 bg-gray-400 rounded" />
                      <span className="text-xs text-gray-400">VI</span>
                    </div>
                    <p className="text-lg font-mono tracking-wider text-gray-800 mb-2">**** 98</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <div>
                        <p>Exp</p>
                        <p>12.25</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Card className="flex-1 bg-white shadow-sm border-0 rounded-xl cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Send className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Bank Transfer</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </CardContent>
                </Card>

                <Card className="flex-1 bg-white shadow-sm border-0 rounded-xl cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Global Transfer</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </CardContent>
                </Card>
              </div>

              {/* Last Transaction */}
              <Card className="bg-white shadow-sm border-0 rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">Last Transaction</CardTitle>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lastTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`text-xs ${
                            transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{transaction.name}</p>
                          <p className="text-xs text-gray-400">{transaction.date}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveDashboard;
