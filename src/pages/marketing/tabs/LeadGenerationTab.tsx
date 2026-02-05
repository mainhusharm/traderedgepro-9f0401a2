import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Target, TrendingUp, Users, Building2, Plus, Phone, Mail, Globe, User, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingAI } from '@/hooks/useMarketingAI';
import { useMarketingLeads } from '@/hooks/useMarketingData';

const AI_EMPLOYEE = { id: 'blake', name: 'BLAKE', role: 'Lead Generation Specialist', avatar: '🎯', color: 'from-emerald-500 to-teal-600' };

const LeadGenerationTab = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useMarketingAI(AI_EMPLOYEE.id);
  const { leads, addLead, updateLead, deleteLead, isLoading: leadsLoading } = useMarketingLeads();
  const [input, setInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({ company_name: '', contact_name: '', email: '', phone: '', source: '', status: 'new' });

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-emerald-400' },
    { label: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, icon: Target, color: 'text-blue-400' },
    { label: 'Conversion', value: leads.length > 0 ? `${Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)}%` : '0%', icon: TrendingUp, color: 'text-green-400' },
    { label: 'This Month', value: leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length, icon: Building2, color: 'text-purple-400' },
  ];

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleAddLead = async () => {
    if (!newLead.company_name.trim()) return;
    await addLead(newLead);
    setNewLead({ company_name: '', contact_name: '', email: '', phone: '', source: '', status: 'new' });
    setIsAddDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { 
      new: 'bg-blue-500/20 text-blue-400', 
      contacted: 'bg-amber-500/20 text-amber-400', 
      qualified: 'bg-emerald-500/20 text-emerald-400', 
      negotiating: 'bg-purple-500/20 text-purple-400',
      converted: 'bg-green-500/20 text-green-400',
      lost: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-3xl shadow-lg`}>{AI_EMPLOYEE.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h2 className="text-2xl font-bold">{AI_EMPLOYEE.name}</h2><Badge className="bg-green-500/20 text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />Online</Badge></div>
              <p className="text-muted-foreground">{AI_EMPLOYEE.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-background/50 backdrop-blur border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-emerald-400" />Chat with {AI_EMPLOYEE.name}</CardTitle>
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
                    <p className="text-sm">Ask {AI_EMPLOYEE.name} about leads</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8"><AvatarFallback className={msg.role === 'assistant' ? `bg-gradient-to-br ${AI_EMPLOYEE.color} text-white` : 'bg-primary/20'}>{msg.role === 'assistant' ? AI_EMPLOYEE.name[0] : <User className="w-4 h-4" />}</AvatarFallback></Avatar>
                    <div className={`max-w-[80%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10'}`}><p className="text-sm whitespace-pre-wrap">{msg.content}</p></div>
                  </motion.div>
                ))}
                {isLoading && <div className="flex gap-3"><Avatar className="w-8 h-8"><AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white`}>{AI_EMPLOYEE.name[0]}</AvatarFallback></Avatar><div className="bg-white/5 border border-white/10 rounded-2xl p-3"><div className="flex gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100" /><span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200" /></div></div></div>}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input placeholder="Ask about leads..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10" disabled={isLoading} />
              <Button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle>Lead Pipeline</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Add Lead</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Company Name *" value={newLead.company_name} onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })} />
                    <Input placeholder="Contact Name" value={newLead.contact_name || ''} onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })} />
                    <Input placeholder="Email" type="email" value={newLead.email || ''} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                    <Input placeholder="Phone" value={newLead.phone || ''} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                    <Input placeholder="Source (e.g., Website, Referral)" value={newLead.source || ''} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} />
                    <Button onClick={handleAddLead} className="w-full bg-emerald-600 hover:bg-emerald-700">Add Lead</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {leadsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No leads yet. Add your first lead!</div>
            ) : (
              <Table>
                <TableHeader><TableRow className="border-white/10"><TableHead>Company</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="border-white/10">
                      <TableCell className="font-medium">{lead.company_name}</TableCell>
                      <TableCell><p className="text-sm">{lead.contact_name || '-'}</p><p className="text-xs text-muted-foreground">{lead.email || '-'}</p></TableCell>
                      <TableCell>
                        <Select value={lead.status} onValueChange={(value) => updateLead(lead.id, { status: value })}>
                          <SelectTrigger className={`w-28 h-7 ${getStatusColor(lead.status)} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="negotiating">Negotiating</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${lead.score || 0}%` }} />
                          </div>
                          <span className="text-sm">{lead.score || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {lead.email && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`mailto:${lead.email}`)}><Mail className="w-4 h-4" /></Button>}
                          {lead.phone && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`tel:${lead.phone}`)}><Phone className="w-4 h-4" /></Button>}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => deleteLead(lead.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadGenerationTab;
