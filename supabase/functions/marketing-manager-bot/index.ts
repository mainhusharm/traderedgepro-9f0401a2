import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOG_ANALYSIS_PROMPT = `You are an expert SEO and Content Strategy Manager for a trading signals and prop trading platform called TraderEdge Pro.

Analyze the market trends and existing content to suggest 5-6 high-impact blog post ideas. Consider:
- Trending topics in prop trading, forex, and trading signals
- SEO opportunities and keyword gaps
- Content that would attract prop traders and forex enthusiasts
- Educational content about risk management, trading psychology, and strategies

For each suggestion, provide:
1. A compelling title
2. A brief description (2-3 sentences)
3. Target keywords (3-4 keywords)
4. Priority level (high/medium/low based on potential impact)
5. Estimated engagement potential

Return a JSON array with this structure:
[
  {
    "id": "unique-id",
    "type": "blog",
    "title": "Blog Post Title",
    "description": "Brief description of what the article covers",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "priority": "high|medium|low",
    "estimatedEngagement": "High|Medium|Low"
  }
]

Focus on actionable, valuable content that positions the platform as an authority.`;

const SOCIAL_ANALYSIS_PROMPT = `You are an expert Social Media Manager and Content Strategist for a trading signals and prop trading platform called TraderEdge Pro.

Analyze current social media trends to suggest 6-8 highly engaging content ideas across ALL major platforms. Consider:
- Trending topics on Twitter/X, LinkedIn, Instagram, TikTok, Facebook, YouTube, Pinterest, and Threads
- Viral content formats: tips, memes, educational threads, success stories, challenges, behind-the-scenes
- Platform-specific optimization (short-form for TikTok/Reels, professional for LinkedIn, visual for Instagram)
- Engagement-driving content: polls, questions, challenges, tutorials, transformations
- Video content ideas for Reels, TikTok, YouTube Shorts with hook suggestions

For each suggestion, provide:
1. A catchy hook/title that stops the scroll
2. A brief description of the content concept
3. Content type (post, story, reel_script, thread, video_script, carousel)
4. Relevant hashtags (5-7 trending + niche hashtags)
5. Target platforms (can be multiple)
6. Priority level based on viral potential
7. Estimated engagement potential
8. Best posting time suggestion

Return a JSON array with this structure:
[
  {
    "id": "unique-id",
    "type": "social",
    "contentType": "post|story|reel_script|thread|video_script|carousel",
    "title": "Post Hook/Title",
    "description": "Brief description of the post concept",
    "keywords": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "platforms": ["twitter", "linkedin", "instagram", "tiktok", "facebook", "youtube", "pinterest", "threads"],
    "priority": "high|medium|low",
    "estimatedEngagement": "Viral Potential|High|Medium|Low",
    "bestPostingTime": "Best time to post this content"
  }
]

Focus on creating viral-worthy, shareable content that:
- Hooks viewers in the first 3 seconds (for video)
- Provides actionable value
- Encourages saves, shares, and comments
- Builds community and trust
- Positions the brand as the go-to trading authority`;

const BLOG_GENERATE_PROMPT = `You are an expert SEO Content Writer for TraderEdge Pro.

Generate a complete blog post based on this suggestion:
TITLE: {title}
DESCRIPTION: {description}
KEYWORDS: {keywords}

Create:
1. An SEO-optimized title (keep the essence but optimize if needed)
2. A compelling excerpt (150-200 characters)
3. A meta description (under 160 characters)
4. Full article content (800-1200 words, well-structured with headers)
5. Target keyword for SEO

Return JSON:
{
  "title": "Final Title",
  "excerpt": "Brief excerpt",
  "meta_description": "SEO meta description",
  "content": "Full markdown content with ## headers",
  "target_keyword": "main keyword",
  "seo_score": 85
}

Write in an authoritative but approachable tone. Include actionable insights.`;

