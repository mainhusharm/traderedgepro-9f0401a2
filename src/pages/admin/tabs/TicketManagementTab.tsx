import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAdminApi } from '@/hooks/useAdminApi';
import { toast } from 'sonner';

const TicketManagementTab = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolution, setResolution] = useState('');

  const { callAdminApi } = useAdminApi();

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_tickets', { 
        limit: 50,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setTickets(result.tickets || []);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      await callAdminApi('update_ticket', { ticketId, updates });
      toast.success('Ticket updated');
      fetchTickets();
      setSelectedTicket(null);
      setResolution('');
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-warning/20 text-warning">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/20 text-primary">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-success/20 text-success">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-risk/20 text-risk">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTickets}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-warning" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl bg-background/50 border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{ticket.subject}</h4>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <Badge variant="outline">{ticket.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <Badge variant="outline">{selectedTicket.category}</Badge>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
                {selectedTicket.resolved_at && (
                  <div>
                    <span className="text-muted-foreground">Resolved:</span>
                    <span className="ml-2">{new Date(selectedTicket.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedTicket.resolution && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <h5 className="font-medium text-success mb-2">Resolution</h5>
                  <p className="text-sm">{selectedTicket.resolution}</p>
                </div>
              )}

              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Note</label>
                  <Textarea
                    placeholder="Enter resolution details..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedTicket?.status === 'open' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateTicket(selectedTicket.id, { 
                  status: 'in_progress',
                  assigned_to: 'self'
                })}
              >
                <Clock className="w-4 h-4 mr-2" />
                Take Ticket
              </Button>
            )}
            {(selectedTicket?.status === 'open' || selectedTicket?.status === 'in_progress') && (
              <Button
                className="bg-success hover:bg-success/90"
                onClick={() => handleUpdateTicket(selectedTicket.id, { 
                  status: 'resolved',
                  resolution: resolution || 'Resolved by admin'
                })}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketManagementTab;
