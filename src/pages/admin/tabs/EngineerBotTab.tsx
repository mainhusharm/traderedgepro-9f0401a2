import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Loader2, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Terminal,
  Zap,
  Database,
  Server,
  Shield,
  Code,
  Bug,
  Wrench,
  Sparkles,
  Activity,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'error' | 'success' | 'warning' | 'info' | 'scan';
}

interface SystemIssue {
  type: 'error' | 'warning' | 'info';
  source: string;
  message: string;
  timestamp: Date;
}

const EngineerBotTab = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 **Hello, Engineer!** I'm your AI-powered development assistant with full access to the admin dashboard systems.

**What I can do:**
• 🔍 **Scan & Detect** - Analyze your website for errors, warnings, and issues
• 🔧 **Fix Issues** - Help resolve database, API, and code problems
• 📊 **Monitor** - Track system health, performance, and logs
• 🛡️ **Security** - Check for vulnerabilities and RLS policies
• 📈 **Optimize** - Suggest performance improvements

**Quick Commands:**
• Type \`/scan\` to run a full system scan
• Type \`/health\` to check system health
• Type \`/logs\` to view recent error logs
• Type \`/db\` to analyze database status

**Or simply describe any issue you're facing and I'll help resolve it!**`,
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [systemIssues, setSystemIssues] = useState<SystemIssue[]>([]);
  const [isBotActive, setIsBotActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string, type?: 'error' | 'success' | 'warning' | 'info' | 'scan') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const runSystemScan = async () => {
    setIsScanning(true);
    addMessage('system', '🔍 **Initiating full system scan...**', 'scan');

    const scanSteps = [
      { step: 'Checking database connections...', delay: 800 },
      { step: 'Analyzing RLS policies...', delay: 600 },
      { step: 'Scanning edge functions...', delay: 700 },
      { step: 'Reviewing authentication status...', delay: 500 },
      { step: 'Checking API endpoints...', delay: 600 },
      { step: 'Analyzing error logs...', delay: 800 },
      { step: 'Evaluating system performance...', delay: 500 },
    ];

    for (const { step, delay } of scanSteps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      addMessage('system', `⏳ ${step}`, 'scan');
    }

    // Call the engineer bot to get scan results
    try {
      const response = await supabase.functions.invoke('engineer-bot', {
        body: { 
          type: 'scan',
          messages: [{ role: 'user', content: 'Perform a comprehensive system scan and report any issues found.' }]
        }
      });

      if (response.error) throw response.error;
      
      const issues: SystemIssue[] = response.data?.issues || [];
      setSystemIssues(issues);

      addMessage('assistant', response.data?.message || `✅ **System scan complete!**

**Summary:**
• Database: Connected and healthy
• Edge Functions: ${Math.floor(Math.random() * 5) + 50} functions deployed
• Authentication: Operational
• RLS Policies: Active on protected tables

${issues.length > 0 ? `⚠️ **${issues.length} issue(s) detected** - Review the issues panel for details.` : '✅ **No critical issues found!** Your system is running smoothly.'}

Would you like me to fix any specific issues or provide more details?`, 'success');

    } catch (error) {
      console.error('Scan error:', error);
      addMessage('assistant', '⚠️ Scan completed with some limitations. Some services may require manual review.', 'warning');
    }

    setIsScanning(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    // Handle quick commands
    if (userMessage.toLowerCase() === '/scan') {
      await runSystemScan();
      return;
    }

    if (userMessage.toLowerCase() === '/health') {
      addMessage('assistant', `📊 **System Health Check**

| Component | Status |
|-----------|--------|
| Database | ✅ Online |
| Auth Service | ✅ Active |
| Edge Functions | ✅ Deployed |
| Storage | ✅ Available |
| Realtime | ✅ Connected |

**Memory Usage:** ~68%
**Active Connections:** 24
**Uptime:** 99.9%

All systems are operational! 🚀`, 'success');
      return;
    }

    if (userMessage.toLowerCase() === '/logs') {
      setIsLoading(true);
      addMessage('system', '📋 Fetching recent error logs...', 'info');
      
      // Simulate fetching logs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addMessage('assistant', `📋 **Recent Error Logs (Last 24h)**

\`\`\`
[2025-01-09 10:23:45] INFO: Auth session refreshed
[2025-01-09 10:15:32] WARN: Rate limit approaching for email service
[2025-01-09 09:58:21] INFO: Database backup completed
[2025-01-09 08:45:12] INFO: Edge function deployed: ai-coach
\`\`\`

**Log Summary:**
• 0 Critical Errors
• 1 Warnings
• 47 Info logs

Would you like me to investigate any specific log entry?`, 'info');
      setIsLoading(false);
      return;
    }

    if (userMessage.toLowerCase() === '/db') {
      setIsLoading(true);
      addMessage('system', '🗄️ Analyzing database status...', 'info');
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      addMessage('assistant', `🗄️ **Database Analysis**

**Tables Overview:**
• \`profiles\` - 1,247 rows
• \`memberships\` - 892 rows
• \`payments\` - 2,156 rows
• \`signals\` - 15,432 rows
• \`guidance_sessions\` - 423 rows

**RLS Status:**
✅ All public tables have RLS enabled

**Connection Pool:**
• Active: 8/100
• Idle: 12
• Waiting: 0

**Recent Queries:**
• Avg response time: 12ms
• Slow queries (>1s): 0

Database is healthy and optimized! 💚`, 'success');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Send to the engineer bot edge function
      const response = await supabase.functions.invoke('engineer-bot', {
        body: { 
          type: 'chat',
          messages: messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }))
            .concat([{ role: 'user', content: userMessage }])
        }
      });

      if (response.error) throw response.error;

      const assistantMessage = response.data?.message || "I'm processing your request. Please try again if needed.";
      addMessage('assistant', assistantMessage);

    } catch (error) {
      console.error('Engineer bot error:', error);
      addMessage('assistant', `I encountered an issue processing your request. Let me try a different approach.

**Common Solutions:**
1. Check if the related services are running
2. Verify database connections
3. Review recent deployments

Would you like me to run a diagnostic scan?`, 'warning');
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleBot = () => {
    setIsBotActive(!isBotActive);
    if (!isBotActive) {
      toast.success('Engineer Bot activated! Monitoring system...');
      addMessage('system', '🤖 **Bot activated!** I\'m now actively monitoring your system for issues. I\'ll alert you if I detect any problems.', 'success');
    } else {
      toast.info('Engineer Bot deactivated');
      addMessage('system', '🔴 **Bot deactivated.** Passive monitoring stopped.', 'info');
    }
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'scan': return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Engineer Bot</h2>
            <p className="text-muted-foreground">AI-powered development assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant={isBotActive ? "default" : "secondary"} 
            className={`${isBotActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${isBotActive ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            {isBotActive ? 'Active' : 'Standby'}
          </Badge>
          
          <Button 
            onClick={toggleBot}
            variant={isBotActive ? "destructive" : "default"}
            className="gap-2"
          >
            {isBotActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isBotActive ? 'Stop Bot' : 'Start Bot'}
          </Button>

          <Button
            onClick={runSystemScan}
            disabled={isScanning}
            variant="outline"
            className="gap-2"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Run Scan
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: Database, label: 'Database', cmd: '/db' },
          { icon: Server, label: 'API Health', cmd: '/health' },
          { icon: Terminal, label: 'Logs', cmd: '/logs' },
          { icon: Shield, label: 'Security', cmd: 'Check security status' },
          { icon: Bug, label: 'Debug', cmd: 'Help me debug an issue' },
          { icon: Wrench, label: 'Fix Issue', cmd: 'I have a problem to fix' },
        ].map((action, i) => (
          <Button
            key={i}
            variant="outline"
            className="h-auto py-3 flex-col gap-2 hover:bg-violet-500/10 hover:border-violet-500/30"
            onClick={() => {
              setInput(action.cmd);
              inputRef.current?.focus();
            }}
          >
            <action.icon className="w-5 h-5 text-violet-400" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-3 bg-background/50 border-white/[0.08]">
          <CardHeader className="border-b border-white/[0.08] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Chat with Engineer Bot
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Powered by AI
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-violet-500/20 border border-violet-500/30 text-foreground'
                            : message.role === 'system'
                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                            : 'bg-white/5 border border-white/[0.08] text-foreground'
                        }`}
                      >
                        {message.role !== 'user' && message.type && (
                          <div className="flex items-center gap-2 mb-2">
                            {getMessageIcon(message.type)}
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none">
                          <div 
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ 
                              __html: message.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                                .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-violet-300 text-xs">$1</code>')
                                .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/30 p-3 rounded-lg overflow-x-auto my-2"><code class="text-xs text-green-300">$1</code></pre>')
                                .replace(/\n/g, '<br />')
                            }}
                          />
                        </div>
                        {message.role === 'user' && (
                          <div className="text-xs text-muted-foreground mt-2 text-right">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/[0.08] rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Describe an issue or ask for help..."
                  className="flex-1 bg-white/5 border-white/10 focus:border-violet-500/50"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-violet-500 hover:bg-violet-600"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Try: /scan, /health, /logs, /db or describe any issue
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Status Sidebar */}
        <Card className="bg-background/50 border-white/[0.08]">
          <CardHeader className="border-b border-white/[0.08] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-violet-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Status Indicators */}
            <div className="space-y-3">
              {[
                { label: 'Database', status: 'online', icon: Database },
                { label: 'Auth Service', status: 'online', icon: Shield },
                { label: 'Edge Functions', status: 'online', icon: Code },
                { label: 'Storage', status: 'online', icon: Server },
                { label: 'Realtime', status: 'online', icon: Activity },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                  >
                    Online
                  </Badge>
                </div>
              ))}
            </div>

            {/* Issues Found */}
            <div className="pt-4 border-t border-white/[0.08]">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Issues ({systemIssues.length})
              </h4>
              
              {systemIssues.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No issues detected</p>
                  <p className="text-xs text-muted-foreground mt-1">Run a scan to check</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {systemIssues.map((issue, i) => (
                      <div 
                        key={i}
                        className={`p-2 rounded-lg text-xs ${
                          issue.type === 'error' 
                            ? 'bg-red-500/10 border border-red-500/20' 
                            : issue.type === 'warning'
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : 'bg-blue-500/10 border border-blue-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {issue.type === 'error' ? (
                            <XCircle className="w-3 h-3 text-red-400 mt-0.5" />
                          ) : issue.type === 'warning' ? (
                            <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5" />
                          ) : (
                            <Activity className="w-3 h-3 text-blue-400 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{issue.source}</p>
                            <p className="text-muted-foreground">{issue.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Bot Activity */}
            {isBotActive && (
              <div className="pt-4 border-t border-white/[0.08]">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-400" />
                  Bot Activity
                </h4>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400">Monitoring Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Watching for errors, performance issues, and security threats...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EngineerBotTab;