const SOCIAL_GENERATE_PROMPT = `You are an expert Social Media Content Creator and Viral Content Strategist for TraderEdge Pro.

Generate complete, platform-optimized content based on this suggestion:
TITLE: {title}
DESCRIPTION: {description}
CONTENT TYPE: {contentType}
PLATFORMS: {platforms}
HASHTAGS: {keywords}

Create content tailored for the specified type:

FOR POSTS: Create engaging, scroll-stopping content with a strong hook, value proposition, and CTA.

FOR STORIES: Create 3-5 story frames with brief, punchy text for each frame.

FOR REEL/VIDEO SCRIPTS: Create a complete script with:
- Hook (first 3 seconds - must grab attention)
- Problem/Pain point (5 seconds)
- Solution/Value (10-15 seconds)
- CTA (3 seconds)
- On-screen text suggestions
- Background music mood suggestion

FOR THREADS: Create a 5-7 tweet thread with:
- Viral hook tweet
- Supporting tweets with value
- Engagement tweet at the end

FOR CAROUSELS: Create 5-8 slide content with title and body for each slide.

Return JSON:
{
  "content": "The full post content OR first tweet/slide",
  "platforms": ["platform1", "platform2"],
  "contentType": "post|story|reel_script|thread|video_script|carousel",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "additionalContent": {
    "storyFrames": ["frame1", "frame2"] (for stories),
    "threadTweets": ["tweet1", "tweet2"] (for threads),
    "carouselSlides": [{"title": "", "body": ""}] (for carousels),
    "videoScript": {
      "hook": "First 3 seconds script",
      "problem": "Pain point script",
      "solution": "Value delivery script",
      "cta": "Call to action script",
      "onScreenText": ["text1", "text2"],
      "musicMood": "upbeat/dramatic/chill/inspiring"
    } (for video scripts)
  },
  "caption": "Full caption with hashtags",
  "bestPostingTime": "Suggested posting time"
}

Write in an engaging, conversational tone. Make every word count. Create content that gets saved, shared, and commented on.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, action, existingContent, suggestion, scheduledAt } = await req.json();
    
     const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
     const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
     
     if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
       throw new Error('No AI API key configured');
    }
     
     // Determine which API to use
     const apiUrl = OPENAI_API_KEY 
       ? 'https://api.openai.com/v1/chat/completions'
       : 'https://ai.gateway.lovable.dev/v1/chat/completions';
     const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
     const modelName = OPENAI_API_KEY ? 'gpt-4o-mini' : 'google/gemini-3-flash-preview';

    console.log(`Marketing Manager Bot: ${action} for ${type}`);

    if (action === 'analyze') {
      // Analysis action - generate suggestions
      const systemPrompt = type === 'blog' ? BLOG_ANALYSIS_PROMPT : SOCIAL_ANALYSIS_PROMPT;
      
      let contextMessage = "Current date: " + new Date().toISOString().split('T')[0];
      if (existingContent && existingContent.length > 0) {
        const titles = existingContent.map((c: any) => c.title || c.content?.slice(0, 50)).join(', ');
        contextMessage += `\n\nRecent content titles: ${titles}\n\nAvoid suggesting similar topics.`;
      }

       const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextMessage }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Handle 401 with fallback to Lovable AI if available
        if (response.status === 401 && OPENAI_API_KEY && LOVABLE_API_KEY) {
          console.log('OpenAI auth failed, trying Lovable AI Gateway fallback...');
          const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: contextMessage }
              ],
              max_tokens: 2000,
            }),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            let aiResponse = fallbackData.choices?.[0]?.message?.content || "[]";
            aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const jsonMatch = aiResponse.match(/\[[\s\S]*?\](?=\s*$|\s*[^,\]\}])/);
            if (jsonMatch) {
              let jsonStr = jsonMatch[0].replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
              const suggestions = JSON.parse(jsonStr);
              const suggestionsWithIds = suggestions.map((s: any, i: number) => ({
                ...s,
                id: s.id || `suggestion-${Date.now()}-${i}`
              }));
              return new Response(JSON.stringify({ suggestions: suggestionsWithIds }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }
        
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.choices?.[0]?.message?.content || "[]";
      
      // Clean the response - remove markdown code blocks
      aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Extract JSON array from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*?\](?=\s*$|\s*[^,\]\}])/);
      if (jsonMatch) {
        try {
          // Clean potential trailing issues
          let jsonStr = jsonMatch[0];
          // Fix common JSON issues
          jsonStr = jsonStr.replace(/,\s*\]/g, ']'); // Remove trailing commas
          jsonStr = jsonStr.replace(/,\s*\}/g, '}'); // Remove trailing commas in objects
          
          const suggestions = JSON.parse(jsonStr);
          // Add unique IDs if not present
          const suggestionsWithIds = suggestions.map((s: any, i: number) => ({
            ...s,
            id: s.id || `suggestion-${Date.now()}-${i}`
          }));
          
          console.log(`Generated ${suggestionsWithIds.length} suggestions`);
          
          return new Response(JSON.stringify({ suggestions: suggestionsWithIds }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Raw:', jsonMatch[0].slice(0, 500));
          throw new Error('Failed to parse AI suggestions - invalid JSON');
        }
      }
      
      console.error('No JSON array found in response:', aiResponse.slice(0, 500));
      throw new Error('Failed to parse AI suggestions - no JSON array found');
    }

    if (action === 'generate') {
      // Generate full content from suggestion
      const promptTemplate = type === 'blog' ? BLOG_GENERATE_PROMPT : SOCIAL_GENERATE_PROMPT;
      const prompt = promptTemplate
        .replace('{title}', suggestion.title)
        .replace('{description}', suggestion.description)
        .replace('{keywords}', (suggestion.keywords || []).join(', '))
        .replace('{platforms}', (suggestion.platforms || []).join(', '))
        .replace('{contentType}', suggestion.contentType || 'post');

       const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.choices?.[0]?.message?.content || "{}";
      
      // Clean the response - remove markdown code blocks and extra whitespace
      aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Helper function to safely extract and parse JSON
      const safeParseJSON = (str: string): any => {
        // Extract JSON object from response - match outermost braces
        let braceCount = 0;
        let startIndex = -1;
        let endIndex = -1;
        
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '{') {
            if (startIndex === -1) startIndex = i;
            braceCount++;
          } else if (str[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (startIndex === -1 || endIndex === -1) {
          return null;
        }
        
        let jsonStr = str.slice(startIndex, endIndex);
        
        // Clean common JSON issues
        jsonStr = jsonStr.replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays
        jsonStr = jsonStr.replace(/,\s*\}/g, '}'); // Remove trailing commas in objects
        jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters
        jsonStr = jsonStr.replace(/\n\s*\n/g, '\n'); // Remove double newlines
        
        // Fix unescaped quotes within strings (common AI issue)
        // This regex attempts to fix quotes that appear in content values
        jsonStr = jsonStr.replace(/"content":\s*"([\s\S]*?)(?=",\s*"(?:platforms|hashtags|title|excerpt|meta_description|target_keyword|seo_score|contentType|additionalContent|caption|bestPostingTime)"|"\s*\})/g, (match, content) => {
          const escapedContent = content.replace(/(?<!\\)"/g, '\\"');
          return `"content": "${escapedContent}"`;
        });
        
        return JSON.parse(jsonStr);
      };
      
      try {
        const content = safeParseJSON(aiResponse);
        
        if (!content) {
          console.error('No JSON object found in response:', aiResponse.slice(0, 500));
          throw new Error('No JSON found');
        }
        
        // Add scheduled_at if provided
        if (scheduledAt) {
          content.scheduled_at = scheduledAt;
          content.status = 'scheduled';
        }
        
        console.log(`Generated ${type} content: ${content.title || content.content?.slice(0, 50)}`);
        
        return new Response(JSON.stringify({ content }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw response (first 1000 chars):', aiResponse.slice(0, 1000));
        
        // Fallback: Try to construct a minimal valid response
        const titleMatch = aiResponse.match(/"title":\s*"([^"]+)"/);
        const contentMatch = aiResponse.match(/"content":\s*"([\s\S]*?)(?:"\s*,|\"\s*\})/);
        const excerptMatch = aiResponse.match(/"excerpt":\s*"([^"]+)"/);
        
        if (titleMatch || contentMatch) {
          console.log('Using fallback parsing for partial content');
          const fallbackContent: any = {
            title: titleMatch?.[1] || 'Generated Content',
            content: contentMatch?.[1]?.replace(/\\"/g, '"') || 'Content generation partially succeeded. Please try again.',
            excerpt: excerptMatch?.[1] || '',
            meta_description: '',
            target_keyword: '',
            seo_score: 70
          };
          
          if (scheduledAt) {
            fallbackContent.scheduled_at = scheduledAt;
            fallbackContent.status = 'scheduled';
          }
          
          return new Response(JSON.stringify({ content: fallbackContent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error('Failed to parse AI content - invalid JSON format');
      }
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Error in marketing-manager-bot:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
