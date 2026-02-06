import { motion } from 'framer-motion';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AIChatInterface from '@/components/marketing/AIChatInterface';
import { useSupportTickets } from '@/hooks/useMarketingData';

const AI_EMPLOYEE = { id: 'nova', name: 'NOVA', role: 'Virtual Receptionist', avatar: '👋', color: 'from-pink-500 to-rose-600' };

const ReceptionistTab = () => {
  const { tickets, isLoading } = useSupportTickets();

  // Derive stats from real data
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const totalTickets = tickets.length;

  const stats = [
    { label: 'Active Tickets', value: openTickets, color: 'text-pink-400' },
    { label: 'Resolved', value: resolvedTickets, color: 'text-green-400' },
    { label: 'Total', value: totalTickets, color: 'text-blue-400' },
    { label: 'Resolution Rate', value: totalTickets > 0 ? `${Math.round((resolvedTickets / totalTickets) * 100)}%` : '0%', color: 'text-amber-400' },
  ];

  // Recent tickets as queries
  const recentQueries = tickets.slice(0, 5).map(t => ({
    id: t.id,
    query: t.subject,
    response: t.status === 'resolved' ? 'Resolved successfully' : 'In progress',
    time: new Date(t.created_at).toLocaleString(),
    resolved: t.status === 'resolved'
  }));

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-pink-500/10 to-rose-600/10 border-pink-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-3xl shadow-lg`}>{AI_EMPLOYEE.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{AI_EMPLOYEE.name}</h2><Badge className="bg-green-500/20 text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />Online</Badge></div>
              <p className="text-muted-foreground">{AI_EMPLOYEE.role} - Ask me anything about visitor management!</p>
            </div>
            <div className="hidden md:grid grid-cols-4 gap-4">
              {stats.map((stat) => (<div key={stat.label} className="text-center"><p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[500px]">
          <AIChatInterface 
            employeeId={AI_EMPLOYEE.id}
            employeeName={AI_EMPLOYEE.name}
            employeeColor={AI_EMPLOYEE.color}
            placeholder="Ask NOVA about visitor management..."
          />
        </div>

        <div className="space-y-6">
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-pink-400" />Recent Support Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recentQueries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tickets yet. NOVA is ready to help!</p>
              ) : (
                recentQueries.map((q) => (
                  <div key={q.id} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-start gap-2">
                      {q.resolved ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.query}</p>
                        <p className="text-xs text-muted-foreground mt-1">{q.response}</p>
                        <p className="text-xs text-muted-foreground mt-1">{q.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistTab;
