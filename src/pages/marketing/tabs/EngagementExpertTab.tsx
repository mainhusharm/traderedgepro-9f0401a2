import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Power, 
  PowerOff, 
  Clock, 
  Search, 
  MessageCircle, 
  Heart, 
  Send, 
  SkipForward,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Activity,
  Twitter,
  Instagram,
  RefreshCw,
  Plus,
  Trash2,
  Smile,
  Briefcase,
  Sparkles,
  Shield,
  Calendar,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Zap,
  Bot,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import AIChatInterface from '@/components/marketing/AIChatInterface';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Tooltip } from 'recharts';

interface EngagementConfig {
  id: string;
  is_active: boolean;
  mode: 'manual' | 'scheduled' | 'auto';
  platforms: string[];
  keywords: string[];
  brand_mentions: string[];
  hashtags: string[];
  schedule_enabled: boolean;
  schedule_start_hour: number;
  schedule_end_hour: number;
  schedule_days: string[];
  schedule_timezone: string;
  reply_style: 'friendly' | 'professional' | 'witty' | 'empathetic';
  max_replies_per_hour: number;
  auto_like: boolean;
  auto_reply: boolean;
  require_approval: boolean;
  instagram_dm_enabled: boolean;
  instagram_story_enabled: boolean;
  sentiment_priority: boolean;
}

interface QueueItem {
  id: string;
  platform: string;
  external_post_id: string;
  external_post_url: string;
  author_username: string;
  author_display_name: string;
  author_followers: number;
  post_content: string;
  post_type: string;
  detected_intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  suggested_reply: string;
  priority: number;
  status: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  platform: string;
  action_type: string;
  reply_content: string;
  posted_at: string;
  engagement_received: {
    likes: number;
    replies: number;
    retweets: number;
  };
}

interface AnalyticsData {
  total_replies: number;
  total_likes: number;
  total_dms: number;
  negative_handled: number;
  avg_sentiment: number;
  engagement_trend: { date: string; engagements: number }[];
  hourly_performance: { hour: number; engagements: number }[];
  platform_breakdown: { name: string; value: number }[];
  sentiment_distribution: { name: string; value: number; color: string }[];
  top_performing_replies: HistoryItem[];
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'UTC'
];

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const REPLY_STYLES = [
  { value: 'friendly', label: 'Friendly & Casual', icon: Smile, description: 'Warm, approachable tone' },
  { value: 'professional', label: 'Professional', icon: Briefcase, description: 'Business-like, polished' },
  { value: 'witty', label: 'Witty & Engaging', icon: Sparkles, description: 'Clever, memorable responses' },
  { value: 'empathetic', label: 'Empathetic', icon: Heart, description: 'Understanding, supportive' }
];

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const RATE_LIMIT_SECONDS = 15 * 60; // 15 minutes
const MIN_FOLLOWERS_OPTIONS = [
  { value: 0, label: 'Any (0+)' },
  { value: 100, label: '100+' },
  { value: 500, label: '500+' },
  { value: 1000, label: '1K+' },
  { value: 5000, label: '5K+' },
  { value: 10000, label: '10K+' },
];

