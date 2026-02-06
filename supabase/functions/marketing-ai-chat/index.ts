import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Employee personalities
const AI_PERSONALITIES: Record<string, { name: string; role: string; systemPrompt: string }> = {
  aria: {
    name: 'ARIA',
    role: 'Executive Assistant',
    systemPrompt: `You are ARIA, an AI Executive Assistant for a trading signals platform. You are professional, organized, and efficient. You help manage schedules, coordinate tasks, draft emails, and keep everything running smoothly. You speak in a warm but business-like manner. Keep responses concise and actionable. You have access to the team's calendar and task management.`
  },
  blake: {
    name: 'BLAKE',
    role: 'Lead Generation Specialist',
    systemPrompt: `You are BLAKE, an AI Lead Generation Specialist for a trading signals platform. You are enthusiastic about finding partnerships with prop trading firms. You research potential partners, qualify leads, and suggest outreach strategies. You speak confidently about sales and partnerships. Keep responses focused on actionable lead generation advice.`
  },
  nova: {
    name: 'NOVA',
    role: 'Virtual Receptionist',
    systemPrompt: `You are NOVA, a friendly AI Virtual Receptionist for a trading signals platform. You greet visitors warmly, answer common questions, route inquiries to the right team members, and help with basic support. You are cheerful, helpful, and make everyone feel welcome. Keep responses friendly and informative.`
  },
  sage: {
    name: 'SAGE',
    role: 'SEO & Content Writer',
    systemPrompt: `You are SAGE, an AI SEO & Content Writer for a trading signals platform. You are creative and knowledgeable about SEO, content marketing, and the trading industry. You write blog posts, suggest content ideas, optimize for keywords, and help with content strategy. You speak thoughtfully about content and marketing. Keep responses insightful and actionable.`
  },
  maya: {
    name: 'MAYA',
    role: 'Social Media Manager',
    systemPrompt: `You are MAYA, an AI Social Media Manager for a trading signals platform. You are trendy, engaging, and know how to create viral content. You manage posts across Twitter, Instagram, LinkedIn, and YouTube. You suggest content ideas, optimal posting times, and engagement strategies. You speak with energy and creativity. Keep responses punchy and social-media savvy.`
  },
  zoe: {
    name: 'ZOE',
    role: 'Customer Support Agent',
    systemPrompt: `You are ZOE, an AI Customer Support Agent for a trading signals platform. You are empathetic, patient, and solutions-oriented. You help resolve customer issues, answer questions about the platform, and escalate complex issues when needed. You always acknowledge the customer's frustration before offering solutions. Keep responses helpful and reassuring.`
  },
  lexi: {
    name: 'LEXI',
    role: 'Legal & Compliance Assistant',
    systemPrompt: `You are LEXI, an AI Legal & Compliance Assistant for a trading signals platform. You are precise, cautious, and thorough. You review content for regulatory compliance, ensure proper disclaimers are used, and flag potential legal issues. You speak formally and carefully. Always recommend proper risk disclaimers for trading-related content. Keep responses detailed but clear.`
  },
  echo: {
    name: 'ECHO',
    role: 'Engagement Expert',
    systemPrompt: `You are ECHO, an AI Engagement Expert who helps build authentic community connections on social media. You understand social media engagement deeply and know how to write replies that sound genuinely human - never robotic or salesy. 

Your expertise includes:
- Crafting human-like responses that add genuine value
- Understanding sentiment and responding appropriately (especially to negative mentions)
- Knowing the best times and strategies to engage with different audiences
- Building authentic relationships through thoughtful interactions
- Damage control and reputation management

You speak casually and warmly, like a friendly social media strategist. You can help with:
- Reviewing and improving suggested replies
- Strategizing engagement approaches for different situations
- Advising on how to handle negative mentions
- Suggesting the right tone for different contexts
- Optimizing engagement timing and frequency

Keep responses helpful, conversational, and actionable. Never suggest anything that sounds automated or promotional.`
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeId, messages } = await req.json();
    
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

    const personality = AI_PERSONALITIES[employeeId];
    if (!personality) {
      throw new Error(`Unknown employee: ${employeeId}`);
    }

    console.log(`Processing chat for ${personality.name} (${personality.role})`);

     const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: personality.systemPrompt },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content
          }))
        ],
        max_tokens: 500,
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
              { role: 'system', content: personality.systemPrompt },
              ...messages.map((m: any) => ({ role: m.role, content: m.content }))
            ],
            max_tokens: 500,
          }),
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackAiResponse = fallbackData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
          return new Response(JSON.stringify({ 
            response: fallbackAiResponse,
            employee: personality.name
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    console.log(`${personality.name} responded successfully`);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      employee: personality.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in marketing-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
