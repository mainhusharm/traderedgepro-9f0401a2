import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Scale, FileText, AlertTriangle, CheckCircle2, Shield, BookOpen, User, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingAI } from '@/hooks/useMarketingAI';
import { useMarketingComplianceReviews } from '@/hooks/useMarketingData';

const AI_EMPLOYEE = {
  id: 'lexi',
  name: 'LEXI',
  role: 'Legal & Compliance Assistant',
  avatar: '⚖️',
  color: 'from-slate-500 to-gray-600',
  description: 'AI-powered legal and compliance assistant ensuring all marketing content follows regulations.'
};

const LegalComplianceTab = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useMarketingAI(AI_EMPLOYEE.id);
  const { reviews, addReview, updateReview, deleteReview, isLoading: reviewsLoading } = useMarketingComplianceReviews();
  const [input, setInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({ content_title: '', content_type: 'blog_post', status: 'pending' });

  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const flaggedCount = reviews.filter(r => r.status === 'flagged').length;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  const stats = [
    { label: 'Content Reviewed', value: reviews.length, color: 'text-slate-400' },
    { label: 'Compliance Rate', value: reviews.length > 0 ? `${Math.round((approvedCount / reviews.length) * 100)}%` : '0%', color: 'text-green-400' },
    { label: 'Issues Flagged', value: flaggedCount, color: 'text-amber-400' },
    { label: 'Pending', value: pendingCount, color: 'text-blue-400' },
  ];

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleAddReview = async () => {
    if (!newReview.content_title.trim()) return;
    await addReview(newReview);
    setNewReview({ content_title: '', content_type: 'blog_post', status: 'pending' });
    setIsAddDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'flagged': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-slate-500/10 to-gray-600/10 border-slate-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-3xl shadow-lg`}>{AI_EMPLOYEE.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{AI_EMPLOYEE.name}</h2>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />Online</Badge>
              </div>
              <p className="text-muted-foreground">{AI_EMPLOYEE.role}</p>
              <p className="text-sm text-muted-foreground mt-1">{AI_EMPLOYEE.description}</p>
            </div>
            <div className="hidden md:grid grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-slate-400" />Compliance Review Queue</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-600 hover:bg-slate-700"><Plus className="w-4 h-4 mr-2" /> Add Review</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Content for Review</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Content Title *" value={newReview.content_title} onChange={(e) => setNewReview({ ...newReview, content_title: e.target.value })} />
                    <Select value={newReview.content_type} onValueChange={(value) => setNewReview({ ...newReview, content_type: value })}>
                      <SelectTrigger><SelectValue placeholder="Content Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog_post">Blog Post</SelectItem>
                        <SelectItem value="social_post">Social Post</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                        <SelectItem value="landing_page">Landing Page</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddReview} className="w-full bg-slate-600 hover:bg-slate-700">Submit for Review</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {reviewsLoading ? (
              <div className="text-center text-muted-foreground py-4">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No content for review. Add content to get started!</div>
            ) : (
              reviews.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{item.content_title}</p>
                    </div>
                    {item.issues && item.issues.length > 0 && (
                      <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {item.issues.join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{item.content_type.replace('_', ' ')} • {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <Select value={item.status} onValueChange={(value) => updateReview(item.id, { status: value, reviewed_at: value !== 'pending' ? new Date().toISOString() : null })}>
                    <SelectTrigger className={`w-28 h-8 ${getStatusColor(item.status)} border-0`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => deleteReview(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-slate-400" />Chat with {AI_EMPLOYEE.name}</CardTitle>
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
                    <p className="text-sm">Ask {AI_EMPLOYEE.name} about compliance</p>
                  </div>
                )}
                {messages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8">
                      {message.role === 'assistant' ? (
                        <AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white`}>{AI_EMPLOYEE.name[0]}</AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-primary/20"><User className="w-4 h-4" /></AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`max-w-[80%] rounded-2xl p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8"><AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white`}>{AI_EMPLOYEE.name[0]}</AvatarFallback></Avatar>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input placeholder="Ask about compliance..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10" disabled={isLoading} />
                <Button onClick={handleSendMessage} className="bg-slate-600 hover:bg-slate-700" disabled={isLoading}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-background/50 backdrop-blur border-white/10 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => sendMessage('Generate a standard risk disclaimer for prop trading content')}>
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium">Risk Disclaimer</p>
            <p className="text-xs text-muted-foreground">Generate standard disclaimer</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur border-white/10 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => sendMessage('Review our terms and conditions for any compliance issues')}>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium">Terms Review</p>
            <p className="text-xs text-muted-foreground">Check terms & conditions</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur border-white/10 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => sendMessage('Perform a full compliance audit on our marketing content')}>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium">Content Audit</p>
            <p className="text-xs text-muted-foreground">Full compliance scan</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur border-white/10 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => sendMessage('What are the latest regulatory updates affecting prop trading marketing?')}>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium">Regulatory Updates</p>
            <p className="text-xs text-muted-foreground">Latest compliance news</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalComplianceTab;
