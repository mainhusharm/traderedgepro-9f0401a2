import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Engagement scheduler triggered');

    // Get engagement config
    const { data: config, error: configError } = await supabase
      .from('marketing_engagement_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('No engagement config found');
      return new Response(JSON.stringify({ message: 'No config found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if bot is active
    if (!config.is_active) {
      console.log('Engagement bot is not active');
      return new Response(JSON.stringify({ message: 'Bot not active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we're in scheduled mode and within hours
    if (config.schedule_enabled) {
      const now = new Date();
      const timezone = config.schedule_timezone || 'UTC';
      
      // Get current hour in the configured timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone
      });
      const currentHour = parseInt(formatter.format(now));
      
      // Get current day
      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: timezone
      });
      const currentDay = dayFormatter.format(now).toLowerCase();

      // Check if current day is in schedule
      const scheduleDays = config.schedule_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      if (!scheduleDays.includes(currentDay)) {
        console.log(`Current day ${currentDay} is not in schedule`);
        return new Response(JSON.stringify({ message: 'Outside scheduled days' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if current hour is within schedule
      const startHour = config.schedule_start_hour || 9;
      const endHour = config.schedule_end_hour || 17;
      
      if (currentHour < startHour || currentHour >= endHour) {
        console.log(`Current hour ${currentHour} is outside schedule (${startHour}-${endHour})`);
        return new Response(JSON.stringify({ message: 'Outside scheduled hours' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check rate limits - count engagements in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentEngagements } = await supabase
      .from('marketing_engagement_history')
      .select('*', { count: 'exact', head: true })
      .gte('posted_at', oneHourAgo);

    const maxPerHour = config.max_replies_per_hour || 10;
    if ((recentEngagements || 0) >= maxPerHour) {
      console.log(`Rate limit reached: ${recentEngagements}/${maxPerHour} engagements this hour`);
      return new Response(JSON.stringify({ message: 'Rate limit reached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger search for new posts
    console.log('Searching for new posts to engage with...');
    
    const projectUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || '';
    const response = await fetch(`${projectUrl}/functions/v1/twitter-engagement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search',
        config
      })
    });

    const result = await response.json();
    console.log('Search result:', result);

    // If auto-reply is enabled and doesn't require approval, process queue
    if (config.auto_reply && !config.require_approval) {
      // Get pending posts from queue, prioritizing negative sentiment
      const { data: pendingPosts } = await supabase
        .from('marketing_engagement_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(3);

      if (pendingPosts && pendingPosts.length > 0) {
        console.log(`Auto-replying to ${pendingPosts.length} posts`);
        
        for (const post of pendingPosts) {
          // Send reply
          await fetch(`${projectUrl}/functions/v1/twitter-engagement`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'send-reply',
              post,
              reply: post.suggested_reply
            })
          });

          // Update queue status
          await supabase
            .from('marketing_engagement_queue')
            .update({ status: 'sent' })
            .eq('id', post.id);

          // Add to history
          await supabase
            .from('marketing_engagement_history')
            .insert({
              queue_id: post.id,
              platform: post.platform,
              external_post_id: post.external_post_id,
              action_type: 'reply',
              reply_content: post.suggested_reply,
              was_auto: true,
              sentiment_at_action: post.sentiment
            });
        }
      }
    }

    // Auto-like if enabled
    if (config.auto_like) {
      const { data: postsToLike } = await supabase
        .from('marketing_engagement_queue')
        .select('*')
        .eq('status', 'pending')
        .eq('sentiment', 'positive')
        .limit(5);

      if (postsToLike && postsToLike.length > 0) {
        console.log(`Auto-liking ${postsToLike.length} posts`);
        
        for (const post of postsToLike) {
          await fetch(`${projectUrl}/functions/v1/twitter-engagement`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'like',
              post
            })
          });

          // Add to history
          await supabase
            .from('marketing_engagement_history')
            .insert({
              queue_id: post.id,
              platform: post.platform,
              external_post_id: post.external_post_id,
              action_type: 'like',
              was_auto: true
            });
        }
      }
    }

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    const { data: todayStats } = await supabase
      .from('marketing_engagement_history')
      .select('action_type, sentiment_at_action')
      .gte('posted_at', today);

    const stats = {
      total_replies_sent: todayStats?.filter(s => s.action_type === 'reply').length || 0,
      total_likes_given: todayStats?.filter(s => s.action_type === 'like').length || 0,
      total_dms_sent: todayStats?.filter(s => s.action_type === 'dm').length || 0,
      negative_mentions_handled: todayStats?.filter(s => s.sentiment_at_action === 'negative').length || 0,
    };

    // Upsert analytics for today
    for (const platform of config.platforms || ['twitter']) {
      await supabase
        .from('marketing_engagement_analytics')
        .upsert({
          date: today,
          platform,
          ...stats
        }, {
          onConflict: 'date,platform'
        });
    }

    // Update hourly stats
    const currentHour = new Date().getHours();
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    for (const platform of config.platforms || ['twitter']) {
      await supabase
        .from('marketing_engagement_hourly_stats')
        .upsert({
          hour_of_day: currentHour,
          day_of_week: currentDay,
          platform,
          total_engagements: (stats.total_replies_sent + stats.total_likes_given),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'hour_of_day,day_of_week,platform'
        });
    }

    console.log('Scheduler completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Scheduler ran successfully',
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in engagement-scheduler:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});