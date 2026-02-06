import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Crown, Plus, MessageCircle, Clock, AlertCircle, CheckCircle2, 
  Loader2, Send, ArrowLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: 'high' | 'urgent' | 'critical';
  status: 'open' | 'in_progress' | 'pending_user' | 'resolved' | 'closed';
  category: string | null;
  response_sla_hours: number;
  first_response_at: string | null;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: 'user' | 'manager' | 'system';
  message: string;
  created_at: string;
}

const CATEGORIES = [
  'Account Issue',
  'Billing Question',
  'Feature Request',
  'Technical Support',
  'Strategy Consultation',
  'Other'
];

const WhiteGloveSupport = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'high' as const,
    category: ''
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'white_glove_ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('white_glove_support_tickets')
        .select('id, ticket_number, subject, description, priority, status, category, response_sla_hours, first_response_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as Ticket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('white_glove_ticket_messages')
        .select('id, sender_type, message, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createTicket = async () => {
    if (!user || !newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const insertData = {
        user_id: user.id,
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category || null
      };
      
      const { data, error } = await supabase
        .from('white_glove_support_tickets')
        .insert(insertData as any)
        .select('id, ticket_number, subject, description, priority, status, category, response_sla_hours, first_response_at, created_at')
        .single();

      if (error) throw error;

      // Add initial message
      await supabase
        .from('white_glove_ticket_messages')
        .insert({
          ticket_id: data.id,
          sender_id: user.id,
          sender_type: 'user',
          message: newTicket.description
        });

      toast.success(`Ticket ${data.ticket_number} created!`);
      setShowNewTicketDialog(false);
      setNewTicket({ subject: '', description: '', priority: 'high', category: '' });
      fetchTickets();
      setSelectedTicket(data as Ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('white_glove_ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          sender_type: 'user',
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'pending_user': return 'bg-orange-500/20 text-orange-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'high': return 'bg-yellow-500/20 text-yellow-400';
      case 'urgent': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Chat view for selected ticket
  if (selectedTicket) {
    return (
      <Card className="glass-card h-[600px] flex flex-col">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedTicket(null)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {selectedTicket.ticket_number}
                </span>
                <Badge className={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
              </div>
              <h3 className="font-semibold">{selectedTicket.subject}</h3>
            </div>
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender_type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.sender_type === 'system'
                      ? 'bg-muted/50 text-muted-foreground italic'
                      : 'bg-white/10'
                  }`}
                >
                  {msg.sender_type === 'manager' && (
                    <div className="flex items-center gap-1 text-xs text-primary mb-1">
                      <Crown className="w-3 h-3" />
                      Account Manager
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="bg-white/5 border-white/10"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Ticket list view
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            White-Glove Support
          </CardTitle>
          <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Priority Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={newTicket.priority}
                      onValueChange={(v: any) => setNewTicket(prev => ({ ...prev, priority: v }))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newTicket.category}
                      onValueChange={(v) => setNewTicket(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please describe your issue in detail..."
                    className="bg-white/5 border-white/10 min-h-[120px]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Expected first response: 1-6 hours</span>
                  </div>
                </div>

                <Button onClick={createTicket} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Submit Ticket'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Priority support with 1-6 hour response guarantee
        </p>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No Support Tickets</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a ticket to get priority support from our team
            </p>
            <Button onClick={() => setShowNewTicketDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {ticket.ticket_number}
                    </span>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <h4 className="font-medium mb-1">{ticket.subject}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhiteGloveSupport;
