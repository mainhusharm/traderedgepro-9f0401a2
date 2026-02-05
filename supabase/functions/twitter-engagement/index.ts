import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitter OAuth 1.0a implementation
const TWITTER_BASE_URL = "https://api.x.com/2";

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  return signature;
}

function generateOAuthHeader(
  method: string, 
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));

  return "OAuth " + entries.map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ");
}

// Brand integration techniques for natural mentions
const BRAND_INTEGRATION_TECHNIQUES = [
  'Casually mention a resource or community (e.g., "I found good insights on TraderEdge Pro" or "The TraderEdge Pro community discusses this often")',
  'Reference a helpful tool or feature naturally (e.g., "Using proper risk management tools like what TraderEdge Pro offers changed my game")',
  'Share as a peer recommendation (e.g., "Have you checked TraderEdge Pro? Some solid signal work there")',
  'Mention as part of your trading journey (e.g., "Since joining TraderEdge Pro, my prop firm attempts have been more structured")',
  'Reference their educational content (e.g., "TraderEdge Pro has some good free resources on this topic")',
  'Mention it as something that helped you personally (e.g., "TraderEdge Pro helped me stay disciplined with risk management")',
];

// Human-like reply generation prompts with subtle brand awareness
const REPLY_PROMPTS: Record<string, string> = {
  friendly: `You are a friendly, enthusiastic member of the trading community who happens to use TraderEdge Pro. Generate a reply that:
- Sounds 100% human and natural (NEVER robotic or corporate)
- Is warm, casual, and approachable
- Uses contractions (don't, can't, won't, it's)
- Occasionally uses emojis (1-2 max) if appropriate
- Varies sentence length naturally
- Adds genuine value (a tip, encouragement, or thoughtful question)
- Is 1-3 sentences (Twitter-appropriate length)
- SUBTLY weave in a natural mention of TraderEdge Pro when contextually relevant - as if you're a real user sharing your experience. Make it feel like a genuine recommendation, NOT an ad.
- Example natural integrations: "Been using TraderEdge Pro lately - their signals have been on point" or "The risk calculators on TraderEdge Pro helped me with this exact issue"
- NEVER sounds like an ad or promotion - it should feel like a friend sharing what worked for them
- NEVER uses hashtags in replies
- If the topic doesn't naturally fit a mention, just give a helpful reply without forcing it`,

  professional: `You are a knowledgeable trading professional who utilizes TraderEdge Pro in your trading workflow. Generate a reply that:
- Is polished and business-like but still human
- Shows expertise without being condescending
- Is helpful and informative
- Uses proper grammar but isn't stiff
- Is 1-3 sentences
- When relevant, naturally reference TraderEdge Pro as a tool you use or recommend, like a colleague would - "I've found TraderEdge Pro useful for signal validation" or "Resources like TraderEdge Pro cover this well"
- Keep the mention seamless and professional - it should enhance the reply, not distract
- NEVER sounds like marketing copy
- NEVER uses hashtags`,

  witty: `You are a clever, engaging member of the trading community. Generate a reply that:
- Is memorable and quotable
- Uses humor or clever wordplay when appropriate
- Is sharp but never mean-spirited
- Shows personality and wit
- Is 1-2 sentences (punchy and impactful)
- If it fits naturally and wittily, slip in a TraderEdge Pro mention as a fellow trader might - "TraderEdge Pro signals + patience = chef's kiss" or "Learned that lesson the hard way before finding TraderEdge Pro lol"
- Only include if it doesn't kill the wit - prioritize the clever response
- NEVER forces humor if it doesn't fit
- NEVER uses hashtags`,

  empathetic: `You are a supportive, understanding member of the trading community who has been through similar struggles. Generate a reply that:
- Acknowledges the person's feelings/situation first
- Is warm and supportive
- Offers genuine encouragement or helpful perspective
- Shows you truly understand their challenge
- Is 2-3 sentences
- When offering hope or solutions, you can naturally mention TraderEdge Pro if it fits - "I felt the same way until I found a community like TraderEdge Pro" or "TraderEdge Pro's risk management tools really helped me regain confidence"
- The mention should feel like genuine help, not a pitch
- NEVER dismisses their concerns
- NEVER uses hashtags`
};

