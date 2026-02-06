import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Send, 
  MessageCircle, 
  Twitter, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Trophy,
  Target,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface SocialPost {
  id: string;
  post_date: string;
  platform: 'discord' | 'twitter';
  signal_id: string;
  symbol: string;
  confluence_score: number;
  direction: string;
  entry_price: number;
  posted_at: string;
  success: boolean;
  tweet_id?: string;
  error_message?: string;
}

interface DailyStats {
  discordPostsToday: number;
  twitterPostsToday: number;
  highConfluenceSignals: number;
  pendingDiscord: number;
  pendingTwitter: number;
}

export const DailySocialPostingCard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPostingDiscord, setIsPostingDiscord] = useState(false);
  const [isPostingTwitter, setIsPostingTwitter] = useState(false);
  const [todaysPosts, setTodaysPosts] = useState<SocialPost[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    discordPostsToday: 0,
    twitterPostsToday: 0,
    highConfluenceSignals: 0,
    pendingDiscord: 0,
    pendingTwitter: 0,
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchTodaysData = async () => {
    setIsLoading(true);
    try {
      // Fetch today's posts
      const { data: posts, error: postsError } = await supabase
        .from('daily_social_signal_posts')
        .select('*')
        .eq('post_date', today)
        .order('posted_at', { ascending: false });

      if (postsError) throw postsError;
      setTodaysPosts((posts as SocialPost[]) || []);

      // Get today's high-confluence signals
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      const { data: signals, error: signalsError } = await supabase
        .from('institutional_signals')
        .select('id, symbol, confluence_score, posted_to_discord, posted_to_twitter')
        .gte('confluence_score', 8)
        .eq('agent_approved', true)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (signalsError) throw signalsError;

      const discordPosted = (posts as SocialPost[])?.filter(p => p.platform === 'discord' && p.success).length || 0;
      const twitterPosted = (posts as SocialPost[])?.filter(p => p.platform === 'twitter' && p.success).length || 0;
      const pendingDiscordCount = (signals as any[])?.filter(s => !s.posted_to_discord).length || 0;
      const pendingTwitterCount = (signals as any[])?.filter(s => !s.posted_to_twitter).length || 0;

      setDailyStats({
        discordPostsToday: discordPosted,
        twitterPostsToday: twitterPosted,
        highConfluenceSignals: signals?.length || 0,
        pendingDiscord: Math.min(pendingDiscordCount, 2 - discordPosted),
        pendingTwitter: twitterPosted === 0 && pendingTwitterCount > 0 ? 1 : 0,
      });
    } catch (error) {
      console.error('Error fetching social posting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysData();
  }, []);

  const handlePostToDiscord = async () => {
    setIsPostingDiscord(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-daily-signals', {
        body: { action: 'post_discord', date: today }
      });

      if (error) throw error;

      if (data.discordPosted > 0) {
        toast.success(`Posted ${data.discordPosted} signal(s) to Discord! 🎉`);
      } else {
        toast.info(data.message || 'No new signals to post');
      }

      fetchTodaysData();
    } catch (error) {
      console.error('Error posting to Discord:', error);
      toast.error('Failed to post to Discord');
    } finally {
      setIsPostingDiscord(false);
    }
  };

  const handlePostToTwitter = async () => {
    setIsPostingTwitter(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-daily-signals', {
        body: { action: 'post_twitter', date: today }
      });

      if (error) throw error;

      if (data.twitterPosted > 0) {
        toast.success(`Posted top signal to X/Twitter! 🎉`);
      } else {
        toast.info(data.message || 'No new signals to post');
      }

      fetchTodaysData();
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      toast.error('Failed to post to X/Twitter');
    } finally {
      setIsPostingTwitter(false);
    }
  };

  const handlePostAll = async () => {
    setIsPostingDiscord(true);
    setIsPostingTwitter(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-daily-signals', {
        body: { action: 'post_daily', date: today }
      });

      if (error) throw error;

      const discordCount = data.discordPosted || 0;
      const twitterCount = data.twitterPosted || 0;

      if (discordCount > 0 || twitterCount > 0) {
        toast.success(`Posted ${discordCount} to Discord, ${twitterCount} to X! 🎉`);
      } else {
        toast.info(data.message || 'No new signals to post today');
      }

      fetchTodaysData();
    } catch (error) {
      console.error('Error posting to social:', error);
      toast.error('Failed to post to social media');
    } finally {
      setIsPostingDiscord(false);
      setIsPostingTwitter(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Daily Social Posting
            <Badge variant="outline" className="text-xs ml-2">
              {format(new Date(), 'MMM d, yyyy')}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchTodaysData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-white/5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">High Confluence</span>
            </div>
            <p className="text-xl font-bold">{dailyStats.highConfluenceSignals}</p>
            <p className="text-[10px] text-muted-foreground">Signals ≥8</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-indigo-500/20 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-muted-foreground">Discord</span>
            </div>
            <p className="text-xl font-bold text-indigo-400">{dailyStats.discordPostsToday}/2</p>
            <p className="text-[10px] text-muted-foreground">
              {dailyStats.pendingDiscord > 0 ? `${dailyStats.pendingDiscord} pending` : 'All posted'}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-sky-500/20 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Twitter className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-muted-foreground">X/Twitter</span>
            </div>
            <p className="text-xl font-bold text-sky-400">{dailyStats.twitterPostsToday}/1</p>
            <p className="text-[10px] text-muted-foreground">
              {dailyStats.pendingTwitter > 0 ? '1 pending' : 'All posted'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePostToDiscord}
            disabled={isPostingDiscord || dailyStats.pendingDiscord === 0}
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {isPostingDiscord ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            Post to Discord
            {dailyStats.pendingDiscord > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {dailyStats.pendingDiscord}
              </Badge>
            )}
          </Button>

          <Button
            onClick={handlePostToTwitter}
            disabled={isPostingTwitter || dailyStats.pendingTwitter === 0}
            size="sm"
            className="flex-1 bg-sky-600 hover:bg-sky-700"
          >
            {isPostingTwitter ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Twitter className="w-4 h-4 mr-2" />
            )}
            Post to X
            {dailyStats.pendingTwitter > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                1
              </Badge>
            )}
          </Button>
        </div>

        <Button
          onClick={handlePostAll}
          disabled={isPostingDiscord || isPostingTwitter || (dailyStats.pendingDiscord === 0 && dailyStats.pendingTwitter === 0)}
          variant="outline"
          size="sm"
          className="w-full border-primary/30 hover:bg-primary/10"
        >
          {(isPostingDiscord || isPostingTwitter) ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Post All Daily Signals
        </Button>

        {/* Today's Posts History */}
        {todaysPosts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Today's Posts</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {todaysPosts.map((post) => (
                <div 
                  key={post.id}
                  className="flex items-center justify-between p-2 rounded bg-background/30 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {post.platform === 'discord' ? (
                      <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Twitter className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span className="font-medium">{post.symbol}</span>
                    <span className={post.direction === 'BUY' ? 'text-success' : 'text-destructive'}>
                      {post.direction}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1">
                      {post.confluence_score}/10
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {format(new Date(post.posted_at), 'HH:mm')}
                    </span>
                    {post.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {dailyStats.highConfluenceSignals === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No high-confluence signals (≥8) generated today yet.</p>
            <p className="text-xs mt-1">Run the bot to generate signals!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
