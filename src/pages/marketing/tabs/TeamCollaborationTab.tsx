import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, MessageSquare, ArrowRight, Zap, User, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useMarketingStats, useMarketingTasks } from '@/hooks/useMarketingData';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';

const AI_TEAM = [
  { id: 'aria', name: 'ARIA', role: 'Executive Assistant', avatar: '👩‍💼', color: 'from-violet-500 to-purple-600' },
  { id: 'blake', name: 'BLAKE', role: 'Lead Generation', avatar: '🎯', color: 'from-emerald-500 to-teal-600' },
  { id: 'nova', name: 'NOVA', role: 'Receptionist', avatar: '👋', color: 'from-pink-500 to-rose-600' },
  { id: 'sage', name: 'SAGE', role: 'SEO Blog Writer', avatar: '✍️', color: 'from-amber-500 to-orange-600' },
  { id: 'maya', name: 'MAYA', role: 'Social Media', avatar: '📱', color: 'from-cyan-500 to-blue-600' },
  { id: 'zoe', name: 'ZOE', role: 'Customer Support', avatar: '💬', color: 'from-indigo-500 to-purple-600' },
  { id: 'lexi', name: 'LEXI', role: 'Legal & Compliance', avatar: '⚖️', color: 'from-slate-500 to-gray-600' },
];

interface TeamMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

const TeamCollaborationTab = () => {
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useMarketingStats();
  const { tasks } = useMarketingTasks();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  // Calculate task counts per AI from task assignments
  const getTaskCount = (aiId: string) => {
    return tasks.filter(t => t.assigned_to === aiId && t.status !== 'completed').length;
  };

  const activeProjects: { id: number; title: string; participants: string[]; progress: number; status: 'active' | 'review' }[] = [];

  const handleSendMessage = async () => {
    if (!input.trim() || isResponding) return;
    
    const userMessage: TeamMessage = {
      id: Date.now().toString(),
      sender: 'You',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsResponding(true);

    try {
      // Get response from a random AI team member
      const randomAI = AI_TEAM[Math.floor(Math.random() * AI_TEAM.length)];
      
      const { data, error } = await callEdgeFunction('marketing-ai-chat', {
        employeeId: randomAI.id,
        messages: [{ role: 'user', content: input }]
      });

      if (error) throw error;

      const aiMessage: TeamMessage = {
        id: (Date.now() + 1).toString(),
        sender: randomAI.name,
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Team chat error:', err);
      toast.error('Failed to get team response');
    } finally {
      setIsResponding(false);
    }
  };

  const getAI = (name: string) => AI_TEAM.find(ai => ai.name === name);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />AI Team Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={refetchStats} disabled={statsLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {AI_TEAM.map((ai) => (
              <motion.div key={ai.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="relative inline-block">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ai.color} flex items-center justify-center text-2xl shadow-lg mx-auto`}>{ai.avatar}</div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-green-500" />
                </div>
                <p className="font-bold mt-2">{ai.name}</p>
                <p className="text-xs text-muted-foreground">{ai.role}</p>
                <Badge variant="outline" className="mt-1 text-xs">{getTaskCount(ai.id)} tasks</Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">{stats.totalLeads}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Blog Posts</p>
            </CardContent>
          </Card>
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-400">{stats.openTickets}</p>
              <p className="text-xs text-muted-foreground">Open Tickets</p>
            </CardContent>
          </Card>
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-cyan-400">{stats.totalSocialPosts}</p>
              <p className="text-xs text-muted-foreground">Social Posts</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10"><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />Team Chat</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    No team messages yet.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const ai = getAI(msg.sender);
                    const isUser = msg.sender === 'You';
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-10 h-10">
                          {ai ? (
                            <AvatarFallback className={`bg-gradient-to-br ${ai.color} text-white text-lg`}>{ai.avatar}</AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-primary/20"><User className="w-5 h-5" /></AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.sender}</span>
                            {ai && <span className="text-xs text-muted-foreground">{ai.role}</span>}
                          </div>
                          <div className={`rounded-2xl p-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                {isResponding && (
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10"><AvatarFallback className="bg-primary/20">...</AvatarFallback></Avatar>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input 
                placeholder="Message the team..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                className="bg-white/5 border-white/10"
                disabled={isResponding}
              />
              <Button onClick={handleSendMessage} disabled={isResponding}><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Active Projects</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No active projects yet.</p>
              ) : (
                activeProjects.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{c.title}</p>
                      <Badge className={c.status === 'review' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}>{c.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {c.participants.map((name) => {
                        const ai = getAI(name);
                        return (
                          <Avatar key={name} className="w-6 h-6">
                            <AvatarFallback className={`bg-gradient-to-br ${ai?.color} text-white text-xs`}>{ai?.avatar}</AvatarFallback>
                          </Avatar>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={c.progress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{c.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><ArrowRight className="w-5 h-5 text-primary" />Pending Tasks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tasks.filter(t => t.status !== 'completed').slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 rounded-lg bg-white/5">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                    <span className="text-xs text-muted-foreground">{task.status}</span>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status !== 'completed').length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No pending tasks</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaborationTab;
