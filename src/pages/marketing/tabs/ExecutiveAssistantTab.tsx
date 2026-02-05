import { Bot, Send, Calendar, Mail, Clock, CheckCircle2, Sparkles, User, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useMarketingAI } from '@/hooks/useMarketingAI';
import { useMarketingTasks } from '@/hooks/useMarketingData';
import { useState } from 'react';

const AI_EMPLOYEE = { id: 'aria', name: 'ARIA', role: 'Executive Assistant', avatar: '👩‍💼', color: 'from-violet-500 to-purple-600' };

const ExecutiveAssistantTab = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useMarketingAI(AI_EMPLOYEE.id);
  const { tasks, addTask, updateTask, deleteTask, isLoading: tasksLoading } = useMarketingTasks();
  const [input, setInput] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const todaysTasks = tasks.filter(t => t.status !== 'completed').slice(0, 5);
  const completedToday = tasks.filter(t => t.status === 'completed').length;

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask({ title: newTaskTitle, status: 'todo', priority: 'medium' });
    setNewTaskTitle('');
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    await updateTask(taskId, { status: currentStatus === 'completed' ? 'todo' : 'completed' });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-600/10 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AI_EMPLOYEE.color} flex items-center justify-center text-3xl shadow-lg`}>{AI_EMPLOYEE.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{AI_EMPLOYEE.name}</h2>
                <Badge className="bg-green-500/20 text-green-400"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />Online</Badge>
              </div>
              <p className="text-muted-foreground">{AI_EMPLOYEE.role}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              <p className="text-3xl font-bold text-violet-400">{completedToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-violet-400" />Chat with {AI_EMPLOYEE.name}</CardTitle>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-foreground">
                  Clear History
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with {AI_EMPLOYEE.name}</p>
                    <p className="text-sm">Ask about scheduling, tasks, or anything else!</p>
                  </div>
                )}
                {messages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={message.role === 'assistant' ? `bg-gradient-to-br ${AI_EMPLOYEE.color} text-white` : 'bg-primary/20'}>{message.role === 'assistant' ? AI_EMPLOYEE.name[0] : <User className="w-4 h-4" />}</AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8"><AvatarFallback className={`bg-gradient-to-br ${AI_EMPLOYEE.color} text-white`}>{AI_EMPLOYEE.name[0]}</AvatarFallback></Avatar>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input 
                placeholder={`Ask ${AI_EMPLOYEE.name} anything...`} 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                className="bg-white/5 border-white/10"
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} className="bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-violet-400" />Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  className="bg-white/5 border-white/10 text-sm"
                />
                <Button size="icon" onClick={handleAddTask} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tasksLoading ? (
                <div className="text-center text-muted-foreground py-4">Loading tasks...</div>
              ) : todaysTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">No pending tasks</div>
              ) : (
                todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 group">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={`w-4 h-4 rounded-full mt-1 border-2 ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-amber-500'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                      {task.due_date && <p className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur border-white/10">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-400" />Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setInput('Help me draft an email to a potential partner')}>
                <Mail className="w-4 h-4" /> Draft Email
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setInput('Help me schedule a meeting for next week')}>
                <Calendar className="w-4 h-4" /> Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAssistantTab;
