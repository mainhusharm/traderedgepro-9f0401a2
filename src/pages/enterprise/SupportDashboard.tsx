import { useState, useEffect } from 'react';
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
  Bell,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface TicketData {
  id: string;
  title: string;
  description?: string;
  user: string;
  time: string;
  priority: string;
  category: string;
  color?: string;
  status: string;
}

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Real data states
  const [allTickets, setAllTickets] = useState<TicketData[]>([]);
  const [newTickets, setNewTickets] = useState<TicketData[]>([]);
  const [inProgressTickets, setInProgressTickets] = useState<TicketData[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<TicketData[]>([]);
  const [ticketCounts, setTicketCounts] = useState({ all: 0, new: 0, inProgress: 0, resolved: 0 });

  // Sidebar items
  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Ticket, label: 'Tickets', id: 'tickets', active: true },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: SettingsIcon, label: 'Automations', id: 'automations' },
    { icon: FileText, label: 'Docs', id: 'docs' },
    { icon: Users, label: 'Team', id: 'team' },
    { icon: Settings, label: 'Settings', id: 'settings' },
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Fetch all support tickets
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatTicket = (ticket: any): TicketData => ({
        id: ticket.id,
        title: ticket.subject || 'Untitled',
        description: ticket.description?.substring(0, 50) + '...',
        user: ticket.agent_name || 'Customer',
        time: formatTimeAgo(new Date(ticket.created_at)),
        priority: ticket.priority || 'medium',
        category: ticket.category || 'general',
        color: getPriorityColor(ticket.priority),
        status: ticket.status
      });

      const allFormatted = tickets?.map(formatTicket) || [];
      setAllTickets(allFormatted);

      // Filter by status
      const newOnes = allFormatted.filter(t => t.status === 'open');
      const inProgress = allFormatted.filter(t => t.status === 'in_progress' || t.status === 'pending');
      const resolved = allFormatted.filter(t => t.status === 'resolved' || t.status === 'closed');

      setNewTickets(newOnes);
      setInProgressTickets(inProgress);
      setResolvedTickets(resolved);

      setTicketCounts({
        all: allFormatted.length,
        new: newOnes.length,
        inProgress: inProgress.length,
        resolved: resolved.length
      });

    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} hrs`;
    return `${diffDays} days`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-400';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getTicketBorderColor = (color?: string) => {
    switch (color) {
      case 'red': return 'border-l-red-500';
      case 'orange': return 'border-l-orange-500';
      case 'green': return 'border-l-green-500';
      case 'blue': return 'border-l-blue-500';
      case 'purple': return 'border-l-purple-500';
      default: return 'border-l-gray-300';
    }
  };

  const filterTickets = (tickets: TicketData[]) => {
    if (!searchQuery) return tickets;
    return tickets.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const TicketCard = ({ ticket }: { ticket: TicketData }) => (
    <Card className={`bg-white shadow-sm border-l-4 ${getTicketBorderColor(ticket.color)} cursor-pointer hover:shadow-md transition-shadow`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <span className={`w-2 h-2 rounded-full ${getPriorityBadgeColor(ticket.priority)}`} />
          <span className="text-xs text-gray-400">{ticket.time}</span>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-1">{ticket.title}</p>
        {ticket.description && (
          <p className="text-xs text-gray-500 mb-2">{ticket.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-[10px] bg-gray-100">{ticket.user[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">{ticket.user}</span>
          </div>
          <Badge className="text-[10px] bg-gray-100 text-gray-600">{ticket.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-purple-100 flex flex-col">
        <div className="p-4 border-b border-purple-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-800">TraderEdge Support</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-purple-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-purple-50">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Quick Stats</span>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 mb-2">
            <p className="text-xs text-purple-700">Open Tickets: {ticketCounts.new}</p>
            <p className="text-xs text-purple-500">Resolved Today: {resolvedTickets.filter(t => t.time.includes('min') || t.time.includes('hrs')).length}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-purple-600 border-purple-200"
            onClick={() => navigate('/enterprise/operations')}
          >
            <Plus className="w-4 h-4 mr-1" />
            View Operations
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
                placeholder="Search tickets..."
                className="pl-10 w-64 bg-purple-50 border-purple-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-white px-1">⌘K</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Bell className="w-5 h-5 text-gray-400" />
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">SP</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Tickets Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Support Tickets</h1>
              <p className="text-sm text-gray-500 mt-1">
                {ticketCounts.all} total tickets • {ticketCounts.new} open
              </p>
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

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            /* Ticket Columns */
            <div className="grid grid-cols-4 gap-4">
              {/* All Tickets Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium text-gray-700">All Tickets</h3>
                  <Badge className="bg-purple-100 text-purple-600">({ticketCounts.all})</Badge>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filterTickets(allTickets).length > 0 ? filterTickets(allTickets).slice(0, 10).map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No tickets found</p>
                  )}
                </div>
              </div>

              {/* New Tickets Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium text-gray-700">New</h3>
                  <Badge className="bg-red-100 text-red-600">({ticketCounts.new})</Badge>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filterTickets(newTickets).length > 0 ? filterTickets(newTickets).map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No new tickets</p>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium text-gray-700">In Progress</h3>
                  <Badge className="bg-blue-100 text-blue-600">({ticketCounts.inProgress})</Badge>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filterTickets(inProgressTickets).length > 0 ? filterTickets(inProgressTickets).map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No tickets in progress</p>
                  )}
                </div>
              </div>

              {/* Resolved Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium text-gray-700">Resolved</h3>
                  <Badge className="bg-green-100 text-green-600">({ticketCounts.resolved})</Badge>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filterTickets(resolvedTickets).length > 0 ? filterTickets(resolvedTickets).map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No resolved tickets</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SupportDashboard;