// Intent-based response guidance
const INTENT_GUIDANCE: Record<string, string> = {
  question: 'Answer their question helpfully with a genuine, practical response.',
  complaint: 'Acknowledge their frustration first, then offer perspective or a constructive suggestion.',
  praise: 'Thank them genuinely and add a brief, valuable insight or encouragement.',
  curiosity: 'Share a relevant experience or insight that addresses their curiosity.',
  frustration: 'Show empathy first, validate their feelings, then offer encouragement.',
  neutral: 'Engage naturally with a relevant comment, question, or insight.'
};

// Sentiment analysis function
 async function analyzeSentiment(text: string, openaiApiKey: string): Promise<{ sentiment: string; score: number; intent: string }> {
  try {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
         'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Analyze the sentiment and intent of social media posts about trading/finance. 
Return ONLY a JSON object with no additional text:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": number between -1 and 1 (-1 = very negative, 1 = very positive),
  "intent": "question" | "complaint" | "praise" | "curiosity" | "frustration" | "neutral"
}` 
          },
          { role: 'user', content: text }
        ],
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { sentiment: 'neutral', score: 0, intent: 'neutral' };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { sentiment: 'neutral', score: 0, intent: 'neutral' };
  }
}

// Generate human-like reply
 async function generateReply(post: any, style: string, openaiApiKey: string): Promise<string> {
  const basePrompt = REPLY_PROMPTS[style] || REPLY_PROMPTS.friendly;
  const intentGuide = INTENT_GUIDANCE[post.detected_intent] || INTENT_GUIDANCE.neutral;

// Select a random brand integration technique for variety
  const randomTechnique = BRAND_INTEGRATION_TECHNIQUES[Math.floor(Math.random() * BRAND_INTEGRATION_TECHNIQUES.length)];

  const prompt = `${basePrompt}

The person wrote: "${post.post_content}"

Their intent appears to be: ${post.detected_intent}
${intentGuide}

${post.sentiment === 'negative' ? 'IMPORTANT: This person seems upset. Be extra empathetic and helpful. A natural brand mention here can offer hope/solution.' : ''}

Brand integration hint (use naturally if it fits): ${randomTechnique}

Generate a single reply. No quotes, no "Reply:" prefix, just the natural response text.
CRITICAL: The TraderEdge Pro mention must feel like a genuine user recommendation, NOT an advertisement. If it doesn't fit naturally, leave it out entirely.`;

  try {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
         'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are generating authentic social media replies as a real trader who uses TraderEdge Pro (traderedgepro.lovable.app). 

Your goal is to:
1. Provide genuinely helpful, human responses first and foremost
2. When contextually appropriate, naturally mention TraderEdge Pro as something you personally use/recommend
3. Make any brand mention feel like a friend's genuine suggestion, NEVER like an ad

Guidelines for brand mentions:
- Vary how you mention it: "TraderEdge Pro", "the TraderEdge Pro community", "TraderEdge Pro's signals", etc.
- Only about 70% of replies should include a mention - sometimes just being helpful is best
- Never use phrases like "check out", "visit", "sign up" - these sound promotional
- Frame it as YOUR experience: "I use...", "helped me...", "I found...", "been using..."
- Keep it brief - just a natural drop, not a feature list

Output ONLY the reply text, nothing else.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || '';
    
    reply = reply.replace(/^["']|["']$/g, '').trim();
    reply = reply.replace(/^Reply:\s*/i, '');
    
    return reply;
  } catch (error) {
    console.error('Reply generation error:', error);
    throw error;
  }
}

// Send tweet using Twitter API v2 with OAuth 1.0a
async function sendTweet(
  text: string,
  replyToTweetId: string | null,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  const url = `${TWITTER_BASE_URL}/tweets`;
  const method = "POST";
  
  const body: any = { text };
  if (replyToTweetId) {
    body.reply = { in_reply_to_tweet_id: replyToTweetId };
  }

  const oauthHeader = generateOAuthHeader(method, url, consumerKey, consumerSecret, accessToken, accessTokenSecret);
  console.log("Sending tweet with OAuth header");

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  console.log("Twitter API response status:", response.status);

  if (!response.ok) {
    console.error("Twitter API error:", responseText);
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

// Like a tweet using Twitter API v2
async function likeTweet(
  tweetId: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  // First get user ID
  const userUrl = `${TWITTER_BASE_URL}/users/me`;
  const userOauthHeader = generateOAuthHeader("GET", userUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret);
  
  const userResponse = await fetch(userUrl, {
    headers: { Authorization: userOauthHeader }
  });
  
  if (!userResponse.ok) {
    throw new Error(`Failed to get user: ${await userResponse.text()}`);
  }
  
  const userData = await userResponse.json();
  const userId = userData.data.id;

  // Now like the tweet
  const likeUrl = `${TWITTER_BASE_URL}/users/${userId}/likes`;
  const oauthHeader = generateOAuthHeader("POST", likeUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret);

  const response = await fetch(likeUrl, {
    method: "POST",
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tweet_id: tweetId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twitter like error:", errorText);
    throw new Error(`Twitter like error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, config, post, style, reply, minFollowers } = await req.json();
    
    // Minimum followers threshold for high-engagement filtering
    const followerThreshold = minFollowers || 100;
    
     const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
     if (!OPENAI_API_KEY) {
       throw new Error('OPENAI_API_KEY is not configured');
    }
    
    console.log(`Follower threshold: ${followerThreshold}`);

    // Twitter credentials - OAuth 1.0a for posting
    const TWITTER_CONSUMER_KEY = Deno.env.get('TWITTER_CONSUMER_KEY')?.trim();
    const TWITTER_CONSUMER_SECRET = Deno.env.get('TWITTER_CONSUMER_SECRET')?.trim();
    const TWITTER_ACCESS_TOKEN = Deno.env.get('TWITTER_ACCESS_TOKEN')?.trim();
    const TWITTER_ACCESS_TOKEN_SECRET = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')?.trim();
    
    // Bearer Token for search (App-only auth)
    const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN')?.trim();
    
    const twitterPostConfigured = Boolean(
      TWITTER_CONSUMER_KEY &&
      TWITTER_CONSUMER_SECRET &&
      TWITTER_ACCESS_TOKEN &&
      TWITTER_ACCESS_TOKEN_SECRET
    );
    
    const twitterSearchConfigured = Boolean(TWITTER_BEARER_TOKEN);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Twitter engagement action: ${action}`);
    console.log(`Twitter post API configured: ${twitterPostConfigured}`);
    console.log(`Twitter search API configured: ${twitterSearchConfigured}`);
    switch (action) {
      case 'search': {
        if (!twitterSearchConfigured) {
          console.log('Twitter Bearer Token not configured - returning mock data for demo');
          
          // Generate mock posts for demonstration
          const mockPosts = [
            {
              platform: 'twitter',
              external_post_id: `mock_${Date.now()}_1`,
              author_username: 'trader_mike',
              author_display_name: 'Mike the Trader',
              post_content: 'Anyone have good prop firm recommendations? Looking to get funded 💪',
              post_type: 'post',
              found_via: 'keyword: prop firm'
            },
            {
              platform: 'twitter',
              external_post_id: `mock_${Date.now()}_2`,
              author_username: 'forex_fan_23',
              author_display_name: 'Forex Fanatic',
              post_content: 'Lost another trade today. Starting to think trading signals are all scams...',
              post_type: 'post',
              found_via: 'keyword: trading signals'
            },
            {
              platform: 'twitter',
              external_post_id: `mock_${Date.now()}_3`,
              author_username: 'newbie_trader',
              author_display_name: 'Learning to Trade',
              post_content: 'What indicators do you guys use for day trading? Still learning!',
              post_type: 'post',
              found_via: 'keyword: day trading'
            }
          ];

          const postsWithAnalysis = await Promise.all(mockPosts.map(async (mockPost) => {
             const sentiment = await analyzeSentiment(mockPost.post_content, OPENAI_API_KEY);
            const suggestedReply = await generateReply(
              { ...mockPost, ...sentiment },
              config?.reply_style || 'friendly',
               OPENAI_API_KEY
            );

            return {
              ...mockPost,
              detected_intent: sentiment.intent,
              sentiment: sentiment.sentiment,
              sentiment_score: sentiment.score,
              suggested_reply: suggestedReply,
              priority: sentiment.sentiment === 'negative' ? 10 : 5,
              status: 'pending'
            };
          }));

          const { error } = await supabase
            .from('marketing_engagement_queue')
            .insert(postsWithAnalysis);

          if (error) {
            console.error('Error saving to queue:', error);
          }

          return new Response(JSON.stringify({ 
            success: true, 
            found: postsWithAnalysis.length,
            message: 'Demo mode: Mock posts generated (add TWITTER_BEARER_TOKEN for real tweets)'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // REAL TWITTER SEARCH using Bearer Token
        console.log('Searching real tweets with Bearer Token...');
        
        const keywords = config?.keywords || ['trading', 'forex', 'prop firm'];
        const hashtags = config?.hashtags || [];
        
        // Build search query
        const searchTerms = [...keywords, ...hashtags].slice(0, 5); // Limit to 5 terms
        const query = searchTerms.join(' OR ') + ' -is:retweet lang:en';
        
        console.log(`Search query: ${query}`);
        
        try {
          // Twitter API v2 Recent Search endpoint
          const searchUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
          searchUrl.searchParams.set('query', query);
          searchUrl.searchParams.set('max_results', '10');
          searchUrl.searchParams.set('tweet.fields', 'created_at,author_id,text,public_metrics');
          searchUrl.searchParams.set('expansions', 'author_id');
          searchUrl.searchParams.set('user.fields', 'username,name,public_metrics');
          
          const searchResponse = await fetch(searchUrl.toString(), {
            headers: {
              'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
          });
          
          const searchData = await searchResponse.json();
          console.log('Twitter search response status:', searchResponse.status);
          
          if (!searchResponse.ok) {
            console.error('Twitter search error:', JSON.stringify(searchData));
            
            // Handle rate limiting gracefully
            if (searchResponse.status === 429) {
              return new Response(JSON.stringify({ 
                success: false, 
                found: 0,
                rateLimited: true,
                message: 'Twitter rate limit reached. Free tier allows ~1 search per 15 minutes. Please wait and try again.'
              }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            
            throw new Error(`Twitter API error: ${searchData.title || searchData.detail || 'Unknown error'}`);
          }
          
          if (!searchData.data || searchData.data.length === 0) {
            return new Response(JSON.stringify({ 
              success: true, 
              found: 0,
              message: 'No tweets found matching your keywords'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Build user lookup map
          const userMap = new Map();
          if (searchData.includes?.users) {
            for (const user of searchData.includes.users) {
              userMap.set(user.id, user);
            }
          }
          
          // Process real tweets and filter by follower count
          const allTweets = searchData.data.map((tweet: any) => {
            const author = userMap.get(tweet.author_id);
            return {
              platform: 'twitter',
              external_post_id: tweet.id, // Real tweet ID!
              external_post_url: `https://twitter.com/${author?.username || 'i'}/status/${tweet.id}`,
              author_username: author?.username || 'unknown',
              author_display_name: author?.name || 'Unknown User',
              author_followers: author?.public_metrics?.followers_count || 0,
              post_content: tweet.text,
              post_type: 'post', // Must be 'post' to match DB constraint
              found_via: `search: ${searchTerms[0]}`
            };
          });
          
          // Filter by minimum followers for high-engagement posts
          const realTweets = allTweets.filter((tweet: any) => tweet.author_followers >= followerThreshold);
          
          console.log(`Found ${allTweets.length} tweets, ${realTweets.length} with ${followerThreshold}+ followers`);
          
          if (realTweets.length === 0) {
            return new Response(JSON.stringify({ 
              success: true, 
              found: 0,
              totalFound: allTweets.length,
              message: `Found ${allTweets.length} tweets but none with ${followerThreshold}+ followers. Try lowering the threshold.`
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Analyze and generate replies for real tweets
          const postsWithAnalysis = await Promise.all(realTweets.map(async (tweetPost: any) => {
             const sentiment = await analyzeSentiment(tweetPost.post_content, OPENAI_API_KEY);
            const suggestedReply = await generateReply(
              { ...tweetPost, ...sentiment },
              config?.reply_style || 'friendly',
               OPENAI_API_KEY
            );

            return {
              ...tweetPost,
              detected_intent: sentiment.intent,
              sentiment: sentiment.sentiment,
              sentiment_score: sentiment.score,
              suggested_reply: suggestedReply,
              suggested_reply_style: config?.reply_style || 'friendly',
              priority: sentiment.sentiment === 'negative' ? 10 : 
                        (tweetPost.author_followers > 5000 ? 9 : 
                         tweetPost.author_followers > 1000 ? 8 : 5),
              status: 'pending'
            };
          }));

          // Save to queue
          const { error: insertError } = await supabase
            .from('marketing_engagement_queue')
            .insert(postsWithAnalysis);

          if (insertError) {
            console.error('Error saving to queue:', insertError);
          }

          return new Response(JSON.stringify({ 
            success: true, 
            found: postsWithAnalysis.length,
            message: `Found ${postsWithAnalysis.length} real tweets! Ready to engage.`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
          
        } catch (searchError: any) {
          console.error('Twitter search failed:', searchError);
          return new Response(JSON.stringify({ 
            success: false,
            error: searchError.message,
            message: 'Failed to search Twitter. Check your Bearer Token and API access level.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'generate-reply': {
         const generatedReply = await generateReply(post, style || 'friendly', OPENAI_API_KEY);
        
        return new Response(JSON.stringify({ 
          success: true, 
          reply: generatedReply 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'send-reply': {
        const replyText = reply || post.suggested_reply;
        
        if (!twitterPostConfigured) {
          console.log('Twitter API not configured - simulating reply');
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Demo mode: Reply simulated (configure Twitter OAuth to post for real)',
            simulated: true,
            tweetId: `simulated_${Date.now()}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if this is a mock/simulated post (demo mode) - these have fake IDs
        const isMockPost = post.external_post_id?.startsWith('mock_') || 
                           post.external_post_id?.startsWith('search_') ||
                           !/^\d{1,19}$/.test(post.external_post_id);
        
        if (isMockPost) {
          console.log('Mock/simulated post detected - posting as new tweet (not a reply)');
          
          try {
            const tweetResult = await sendTweet(
              replyText,
              null, // No reply-to for mock posts
              TWITTER_CONSUMER_KEY!,
              TWITTER_CONSUMER_SECRET!,
              TWITTER_ACCESS_TOKEN!,
              TWITTER_ACCESS_TOKEN_SECRET!
            );

            console.log('Tweet posted successfully:', tweetResult);

            return new Response(JSON.stringify({ 
              success: true, 
              message: 'Tweet posted successfully!',
              tweetId: tweetResult.data?.id,
              tweetUrl: `https://twitter.com/i/web/status/${tweetResult.data?.id}`
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } catch (twitterError: any) {
            console.error('Twitter post error:', twitterError);
            return new Response(JSON.stringify({ 
              success: false, 
              error: twitterError.message,
              message: 'Failed to post tweet'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Real reply to existing tweet
        try {
          const tweetResult = await sendTweet(
            replyText,
            post.external_post_id,
            TWITTER_CONSUMER_KEY!,
            TWITTER_CONSUMER_SECRET!,
            TWITTER_ACCESS_TOKEN!,
            TWITTER_ACCESS_TOKEN_SECRET!
          );

          console.log('Reply posted successfully:', tweetResult);

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Reply posted to Twitter!',
            tweetId: tweetResult.data?.id,
            tweetUrl: `https://twitter.com/i/web/status/${tweetResult.data?.id}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (twitterError: any) {
          console.error('Twitter reply error:', twitterError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: twitterError.message,
            message: 'Failed to post reply to Twitter'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'like': {
        if (!twitterPostConfigured) {
          console.log('Twitter API not configured - simulating like');
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Demo mode: Like simulated',
            simulated: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Skip liking mock posts
        if (post.external_post_id?.startsWith('mock_')) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Skipped liking mock post'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          await likeTweet(
            post.external_post_id,
            TWITTER_CONSUMER_KEY!,
            TWITTER_CONSUMER_SECRET!,
            TWITTER_ACCESS_TOKEN!,
            TWITTER_ACCESS_TOKEN_SECRET!
          );

          return new Response(JSON.stringify({ 
            success: true,
            message: 'Tweet liked!'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('Like error:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'analyze-sentiment': {
         const sentiment = await analyzeSentiment(post.post_content, OPENAI_API_KEY);
        
        return new Response(JSON.stringify({ 
          success: true, 
          ...sentiment 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in twitter-engagement:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});