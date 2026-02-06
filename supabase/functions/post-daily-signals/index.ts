import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded Discord webhook for daily signals (separate from regular signal webhook)
const DAILY_SIGNALS_DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1463058658962313482/RC2lDNywbZwxq6mOhilaBMONWD4_A1fOe2XGGUce2fkc5fytLIJXjmnnFL6OVYYVL18Y';

// ============ TWITTER OAUTH HELPERS ============
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const normalizedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(normalizedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string {
  const TWITTER_CONSUMER_KEY = Deno.env.get('TWITTER_CONSUMER_KEY')?.trim() || '';
  const TWITTER_CONSUMER_SECRET = Deno.env.get('TWITTER_CONSUMER_SECRET')?.trim() || '';
  const TWITTER_ACCESS_TOKEN = Deno.env.get('TWITTER_ACCESS_TOKEN')?.trim() || '';
  const TWITTER_ACCESS_TOKEN_SECRET = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')?.trim() || '';

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_CONSUMER_KEY,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN_SECRET);

  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };

  return "OAuth " + Object.entries(signedOAuthParams)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

async function postToTwitter(content: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const TWITTER_CONSUMER_KEY = Deno.env.get('TWITTER_CONSUMER_KEY')?.trim();
  const TWITTER_ACCESS_TOKEN = Deno.env.get('TWITTER_ACCESS_TOKEN')?.trim();

  if (!TWITTER_CONSUMER_KEY || !TWITTER_ACCESS_TOKEN) {
    return { success: false, error: 'Twitter API keys not configured' };
  }

  try {
    const tweetUrl = "https://api.x.com/2/tweets";
    const oauthHeader = generateOAuthHeader("POST", tweetUrl);

    console.log('Posting to Twitter:', content.slice(0, 100) + '...');

    const response = await fetch(tweetUrl, {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    });

    const responseText = await response.text();
    console.log('Twitter response:', response.status, responseText);

    if (!response.ok) {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.detail || errorData.title || `HTTP ${response.status}`);
    }

    const data = JSON.parse(responseText);
    return { success: true, tweetId: data.data?.id };
  } catch (error) {
    console.error('Twitter posting error:', error);
    return { success: false, error: String(error) };
  }
}

// ============ DISCORD EMBED BUILDER ============
function buildDiscordEmbed(signal: any, rank: number) {
  const isBuy = signal.direction === 'BUY' || signal.direction === 'LONG';
  const color = isBuy ? 0x22c55e : 0xef4444; // green or red
  
  const emoji = rank === 1 ? '🥇' : '🥈';
  const rankLabel = rank === 1 ? 'TOP SIGNAL' : 'RUNNER-UP';
  
  const killZoneEmojis: Record<string, string> = {
    'LONDON': '🇬🇧',
    'NEW_YORK': '🗽',
    'ASIAN': '🌏',
    'ASIAN_OVERLAP': '🌏',
    'LONDON_CLOSE': '🇬🇧',
  };
  
  const killZoneEmoji = killZoneEmojis[signal.kill_zone] || '📊';

  // Calculate R:R display
  const rr = signal.risk_reward_ratio ? signal.risk_reward_ratio.toFixed(1) : '—';
  
  // Format prices properly based on instrument type
  const formatPrice = (price: number) => {
    if (!price) return '—';
    if (signal.symbol?.includes('JPY')) return price.toFixed(3);
    if (signal.symbol?.includes('XAU') || signal.symbol?.includes('GOLD')) return price.toFixed(2);
    if (signal.symbol?.includes('BTC') || signal.symbol?.includes('ETH')) return price.toFixed(2);
    return price.toFixed(5);
  };

  const embed: any = {
    title: `${emoji} ${rankLabel} OF THE DAY`,
    description: `**${signal.symbol}** ${isBuy ? '🟢 BUY' : '🔴 SELL'}`,
    color: color,
    fields: [
      {
        name: '📍 Entry Price',
        value: `\`${formatPrice(signal.entry_price)}\``,
        inline: true,
      },
      {
        name: '🛑 Stop Loss',
        value: `\`${formatPrice(signal.stop_loss)}\``,
        inline: true,
      },
      {
        name: '🎯 Take Profit 1',
        value: `\`${formatPrice(signal.take_profit_1)}\``,
        inline: true,
      },
      {
        name: '💪 Confluence',
        value: `\`${signal.confluence_score}/10\``,
        inline: true,
      },
      {
        name: '⚖️ Risk:Reward',
        value: `\`1:${rr}\``,
        inline: true,
      },
      {
        name: `${killZoneEmoji} Session`,
        value: `\`${signal.kill_zone?.replace('_', ' ') || 'N/A'}\``,
        inline: true,
      },
    ],
    thumbnail: {
      url: isBuy 
        ? 'https://cdn-icons-png.flaticon.com/512/7621/7621073.png' 
        : 'https://cdn-icons-png.flaticon.com/512/7621/7621110.png',
    },
    footer: {
      text: '🏆 TraderEdge Pro • Daily Best Signals',
    },
    timestamp: new Date().toISOString(),
  };

  // Add confluence factors if available
  if (signal.confluence_factors && signal.confluence_factors.length > 0) {
    const factors = signal.confluence_factors.slice(0, 4).join('\n• ');
    embed.fields.push({
      name: '📋 Key Factors',
      value: `• ${factors}`,
      inline: false,
    });
  }

  // Add take profit 2 if available
  if (signal.take_profit_2) {
    embed.fields.splice(3, 0, {
      name: '🎯 Take Profit 2',
      value: `\`${formatPrice(signal.take_profit_2)}\``,
      inline: true,
    });
  }

  return embed;
}