const EngagementExpertTab = () => {
  const [config, setConfig] = useState<EngagementConfig | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editedReplyContent, setEditedReplyContent] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('control');
  const [lastSearchTime, setLastSearchTime] = useState<number | null>(() => {
    const stored = localStorage.getItem('echo_last_search_time');
    return stored ? parseInt(stored, 10) : null;
  });
  const [countdown, setCountdown] = useState<number>(0);
  const [minFollowers, setMinFollowers] = useState<number>(() => {
    const stored = localStorage.getItem('echo_min_followers');
    return stored ? parseInt(stored, 10) : 100;
  });

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      if (lastSearchTime) {
        const elapsed = Math.floor((Date.now() - lastSearchTime) / 1000);
        const remaining = Math.max(0, RATE_LIMIT_SECONDS - elapsed);
        setCountdown(remaining);
      } else {
        setCountdown(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastSearchTime]);

  // Load config, queue, and history
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load config
      const { data: configData } = await (supabase
        .from('marketing_engagement_config' as any)
        .select('*')
        .limit(1)
        .single() as any);
      
      if (configData) {
        setConfig(configData as unknown as EngagementConfig);
      }

      // Load queue
      const { data: queueData } = await supabase
        .from('marketing_engagement_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);
      
      setQueue((queueData || []) as unknown as QueueItem[]);

      // Load history
      const { data: historyData } = await supabase
        .from('marketing_engagement_history')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(50);
      
      setHistory((historyData || []) as unknown as HistoryItem[]);

      // Load analytics
      await loadAnalytics();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load engagement data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Get today's analytics
      const today = new Date().toISOString().split('T')[0];
      const { data: analyticsData } = await (supabase
        .from('marketing_engagement_analytics' as any)
        .select('*')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true }) as any);

      // Get hourly stats
      const { data: hourlyData } = await (supabase
        .from('marketing_engagement_hourly_stats' as any)
        .select('*')
        .order('hour_of_day', { ascending: true }) as any);

      // Calculate aggregated analytics
      const totalReplies = history.filter(h => h.action_type === 'reply').length;
      const totalLikes = history.filter(h => h.action_type === 'like').length;
      const totalDms = history.filter(h => h.action_type === 'dm').length;
      const negativeHandled = queue.filter(q => q.sentiment === 'negative' && q.status === 'sent').length;

      // Mock data for demo
      const engagementTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          engagements: Math.floor(Math.random() * 50) + 10
        };
      });

      const hourlyPerformance = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        engagements: Math.floor(Math.random() * 20) + (i >= 9 && i <= 17 ? 15 : 5)
      }));

      setAnalytics({
        total_replies: totalReplies || 12,
        total_likes: totalLikes || 34,
        total_dms: totalDms || 5,
        negative_handled: negativeHandled || 3,
        avg_sentiment: 0.65,
        engagement_trend: engagementTrend,
        hourly_performance: hourlyPerformance,
        platform_breakdown: [
          { name: 'Twitter', value: 65 },
          { name: 'Instagram', value: 35 }
        ],
        sentiment_distribution: [
          { name: 'Positive', value: 45, color: 'hsl(var(--chart-2))' },
          { name: 'Neutral', value: 40, color: 'hsl(var(--muted))' },
          { name: 'Negative', value: 15, color: 'hsl(var(--destructive))' }
        ],
        top_performing_replies: history.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const saveConfig = async (updates: Partial<EngagementConfig>) => {
    if (!config) return;
    setIsSaving(true);
    try {
      const newConfig = { ...config, ...updates };
      const { error } = await (supabase
        .from('marketing_engagement_config' as any)
        .update(newConfig as any)
        .eq('id', config.id) as any);

      if (error) throw error;
      setConfig(newConfig);
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBot = async () => {
    if (!config) return;
    const newState = !config.is_active;
    await saveConfig({ is_active: newState });
    toast.success(newState ? 'ECHO activated! 🚀' : 'ECHO deactivated');
  };

  const addKeyword = () => {
    if (!newKeyword.trim() || !config) return;
    const keywords = [...(config.keywords || []), newKeyword.trim()];
    saveConfig({ keywords });
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    if (!config) return;
    const keywords = config.keywords.filter(k => k !== keyword);
    saveConfig({ keywords });
  };

  const addHashtag = () => {
    if (!newHashtag.trim() || !config) return;
    const tag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
    const hashtags = [...(config.hashtags || []), tag.trim()];
    saveConfig({ hashtags });
    setNewHashtag('');
  };

  const removeHashtag = (hashtag: string) => {
    if (!config) return;
    const hashtags = config.hashtags.filter(h => h !== hashtag);
    saveConfig({ hashtags });
  };

  const searchForPosts = async () => {
    // Check rate limit
    if (countdown > 0) {
      toast.error(`Please wait ${formatCountdown(countdown)} before searching again`);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await callEdgeFunction('twitter-engagement', { action: 'search', config, minFollowers });

      // Handle rate limiting specifically
      if (data?.rateLimited || error?.message?.includes('429')) {
        const now = Date.now();
        setLastSearchTime(now);
        localStorage.setItem('echo_last_search_time', now.toString());
        toast.error('Rate limit reached. Please wait 15 minutes before searching again.', {
          duration: 5000,
          icon: '⏰'
        });
        return;
      }

      if (error) throw error;
      
      // Update last search time on successful search
      const now = Date.now();
      setLastSearchTime(now);
      localStorage.setItem('echo_last_search_time', now.toString());
      
      if (data.found === 0 && data.totalFound > 0) {
        toast.info(`Found ${data.totalFound} posts, but none with ${minFollowers}+ followers. Try lowering the threshold.`, {
          duration: 5000
        });
      } else {
        toast.success(`Found ${data.found || 0} high-engagement posts!`);
      }
      await loadData();
    } catch (error: any) {
      console.error('Error searching:', error);
      // Check if it's a rate limit error from the response
      if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
        const now = Date.now();
        setLastSearchTime(now);
        localStorage.setItem('echo_last_search_time', now.toString());
        toast.error('Rate limit reached. Please wait 15 minutes.', { icon: '⏰' });
      } else {
        toast.error('Failed to search for posts');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMinFollowersChange = (value: string) => {
    const num = parseInt(value, 10);
    setMinFollowers(num);
    localStorage.setItem('echo_min_followers', num.toString());
  };

  const generateReply = async (item: QueueItem) => {
    try {
      const { data, error } = await callEdgeFunction('twitter-engagement', { 
        action: 'generate-reply', 
        post: item,
        style: config?.reply_style || 'friendly'
      });

      if (error) throw error;
      
      // Update the queue item with the new reply
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, suggested_reply: data.reply } : q
      ));
      
      toast.success('Reply generated!');
    } catch (error) {
      console.error('Error generating reply:', error);
      toast.error('Failed to generate reply');
    }
  };

  const approveAndSend = async (item: QueueItem, customReply?: string) => {
    try {
      const { data, error } = await callEdgeFunction('twitter-engagement', { 
        action: 'send-reply', 
        post: item,
        reply: customReply || item.suggested_reply
      });

      if (error) throw error;

      // Update queue status
      await supabase
        .from('marketing_engagement_queue')
        .update({ status: 'sent' } as any)
        .eq('id', item.id);

      // Add to history
      await supabase
        .from('marketing_engagement_history')
        .insert({
          queue_id: item.id,
          platform: item.platform,
          external_post_id: item.external_post_id,
          action_type: 'reply',
          reply_content: customReply || item.suggested_reply,
          sentiment_at_action: item.sentiment
        } as any);

      setQueue(prev => prev.filter(q => q.id !== item.id));
      toast.success('Reply sent! 🎉');
      setEditingReply(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const skipPost = async (item: QueueItem) => {
    try {
      await supabase
        .from('marketing_engagement_queue')
        .update({ status: 'skipped' } as any)
        .eq('id', item.id);

      setQueue(prev => prev.filter(q => q.id !== item.id));
      toast.success('Post skipped');
    } catch (error) {
      console.error('Error skipping post:', error);
    }
  };

  const likePost = async (item: QueueItem) => {
    try {
      await callEdgeFunction('twitter-engagement', { action: 'like', post: item });

      await supabase
        .from('marketing_engagement_history')
        .insert({
          queue_id: item.id,
          platform: item.platform,
          external_post_id: item.external_post_id,
          action_type: 'like'
        } as any);

      toast.success('Post liked! ❤️');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4" />;
      case 'negative': return <ThumbsDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Loading ECHO...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Control Panel - 2 columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status Card */}
        <Card className="border-white/10 bg-background/50 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    ECHO
                    {config?.is_active && (
                      <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Engagement Expert - Human-like Social Interaction</CardDescription>
                </div>
              </div>
              <Button
                onClick={toggleBot}
                variant={config?.is_active ? 'destructive' : 'default'}
                className="gap-2"
              >
                {config?.is_active ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Stop ECHO
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Start ECHO
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="control">Control</TabsTrigger>
                <TabsTrigger value="queue">Queue ({queue.length})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Control Panel */}
              <TabsContent value="control" className="space-y-6 mt-6">
                {/* Platforms */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Platforms</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={config?.platforms?.includes('twitter') ? 'default' : 'outline'}
                      className="gap-2"
                      onClick={() => {
                        const platforms = config?.platforms?.includes('twitter')
                          ? config.platforms.filter(p => p !== 'twitter')
                          : [...(config?.platforms || []), 'twitter'];
                        saveConfig({ platforms });
                      }}
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter/X
                    </Button>
                    <Button
                      variant={config?.platforms?.includes('instagram') ? 'default' : 'outline'}
                      className="gap-2"
                      onClick={() => {
                        const platforms = config?.platforms?.includes('instagram')
                          ? config.platforms.filter(p => p !== 'instagram')
                          : [...(config?.platforms || []), 'instagram'];
                        saveConfig({ platforms });
                      }}
                    >
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Button>
                  </div>
                </div>

                {/* Instagram Features */}
                {config?.platforms?.includes('instagram') && (
                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram Features
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm">DM Auto-Replies</span>
                          <p className="text-xs text-muted-foreground">Auto-reply to DMs</p>
                        </div>
                        <Switch
                          checked={config?.instagram_dm_enabled}
                          onCheckedChange={(checked) => saveConfig({ instagram_dm_enabled: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm">Story Reactions</span>
                          <p className="text-xs text-muted-foreground">React to stories</p>
                        </div>
                        <Switch
                          checked={config?.instagram_story_enabled}
                          onCheckedChange={(checked) => saveConfig({ instagram_story_enabled: checked })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Keywords */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Keywords to Monitor</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config?.keywords?.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1 px-3 py-1">
                        {keyword}
                        <button onClick={() => removeKeyword(keyword)}>
                          <XCircle className="w-3 h-3 ml-1 hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Hashtags to Track</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add hashtag..."
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                    />
                    <Button onClick={addHashtag} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config?.hashtags?.map((hashtag) => (
                      <Badge key={hashtag} variant="outline" className="gap-1 px-3 py-1 text-primary">
                        {hashtag}
                        <button onClick={() => removeHashtag(hashtag)}>
                          <XCircle className="w-3 h-3 ml-1 hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Scheduled Mode
                    </Label>
                    <Switch
                      checked={config?.schedule_enabled}
                      onCheckedChange={(checked) => saveConfig({ schedule_enabled: checked })}
                    />
                  </div>
                  
                  {config?.schedule_enabled && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label className="text-xs">Start Hour</Label>
                        <Select
                          value={String(config?.schedule_start_hour || 9)}
                          onValueChange={(v) => saveConfig({ schedule_start_hour: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Hour</Label>
                        <Select
                          value={String(config?.schedule_end_hour || 17)}
                          onValueChange={(v) => saveConfig({ schedule_end_hour: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Timezone</Label>
                        <Select
                          value={config?.schedule_timezone || 'UTC'}
                          onValueChange={(v) => saveConfig({ schedule_timezone: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Reply Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {REPLY_STYLES.map((style) => (
                      <Button
                        key={style.value}
                        variant={config?.reply_style === style.value ? 'default' : 'outline'}
                        className="h-auto py-3 flex flex-col items-start gap-1"
                        onClick={() => saveConfig({ reply_style: style.value as any })}
                      >
                        <div className="flex items-center gap-2">
                          <style.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{style.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sentiment Priority */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-400" />
                    <div>
                      <span className="text-sm font-medium">Sentiment Priority</span>
                      <p className="text-xs text-muted-foreground">Prioritize negative mentions for damage control</p>
                    </div>
                  </div>
                  <Switch
                    checked={config?.sentiment_priority}
                    onCheckedChange={(checked) => saveConfig({ sentiment_priority: checked })}
                  />
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-like posts</span>
                    <Switch
                      checked={config?.auto_like}
                      onCheckedChange={(checked) => saveConfig({ auto_like: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require approval</span>
                    <Switch
                      checked={config?.require_approval}
                      onCheckedChange={(checked) => saveConfig({ require_approval: checked })}
                    />
                  </div>
                </div>

                {/* Minimum Engagement Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Minimum Account Size (Followers)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only find posts from accounts with this many followers or more
                  </p>
                  <Select
                    value={minFollowers.toString()}
                    onValueChange={handleMinFollowersChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MIN_FOLLOWERS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label} followers
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rate Limit Timer - Always visible */}
                <div className={`p-4 rounded-lg border ${countdown > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${countdown > 0 ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                      <Clock className={`w-5 h-5 ${countdown > 0 ? 'text-amber-400' : 'text-green-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${countdown > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                        {countdown > 0 ? 'Rate Limit Active' : 'Ready to Search'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Twitter's free tier allows 1 search per 15 minutes
                      </p>
                    </div>
                    <div className={`text-2xl font-mono font-bold ${countdown > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                      {countdown > 0 ? formatCountdown(countdown) : '✓'}
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <Button 
                  onClick={searchForPosts} 
                  disabled={isSearching || countdown > 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Wait {formatCountdown(countdown)}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find High-Engagement Posts
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Queue */}
              <TabsContent value="queue" className="mt-6">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {queue.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No posts in queue</p>
                        <p className="text-sm">Click "Find Relevant Posts" to search</p>
                      </div>
                    ) : (
                      queue.map((item) => (
                        <Card key={item.id} className={`border-white/10 ${item.sentiment === 'negative' ? 'border-l-4 border-l-red-500' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getPlatformIcon(item.platform)}
                                <span className="font-medium">@{item.author_username}</span>
                                {item.author_followers > 0 && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Users className="w-3 h-3" />
                                    {item.author_followers >= 1000 
                                      ? `${(item.author_followers / 1000).toFixed(1)}K` 
                                      : item.author_followers}
                                  </Badge>
                                )}
                                <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                                  {getSentimentIcon(item.sentiment)}
                                  <span className="ml-1 capitalize">{item.sentiment}</span>
                                </Badge>
                                {item.priority > 5 && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Priority
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {item.post_content}
                            </p>

                            {item.suggested_reply && (
                              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Bot className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium text-primary">AI Suggested Reply</span>
                                </div>
                                {editingReply === item.id ? (
                                  <Textarea
                                    value={editedReplyContent}
                                    onChange={(e) => setEditedReplyContent(e.target.value)}
                                    className="min-h-[80px] bg-background/50"
                                  />
                                ) : (
                                  <p className="text-sm">{item.suggested_reply}</p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {!item.suggested_reply ? (
                                <Button size="sm" onClick={() => generateReply(item)} className="gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Generate Reply
                                </Button>
                              ) : editingReply === item.id ? (
                                <>
                                  <Button size="sm" onClick={() => approveAndSend(item, editedReplyContent)} className="gap-1">
                                    <Send className="w-3 h-3" />
                                    Send
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingReply(null)}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" onClick={() => approveAndSend(item)} className="gap-1">
                                    <Send className="w-3 h-3" />
                                    Send
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      setEditingReply(item.id);
                                      setEditedReplyContent(item.suggested_reply || '');
                                    }}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="outline" onClick={() => likePost(item)}>
                                <Heart className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => skipPost(item)}>
                                <SkipForward className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Analytics */}
              <TabsContent value="analytics" className="mt-6">
                {analytics && (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      <Card className="border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Replies Sent</p>
                              <p className="text-2xl font-bold">{analytics.total_replies}</p>
                            </div>
                            <MessageCircle className="w-8 h-8 text-primary/50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Likes Given</p>
                              <p className="text-2xl font-bold">{analytics.total_likes}</p>
                            </div>
                            <Heart className="w-8 h-8 text-red-400/50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">DMs Sent</p>
                              <p className="text-2xl font-bold">{analytics.total_dms}</p>
                            </div>
                            <Send className="w-8 h-8 text-blue-400/50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-white/10 border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Negative Handled</p>
                              <p className="text-2xl font-bold">{analytics.negative_handled}</p>
                            </div>
                            <Shield className="w-8 h-8 text-red-400/50" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Engagement Trend */}
                      <Card className="border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Engagement Trend (7 days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics.engagement_trend}>
                                <defs>
                                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                                <Area 
                                  type="monotone" 
                                  dataKey="engagements" 
                                  stroke="hsl(var(--primary))" 
                                  fill="url(#engagementGradient)"
                                  strokeWidth={2}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Optimal Hours */}
                      <Card className="border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Best Hours to Engage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.hourly_performance.filter((_, i) => i % 2 === 0)}>
                                <XAxis 
                                  dataKey="hour" 
                                  tick={{ fontSize: 10 }} 
                                  stroke="hsl(var(--muted-foreground))"
                                  tickFormatter={(h) => `${h}:00`}
                                />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                                <Bar 
                                  dataKey="engagements" 
                                  fill="hsl(var(--primary))" 
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sentiment Distribution */}
                      <Card className="border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Sentiment Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={analytics.sentiment_distribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {analytics.sentiment_distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-center gap-4 mt-2">
                            {analytics.sentiment_distribution.map((item) => (
                              <div key={item.name} className="flex items-center gap-1 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{item.name}: {item.value}%</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Platform Breakdown */}
                      <Card className="border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Platform Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analytics.platform_breakdown.map((platform, i) => (
                              <div key={platform.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    {platform.name === 'Twitter' ? <Twitter className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
                                    {platform.name}
                                  </span>
                                  <span>{platform.value}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${platform.value}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Performing Replies */}
                    <Card className="border-white/10">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Top Performing Replies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics.top_performing_replies.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No replies yet</p>
                          ) : (
                            analytics.top_performing_replies.map((reply, i) => (
                              <div key={reply.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm line-clamp-2">{reply.reply_content || 'No content'}</p>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Heart className="w-3 h-3" />
                                      {reply.engagement_received?.likes || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3" />
                                      {reply.engagement_received?.replies || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* History */}
              <TabsContent value="history" className="mt-6">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No engagement history yet</p>
                      </div>
                    ) : (
                      history.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.action_type === 'reply' ? 'bg-primary/20' :
                            item.action_type === 'like' ? 'bg-red-500/20' :
                            item.action_type === 'dm' ? 'bg-blue-500/20' :
                            'bg-muted'
                          }`}>
                            {item.action_type === 'reply' && <MessageCircle className="w-4 h-4" />}
                            {item.action_type === 'like' && <Heart className="w-4 h-4 text-red-400" />}
                            {item.action_type === 'dm' && <Send className="w-4 h-4 text-blue-400" />}
                            {item.action_type === 'story_reaction' && <Eye className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getPlatformIcon(item.platform)}
                              <span className="text-sm capitalize">{item.action_type}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.posted_at).toLocaleString()}
                              </span>
                            </div>
                            {item.reply_content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.reply_content}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {item.engagement_received?.likes || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {item.engagement_received?.replies || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Sidebar */}
      <div className="lg:col-span-1">
        <Card className="border-white/10 bg-background/50 backdrop-blur-xl h-[700px] flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-sm">
                💬
              </div>
              Chat with ECHO
            </CardTitle>
            <CardDescription>Ask about engagement strategies</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <AIChatInterface
              employeeId="echo"
              employeeName="ECHO"
              employeeColor="from-rose-500 to-pink-600"
              placeholder="Ask about engagement strategies..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EngagementExpertTab;