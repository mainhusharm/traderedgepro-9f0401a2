import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Sparkles, Calendar, Clock, Play, Pause, CheckCircle2, 
  FileText, Share2, TrendingUp, Target, Zap, Settings, 
  ChevronRight, RefreshCw, Timer, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuggestionOption {
  id: string;
  type: 'blog' | 'social';
  title: string;
  description: string;
  content?: string;
  platforms?: string[];
  keywords?: string[];
  estimatedEngagement?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  time: string;
  autoPost: boolean;
}

interface MarketingManagerBotProps {
  type: 'blog' | 'social';
  onCreateContent: (content: any) => Promise<void>;
  existingContent?: any[];
}

const MarketingManagerBot = ({ type, onCreateContent, existingContent = [] }: MarketingManagerBotProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'weekly',
    time: '09:00',
    autoPost: false
  });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const botName = type === 'blog' ? 'SAGE Manager' : 'MAYA Manager';
  const botColor = type === 'blog' ? 'from-amber-500 to-orange-600' : 'from-cyan-500 to-blue-600';
  const accentColor = type === 'blog' ? 'amber' : 'cyan';

  // Start the bot analysis
  const startAnalysis = async () => {
    setIsActive(true);
    setIsAnalyzing(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('marketing-manager-bot', {
        body: {
          type,
          action: 'analyze',
          existingContent: existingContent.slice(0, 10) // Send last 10 items for context
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestions(data.suggestions || []);
      toast.success(`${botName} found ${data.suggestions?.length || 0} content ideas!`);
    } catch (err: any) {
      console.error('Bot analysis error:', err);
      toast.error(err.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedSuggestions.length === suggestions.length) {
      setSelectedSuggestions([]);
    } else {
      setSelectedSuggestions(suggestions.map(s => s.id));
    }
  };

  const createSelectedContent = async () => {
    if (selectedSuggestions.length === 0) {
      toast.error('Please select at least one suggestion');
      return;
    }

    setIsCreating(true);
    const selected = suggestions.filter(s => selectedSuggestions.includes(s.id));

    try {
      for (const suggestion of selected) {
        // Generate full content for each suggestion
        const { data, error } = await supabase.functions.invoke('marketing-manager-bot', {
          body: {
            type,
            action: 'generate',
            suggestion
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Create the content
        await onCreateContent(data.content);
      }

      toast.success(`Created ${selected.length} ${type === 'blog' ? 'blog posts' : 'social posts'}!`);
      setSelectedSuggestions([]);
      setSuggestions([]);
      setIsActive(false);
    } catch (err: any) {
      console.error('Content creation error:', err);
      toast.error(err.message || 'Failed to create content');
    } finally {
      setIsCreating(false);
    }
  };

  const scheduleSelectedContent = async () => {
    if (selectedSuggestions.length === 0) {
      toast.error('Please select at least one suggestion');
      return;
    }
    setShowScheduleDialog(true);
  };

  const confirmSchedule = async () => {
    setIsCreating(true);
    const selected = suggestions.filter(s => selectedSuggestions.includes(s.id));

    try {
      const now = new Date();
      let scheduleDate = new Date();
      const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
      scheduleDate.setHours(hours, minutes, 0, 0);

      for (let i = 0; i < selected.length; i++) {
        const suggestion = selected[i];
        
        // Calculate scheduled time based on frequency
        const postDate = new Date(scheduleDate);
        if (scheduleConfig.frequency === 'daily') {
          postDate.setDate(postDate.getDate() + i);
        } else if (scheduleConfig.frequency === 'weekly') {
          postDate.setDate(postDate.getDate() + (i * 7));
        } else {
          postDate.setDate(postDate.getDate() + (i * 2)); // custom: every 2 days
        }

        // Generate full content
        const { data, error } = await supabase.functions.invoke('marketing-manager-bot', {
          body: {
            type,
            action: 'generate',
            suggestion,
            scheduledAt: postDate.toISOString()
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Create the scheduled content
        await onCreateContent({
          ...data.content,
          status: 'scheduled',
          scheduled_at: postDate.toISOString()
        });
      }

      toast.success(`Scheduled ${selected.length} ${type === 'blog' ? 'blog posts' : 'social posts'}!`);
      setSelectedSuggestions([]);
      setSuggestions([]);
      setIsActive(false);
      setShowScheduleDialog(false);
    } catch (err: any) {
      console.error('Schedule error:', err);
      toast.error(err.message || 'Failed to schedule content');
    } finally {
      setIsCreating(false);
    }
  };

  const getPriorityColor = (priority: string) => ({
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30'
  }[priority] || 'bg-gray-500/20 text-gray-400');

  return (
    <>
      <Card className={`bg-gradient-to-br ${isActive ? `${botColor.replace('from-', 'from-').replace('to-', 'to-')}/20` : 'from-white/5 to-white/10'} border-${accentColor}-500/30 transition-all duration-500`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${botColor} flex items-center justify-center shadow-lg`}
                animate={isAnalyzing ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: 'linear' }}
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{botName}</h3>
                  <Badge className={isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                    <span className={`w-2 h-2 rounded-full mr-1 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    {isActive ? 'Active' : 'Ready'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {type === 'blog' ? 'AI Content Strategist' : 'AI Social Strategist'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleDialog(true)}
                className="text-xs"
              >
                <Timer className="w-3 h-3 mr-1" />
                Schedule Settings
              </Button>
              {!isActive ? (
                <Button 
                  onClick={startAnalysis} 
                  className={`bg-${accentColor}-600 hover:bg-${accentColor}-700`}
                  disabled={isAnalyzing}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Manager
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => { setIsActive(false); setSuggestions([]); setSelectedSuggestions([]); }}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="pt-0 space-y-4">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${botColor} flex items-center justify-center mb-4`}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-lg font-medium">Analyzing your content strategy...</p>
                    <p className="text-sm text-muted-foreground mt-1">Finding the best opportunities for you</p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className={`w-5 h-5 text-${accentColor}-400`} />
                        <span className="font-medium">{suggestions.length} Content Ideas Found</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {selectedSuggestions.length === suggestions.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={startAnalysis}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                          <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedSuggestions.includes(suggestion.id)
                                ? `bg-${accentColor}-500/10 border-${accentColor}-500/50`
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                            onClick={() => toggleSuggestion(suggestion.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                selectedSuggestions.includes(suggestion.id)
                                  ? `bg-${accentColor}-500 text-white`
                                  : 'bg-white/10'
                              }`}>
                                {selectedSuggestions.includes(suggestion.id) ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  type === 'blog' ? <FileText className="w-5 h-5" /> : <Share2 className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm truncate">{suggestion.title}</h4>
                                  <Badge className={getPriorityColor(suggestion.priority)} variant="outline">
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  {suggestion.keywords?.slice(0, 3).map(kw => (
                                    <span key={kw} className="text-xs bg-white/10 px-2 py-0.5 rounded">{kw}</span>
                                  ))}
                                  {suggestion.estimatedEngagement && (
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {suggestion.estimatedEngagement}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className={`w-5 h-5 transition-transform ${
                                selectedSuggestions.includes(suggestion.id) ? 'rotate-90' : ''
                              }`} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>

                    {selectedSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between pt-4 border-t border-white/10"
                      >
                        <span className="text-sm">
                          <span className={`text-${accentColor}-400 font-bold`}>{selectedSuggestions.length}</span> items selected
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={scheduleSelectedContent}
                            disabled={isCreating}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule
                          </Button>
                          <Button 
                            onClick={createSelectedContent}
                            className={`bg-${accentColor}-600 hover:bg-${accentColor}-700`}
                            disabled={isCreating}
                          >
                            {isCreating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Create Now
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Click "Start Manager" to analyze and get content suggestions</p>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Schedule Settings Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Schedule Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Schedule</Label>
                <p className="text-xs text-muted-foreground">Automatically schedule selected content</p>
              </div>
              <Switch
                checked={scheduleConfig.enabled}
                onCheckedChange={(enabled) => setScheduleConfig(prev => ({ ...prev, enabled }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select 
                value={scheduleConfig.frequency} 
                onValueChange={(value: any) => setScheduleConfig(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Every 2 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <Input
                type="time"
                value={scheduleConfig.time}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Publish</Label>
                <p className="text-xs text-muted-foreground">Publish automatically at scheduled time</p>
              </div>
              <Switch
                checked={scheduleConfig.autoPost}
                onCheckedChange={(autoPost) => setScheduleConfig(prev => ({ ...prev, autoPost }))}
              />
            </div>

            {selectedSuggestions.length > 0 && (
              <Button 
                onClick={confirmSchedule} 
                className={`w-full bg-${accentColor}-600 hover:bg-${accentColor}-700`}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule {selectedSuggestions.length} Items
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketingManagerBot;