// ============ TWITTER CONTENT BUILDER ============
function buildTwitterContent(signal: any): string {
  const isBuy = signal.direction === 'BUY' || signal.direction === 'LONG';
  const direction = isBuy ? '🟢 BUY' : '🔴 SELL';
  
  // Format prices properly
  const formatPrice = (price: number) => {
    if (!price) return '—';
    if (signal.symbol?.includes('JPY')) return price.toFixed(3);
    if (signal.symbol?.includes('XAU') || signal.symbol?.includes('GOLD')) return price.toFixed(2);
    if (signal.symbol?.includes('BTC') || signal.symbol?.includes('ETH')) return price.toFixed(2);
    return price.toFixed(5);
  };

  const rr = signal.risk_reward_ratio ? signal.risk_reward_ratio.toFixed(1) : '—';

  // Build tweet (max 280 chars)
  const tweet = `🏆 TOP SIGNAL OF THE DAY

${signal.symbol} ${direction}

📍 Entry: ${formatPrice(signal.entry_price)}
🛑 SL: ${formatPrice(signal.stop_loss)}
🎯 TP: ${formatPrice(signal.take_profit_1)}

💪 Confluence: ${signal.confluence_score}/10 🔥
⚖️ R:R 1:${rr}

#Forex #TradingSignals #TraderEdgePro`;

  return tweet.length > 280 ? tweet.slice(0, 277) + '...' : tweet;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action = 'post_daily', date, forceRepost = false } = body;

    const today = date || new Date().toISOString().split('T')[0];
    console.log(`Processing daily signals for ${today}, action: ${action}`);

    // Check what's already been posted today
    const { data: existingPosts } = await supabase
      .from('daily_social_signal_posts')
      .select('*')
      .eq('post_date', today);

    const discordPostsToday = existingPosts?.filter(p => p.platform === 'discord' && p.success).length || 0;
    const twitterPostsToday = existingPosts?.filter(p => p.platform === 'twitter' && p.success).length || 0;

    console.log(`Already posted today - Discord: ${discordPostsToday}, Twitter: ${twitterPostsToday}`);

    // Get today's approved signals with high confluence (≥8)
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    const { data: signals, error: signalsError } = await supabase
      .from('institutional_signals')
      .select('*')
      .gte('confluence_score', 8)
      .eq('agent_approved', true)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('confluence_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (signalsError) {
      console.error('Error fetching signals:', signalsError);
      throw signalsError;
    }

    console.log(`Found ${signals?.length || 0} high-confluence signals for today`);

    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No high-confluence signals (≥8) found for today',
        discordPosted: 0,
        twitterPosted: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = {
      discord: [] as any[],
      twitter: null as any,
      errors: [] as string[],
    };

    // ============ POST TO DISCORD (Top 2 signals) ============
    if (action === 'post_daily' || action === 'post_discord') {
      const signalsForDiscord = forceRepost 
        ? signals.slice(0, 2)
        : signals.filter(s => !s.posted_to_discord).slice(0, 2 - discordPostsToday);

      console.log(`Posting ${signalsForDiscord.length} signals to Discord`);

      for (let i = 0; i < signalsForDiscord.length; i++) {
        const signal = signalsForDiscord[i];
        const rank = discordPostsToday + i + 1;

        try {
          const embed = buildDiscordEmbed(signal, rank);
          const content = rank === 1 
            ? '🚨 **DAILY TOP SIGNAL ALERT** 🚨 @here'
            : '📢 **Runner-Up Signal**';

          const discordResponse = await fetch(DAILY_SIGNALS_DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, embeds: [embed] }),
          });

          if (!discordResponse.ok) {
            const errorText = await discordResponse.text();
            throw new Error(`Discord API error: ${errorText}`);
          }

          console.log(`✅ Posted signal ${signal.symbol} to Discord (rank ${rank})`);

          // Update signal as posted
          await supabase
            .from('institutional_signals')
            .update({ 
              posted_to_discord: true, 
              posted_to_discord_at: new Date().toISOString() 
            })
            .eq('id', signal.id);

          // Log to daily posts table
          await supabase.from('daily_social_signal_posts').upsert({
            post_date: today,
            platform: 'discord',
            signal_id: signal.id,
            symbol: signal.symbol,
            confluence_score: signal.confluence_score,
            direction: signal.direction,
            entry_price: signal.entry_price,
            post_content: `${signal.symbol} ${signal.direction}`,
            success: true,
          }, { onConflict: 'post_date,platform,signal_id' });

          results.discord.push({ signalId: signal.id, symbol: signal.symbol, rank, success: true });
        } catch (error) {
          console.error(`Error posting to Discord:`, error);
          results.errors.push(`Discord: ${String(error)}`);
          results.discord.push({ signalId: signal.id, symbol: signal.symbol, rank, success: false, error: String(error) });
        }
      }
    }

    // ============ POST TO TWITTER (Top 1 signal) ============
    if ((action === 'post_daily' || action === 'post_twitter') && twitterPostsToday === 0) {
      const topSignal = forceRepost 
        ? signals[0]
        : signals.find(s => !s.posted_to_twitter);

      if (topSignal) {
        console.log(`Posting top signal ${topSignal.symbol} to Twitter`);

        try {
          const tweetContent = buildTwitterContent(topSignal);
          const twitterResult = await postToTwitter(tweetContent);

          if (twitterResult.success) {
            console.log(`✅ Posted signal ${topSignal.symbol} to Twitter`);

            // Update signal as posted
            await supabase
              .from('institutional_signals')
              .update({ 
                posted_to_twitter: true, 
                posted_to_twitter_at: new Date().toISOString() 
              })
              .eq('id', topSignal.id);

            // Log to daily posts table
            await supabase.from('daily_social_signal_posts').upsert({
              post_date: today,
              platform: 'twitter',
              signal_id: topSignal.id,
              symbol: topSignal.symbol,
              confluence_score: topSignal.confluence_score,
              direction: topSignal.direction,
              entry_price: topSignal.entry_price,
              post_content: tweetContent,
              tweet_id: twitterResult.tweetId,
              success: true,
            }, { onConflict: 'post_date,platform,signal_id' });

            results.twitter = { signalId: topSignal.id, symbol: topSignal.symbol, success: true, tweetId: twitterResult.tweetId };
          } else {
            throw new Error(twitterResult.error);
          }
        } catch (error) {
          console.error(`Error posting to Twitter:`, error);
          results.errors.push(`Twitter: ${String(error)}`);
          results.twitter = { signalId: topSignal.id, symbol: topSignal.symbol, success: false, error: String(error) };
        }
      } else {
        console.log('No unposted signals available for Twitter');
      }
    }

    const discordSuccess = results.discord.filter(d => d.success).length;
    const twitterSuccess = results.twitter?.success ? 1 : 0;

    return new Response(JSON.stringify({
      success: true,
      message: `Posted ${discordSuccess} signal(s) to Discord, ${twitterSuccess} to Twitter`,
      date: today,
      totalHighConfluenceSignals: signals.length,
      discordPosted: discordSuccess,
      twitterPosted: twitterSuccess,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in post-daily-signals:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
