import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, MessageSquare, AlertTriangle, CheckCircle2, ArrowUpRight, ThumbsUp, ThumbsDown, User, Zap, Shield, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingAI } from '@/hooks/useMarketingAI';
import { useMarketingSupportTickets } from '@/hooks/useMarketingData';

const AI_EMPLOYEE = { id: 'zoe', name: 'ZOE', role: 'Customer Support Agent', avatar: '💬', color: 'from-indigo-500 to-purple-600' };

const CustomerSupportTab = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useMarketingAI(AI_EMPLOYEE.id);
  const { tickets, addTicket, updateTicket, deleteTicket, isLoading: ticketsLoading } = useMarketingSupportTickets();
  const [input, setInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ customer_name: '', customer_email: '', subject: '', priority: 'medium' });

  const openTickets = tickets.filter(t => t.status !== 'resolved');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  const aiHandledCount = tickets.filter(t => (t.ai_confidence || 0) > 80).length;

  const stats = [
    { label: 'Tickets Today', value: tickets.length, color: 'text-indigo-400' },
    { label: 'AI Resolved', value: tickets.length > 0 ? `${Math.round((aiHandledCount / tickets.length) * 100)}%` : '0%', color: 'text-green-400' },
    { label: 'Open', value: openTickets.length, color: 'text-blue-400' },
    { label: 'Resolved', value: resolvedTickets.length, color: 'text-amber-400' },
  ];

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleAddTicket = async () => {
    if (!newTicket.customer_name.trim() || !newTicket.subject.trim()) return;
    await addTicket({
      ...newTicket,
      ticket_number: `TKT-${Date.now().toString().slice(-6)}`,
      status: 'open',
      messages: []
    });
    setNewTicket({ customer_name: '', customer_email: '', subject: '', priority: 'medium' });
    setIsAddDialogOpen(false);
  };

  const getPriorityColor = (p: string) => ({ high: 'bg-red-500/20 text-red-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-green-500/20 text-green-400' }[p] || 'bg-gray-500/20 text-gray-400');
  const getStatusColor = (s: string) => ({ open: 'bg-blue-500/20 text-blue-400', in_progress: 'bg-amber-500/20 text-amber-400', resolved: 'bg-green-500/20 text-green-400', escalated: 'bg-red-500/20 text-red-400' }[s] || 'bg-gray-500/20 text-gray-400');

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border-indigo-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-3xl shadow-lg`}>{AI_EMPLOYEE.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{AI_EMPLOYEE.name}</h2><Badge className="bg-green-500/20 text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />Online</Badge></div>
              <p className="text-muted-foreground">{AI_EMPLOYEE.role}</p>
            </div>
            <div className="hidden md:grid grid-cols-4 gap-4">
              {stats.map((stat) => (<div key={stat.label} className="text-center"><p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-400" />Support Tickets<Badge className="ml-2">{openTickets.length} open</Badge></CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" /> New Ticket</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Customer Name *" value={newTicket.customer_name} onChange={(e) => setNewTicket({ ...newTicket, customer_name: e.target.value })} />
                    <Input placeholder="Customer Email" type="email" value={newTicket.customer_email || ''} onChange={(e) => setNewTicket({ ...newTicket, customer_email: e.target.value })} />
                    <Input placeholder="Subject *" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
                    <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddTicket} className="w-full bg-indigo-600 hover:bg-indigo-700">Create Ticket</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ticketsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No tickets yet</div>
            ) : (
              <Table>
                <TableHeader><TableRow className="border-white/10"><TableHead>Ticket</TableHead><TableHead>Customer</TableHead><TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>AI Confidence</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tickets.slice(0, 10).map((t) => (
                    <TableRow key={t.id} className="border-white/10">
                      <TableCell className="font-mono text-sm">{t.ticket_number}</TableCell>
                      <TableCell>{t.customer_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.subject}</TableCell>
                      <TableCell><Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge></TableCell>
                      <TableCell>
                        <Select value={t.status} onValueChange={(value) => updateTicket(t.id, { status: value, resolved_at: value === 'resolved' ? new Date().toISOString() : null })}>
                          <SelectTrigger className={`w-28 h-7 ${getStatusColor(t.status)} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={t.ai_confidence || 0} className="w-16 h-2" /><span className="text-sm">{t.ai_confidence || 0}%</span></div></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTicket(t.id, { status: 'resolved', resolved_at: new Date().toISOString() })}><CheckCircle2 className="w-4 h-4 text-green-400" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateTicket(t.id, { status: 'escalated' })}><ArrowUpRight className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-400" />Chat with {AI_EMPLOYEE.name}</CardTitle>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-foreground text-xs">Clear</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Ask {AI_EMPLOYEE.name} about support</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8"><AvatarFallback className={msg.role === 'assistant' ? `bg-gradient-to-br ${AI_EMPLOYEE.color} text-white` : 'bg-primary/20'}>{msg.role === 'assistant' ? AI_EMPLOYEE.name[0] : <User className="w-4 h-4" />}</AvatarFallback></Avatar>
                    <div className={`max-w-[80%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10'}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div>
                  </motion.div>
                ))}
                {isLoading && <div className="flex gap-3"><Avatar className="w-8 h-8"><AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white`}>{AI_EMPLOYEE.name[0]}</AvatarFallback></Avatar><div className="bg-white/5 border border-white/10 rounded-2xl p-3"><div className="flex gap-1"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" /><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" /></div></div></div>}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input placeholder="Manage support..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10" disabled={isLoading} />
              <Button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background/50 backdrop-blur border-white/10"><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"><ThumbsUp className="w-8 h-8 text-green-400" /></div><p className="text-3xl font-bold text-green-400">{resolvedTickets.length}</p><p className="text-sm text-muted-foreground">Resolved Tickets</p></CardContent></Card>
        <Card className="bg-background/50 backdrop-blur border-white/10"><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-amber-400" /></div><p className="text-3xl font-bold text-amber-400">{tickets.filter(t => t.status === 'escalated').length}</p><p className="text-sm text-muted-foreground">Escalated</p></CardContent></Card>
        <Card className="bg-background/50 backdrop-blur border-white/10"><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-indigo-400" /></div><p className="text-3xl font-bold text-indigo-400">{tickets.length > 0 ? Math.round((resolvedTickets.length / tickets.length) * 100) : 0}%</p><p className="text-sm text-muted-foreground">Resolution Rate</p></CardContent></Card>
      </div>
    </div>
  );
};

export default CustomerSupportTab;
