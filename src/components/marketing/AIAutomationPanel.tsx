import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Power, Play, Pause, Settings2, Zap, Clock, 
  CheckCircle2, XCircle, Activity, ChevronDown,
  Rocket, Timer, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAIAutomation, AIAutomation } from '@/hooks/useAIAutomation';
import { formatDistanceToNow } from 'date-fns';

const AGENT_META: Record<string, { avatar: string; color: string; description: string }> = {
  sage: { avatar: '✍️', color: 'from-amber-500 to-orange-600', description: 'Creates SEO-optimized blog posts' },
  maya: { avatar: '📱', color: 'from-cyan-500 to-blue-600', description: 'Posts to social media platforms' },
  echo: { avatar: '💬', color: 'from-green-500 to-emerald-600', description: 'Engages with social mentions' },
  blake: { avatar: '🎯', color: 'from-emerald-500 to-teal-600', description: 'Researches and adds new leads' },
  zoe: { avatar: '💬', color: 'from-indigo-500 to-purple-600', description: 'Handles customer support' },
  lexi: { avatar: '⚖️', color: 'from-slate-500 to-gray-600', description: 'Reviews content compliance' },
  aria: { avatar: '👩‍💼', color: 'from-violet-500 to-purple-600', description: 'Creates tasks and summaries' },
  nova: { avatar: '👋', color: 'from-pink-500 to-rose-600', description: 'Monitors new inquiries' },
};

const formatInterval = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
};

const AgentCard = ({ 
  agent, 
  onToggle, 
  onRun, 
  onUpdateConfig,
  isProcessing 
}: { 
  agent: AIAutomation; 
  onToggle: () => void;
  onRun: () => void;
  onUpdateConfig: (interval: number, settings: Record<string, any>) => void;
  isProcessing: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [newInterval, setNewInterval] = useState(agent.interval_minutes);
  const meta = AGENT_META[agent.agent_id] || { avatar: '🤖', color: 'from-gray-500 to-gray-600', description: 'AI Agent' };
  
  const successRate = agent.total_runs > 0 
    ? Math.round((agent.successful_runs / agent.total_runs) * 100) 
    : 100;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border transition-all duration-300 ${
          agent.is_active 
            ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30' 
            : 'bg-background/50 border-white/10'
        }`}
      >
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl shadow-lg`}>
                  {meta.avatar}
                </div>
                {agent.is_active && (
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{agent.agent_name}</h3>
                  <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-xs">
                    {agent.is_active ? 'Running' : 'Stopped'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    <span>Every {formatInterval(agent.interval_minutes)}</span>
                  </div>
                  {agent.last_run_at && (
                    <p className="text-xs text-muted-foreground">
                      Last: {formatDistanceToNow(new Date(agent.last_run_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
                
                <Switch 
                  checked={agent.is_active} 
                  onCheckedChange={onToggle}
                  disabled={isProcessing}
                />
                
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold">{agent.total_runs}</p>
                <p className="text-xs text-muted-foreground">Total Runs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-green-400">{agent.successful_runs}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-red-400">{agent.failed_runs}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>

            {agent.last_error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Last Error</span>
                </div>
                <p className="text-xs text-red-300/80">{agent.last_error}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRun}
                disabled={isProcessing}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Now
              </Button>
              
              <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure {agent.agent_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Run Interval (minutes)</Label>
                      <Input 
                        type="number" 
                        value={newInterval}
                        onChange={(e) => setNewInterval(parseInt(e.target.value) || 60)}
                        min={5}
                        max={1440}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Agent will run every {formatInterval(newInterval)}
                      </p>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        onUpdateConfig(newInterval, agent.config);
                        setConfigOpen(false);
                      }}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};

const AIAutomationPanel = () => {
  const { 
    automations, 
    isLoading, 
    isProcessing,
    startAll, 
    stopAll, 
    toggleAgent, 
    runAgent,
    updateConfig,
    activeCount, 
    allActive 
  } = useAIAutomation();

  if (isLoading) {
    return (
      <Card className="bg-background/50 backdrop-blur border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/50 backdrop-blur border-white/10 overflow-hidden">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Automation Control
                {activeCount > 0 && (
                  <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    {activeCount} Active
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Automate your AI team to work 24/7
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {allActive ? (
                <motion.div
                  key="stop"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button 
                    variant="destructive" 
                    onClick={stopAll}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Stop All
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button 
                    onClick={startAll}
                    disabled={isProcessing}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Zap className="w-4 h-4" />
                    Start All Agents
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid gap-3">
          {automations.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={() => toggleAgent(agent.agent_id)}
              onRun={() => runAgent(agent.agent_id)}
              onUpdateConfig={(interval, settings) => updateConfig(agent.agent_id, interval, settings)}
              isProcessing={isProcessing}
            />
          ))}
        </div>

        {automations.length > 0 && activeCount > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Automation Active</p>
                <p className="text-sm text-muted-foreground">
                  {activeCount} agent{activeCount !== 1 ? 's' : ''} running automatically
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {automations.reduce((sum, a) => sum + a.total_runs, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAutomationPanel;
