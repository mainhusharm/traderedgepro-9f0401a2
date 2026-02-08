import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Settings as SettingsIcon,
  FileText,
  Users,
  Settings,
  LogOut,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  Bell,
  FileBarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Sidebar items
const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Ticket, label: 'Tickets', active: true },
  { icon: BarChart3, label: 'Analytics' },
  { icon: SettingsIcon, label: 'Automations' },
  { icon: FileText, label: 'Docs' },
  { icon: Users, label: 'Team' },
  { icon: Settings, label: 'Settings' },
];

// Tickets data organized by status
const ticketsData = {
  allTickets: [
    { id: 1, title: 'Build ticket', user: 'Christine', time: '10 min', priority: 'high', category: 'Build' },
    { id: 2, title: 'Payment issue', description: 'G: Sound mp3 Title', user: 'Hernias', time: '10 min', priority: 'medium', category: 'Payment' },
    { id: 3, title: 'Urgent', description: 'Tradition Sale, Includes', user: 'Hernias', time: '45 min', priority: 'urgent', category: 'Urgent' },
    { id: 4, title: 'Payment issues', description: 'CI SnapOut use priorities', user: 'Hernias', time: '26 min', priority: 'medium', category: 'Payment' },
    { id: 5, title: 'Twitter', user: 'Twitter', time: '05 Hrs', priority: 'low', category: 'Social' },
  ],
  newTickets: [
    { id: 1, title: 'App Bugs', description: 'Dr. Allywayne undefined team', user: 'User', time: '34 min', priority: 'high', category: 'Bug', color: 'red' },
    { id: 2, title: 'Password reset', description: 'Or Reductoin are 2 positionsr', user: 'Janet', time: '31 min', priority: 'medium', category: 'Auth', color: 'green' },
    { id: 3, title: 'Login problem', description: 'Saddress impacts', user: 'Remillia', time: '18 min', priority: 'medium', category: 'Auth', color: 'blue' },
  ],
  inProgress: [
    { id: 1, title: 'App Bug', description: 'Dr Elisabeths Carbngex', user: 'Hernias', time: '03 hrs', priority: 'high', category: 'Bug', color: 'purple' },
    { id: 2, title: 'Onboarding quest...', description: 'Dr Reportnors or Progess', user: 'Hernias', time: '01:01', priority: 'medium', category: 'Onboarding', color: 'blue' },
    { id: 3, title: 'Password reset', description: 'Or Abanconi mer 5 popliemts', user: 'Hernias', time: '01 Ohm', priority: 'medium', category: 'Auth', color: 'green' },
  ],
  resolved: [
    { id: 1, title: 'Onboarding', description: 'Problemactivating process', user: 'Hernias', time: '10 min', priority: 'resolved', category: 'Onboarding', color: 'green', subtext: 'surfing' },
    { id: 2, title: 'Login problem', description: 'Contactson-only CB3433', user: 'Hernias', time: '01 hrs', priority: 'resolved', category: 'Auth', color: 'blue' },
    { id: 3, title: 'Login problem', description: 'Ezilmz', user: 'Hernias', time: '60 Ratings', priority: 'resolved', category: 'Auth', color: 'purple' },
  ],
};

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Tickets', count: 320, color: 'bg-purple-100 text-purple-600' },
    { id: 'new', label: 'New', count: 75, color: 'bg-red-100 text-red-600' },
    { id: 'inProgress', label: 'In Progress', count: 112, color: 'bg-blue-100 text-blue-600' },
    { id: 'resolved', label: 'Resolved', count: 153, color: 'bg-green-100 text-green-600' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-400';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getTicketColor = (color?: string) => {
    switch (color) {
      case 'red': return 'border-l-red-500';
      case 'green': return 'border-l-green-500';
      case 'blue': return 'border-l-blue-500';
      case 'purple': return 'border-l-purple-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-purple-100 flex flex-col">
        <div className="p-4 border-b border-purple-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Career Coaches</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                item.active
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-purple-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* My Rules Section */}
        <div className="p-4 border-t border-purple-50">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">My Rules</span>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 mb-2">
            <p className="text-xs text-purple-700">Gain up one times 8 leser</p>
            <p className="text-xs text-purple-500">Start ring</p>
          </div>
          <Button size="sm" variant="outline" className="w-full text-purple-600 border-purple-200">
            <Plus className="w-4 h-4 mr-1" />
            Create a Rule
          </Button>
        </div>

        <div className="p-2 border-t border-purple-50">
          <button
            onClick={() => {
              sessionStorage.removeItem('enterprise_dashboard_session');
              navigate('/enterprise-login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-purple-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-purple-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Q. Search tickets..."
                className="pl-10 w-64 bg-purple-50 border-purple-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-white px-1">⌘K</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm text-gray-500">Payslip</button>
              <button className="text-sm text-gray-500">Report</button>
              <Bell className="w-5 h-5 text-gray-400" />
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">CC</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Tickets Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">All Tickets</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">All Ticket</span>
                <span className="text-xs text-gray-400">▼</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-gray-500">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-1" />
                New Ticket
              </Button>
            </div>
          </div>

          {/* Ticket Columns */}
          <div className="grid grid-cols-4 gap-4">
            {/* All Tickets Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-medium text-gray-700">All Tickets</h3>
                <Badge className="bg-purple-100 text-purple-600">(320)</Badge>
                <span className="text-gray-400">0 1</span>
              </div>
              <div className="space-y-3">
                {ticketsData.allTickets.map((ticket) => (
                  <Card key={ticket.id} className={`bg-white shadow-sm border-l-4 ${getTicketColor()}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                        <span className="text-xs text-gray-400">{ticket.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">{ticket.title}</p>
                      {ticket.description && (
                        <p className="text-xs text-gray-500 mb-2">{ticket.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-gray-100">{ticket.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{ticket.user}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* New Tickets Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-medium text-gray-700">New</h3>
                <Badge className="bg-red-100 text-red-600">(75)</Badge>
                <span className="text-gray-400">0 1</span>
              </div>
              <div className="space-y-3">
                {ticketsData.newTickets.map((ticket) => (
                  <Card key={ticket.id} className={`bg-white shadow-sm border-l-4 ${getTicketColor(ticket.color)}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`text-xs ${ticket.color === 'red' ? 'bg-red-100 text-red-600' : ticket.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {ticket.category}
                        </Badge>
                        <span className="text-xs text-gray-400">{ticket.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">{ticket.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-purple-100 text-purple-600">{ticket.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{ticket.user}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-medium text-gray-700">In Progress</h3>
                <Badge className="bg-blue-100 text-blue-600">(112)</Badge>
                <span className="text-gray-400">△ 1</span>
              </div>
              <div className="space-y-3">
                {ticketsData.inProgress.map((ticket) => (
                  <Card key={ticket.id} className={`bg-white shadow-sm border-l-4 ${getTicketColor(ticket.color)}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-blue-100 text-blue-600 text-xs">● Running</Badge>
                        <span className="text-xs text-gray-400">{ticket.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">{ticket.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-gray-100">{ticket.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{ticket.user}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Resolved Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-medium text-gray-700">Resolved</h3>
                <Badge className="bg-green-100 text-green-600">(153)</Badge>
              </div>
              <div className="space-y-3">
                {ticketsData.resolved.map((ticket) => (
                  <Card key={ticket.id} className={`bg-white shadow-sm border-l-4 ${getTicketColor(ticket.color)}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-green-100 text-green-600 text-xs">● Resolved</Badge>
                        <span className="text-xs text-gray-400">{ticket.time}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">{ticket.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{ticket.description}</p>
                      {ticket.subtext && (
                        <p className="text-xs text-purple-500 mb-2">{ticket.subtext}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-green-100 text-green-600">{ticket.user[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{ticket.user}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportDashboard;
