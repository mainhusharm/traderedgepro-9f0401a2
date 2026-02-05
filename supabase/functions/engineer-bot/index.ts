import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

 // Admin's Gemini API key for internal tools
 const ADMIN_GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
 const ADMIN_GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are an expert Engineer Bot for an admin dashboard. You have deep knowledge of:
- Supabase (PostgreSQL, Edge Functions, RLS policies, Auth, Storage, Realtime)
- React/TypeScript/Vite applications
- API troubleshooting and debugging
- Database optimization and security
- Web application performance

Your role is to:
1. Diagnose and fix issues reported by the admin
2. Provide clear, actionable solutions with code examples when needed
3. Analyze system health and report potential problems
4. Suggest optimizations and best practices
5. Help with database queries, RLS policies, and edge functions

When responding:
- Be concise but thorough
- Use markdown formatting for better readability
- Provide code snippets when helpful
- Suggest specific commands or SQL queries when applicable
- Always consider security implications
- Prioritize solutions that don't require downtime

For scan requests, analyze:
- Database connection status
- RLS policy coverage
- Edge function deployment status
- Authentication configuration
- API endpoint health
- Recent error patterns

Current system context:
- Platform: Supabase (PostgreSQL 15+)
- Frontend: React + Vite + TypeScript
- UI: shadcn/ui + Tailwind CSS
- State: React Query + Context
- Auth: Supabase Auth with email/password`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, messages } = await req.json();
    
    // Use Admin's Gemini API key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Create Supabase client for system checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemContext = '';

    // If it's a scan request, gather system information
    if (type === 'scan') {
      console.log('Running system scan...');
      
      // Check database tables
      const { data: tables, error: tablesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      // Check recent errors from logs (if available)
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id')
        .limit(5);

      // Check memberships
      const { data: memberships } = await supabase
        .from('memberships')
        .select('status')
        .limit(100);

      const activeMembers = memberships?.filter(m => m.status === 'active').length || 0;
      const trialMembers = memberships?.filter(m => m.status === 'trial').length || 0;
      const expiredMembers = memberships?.filter(m => m.status === 'expired').length || 0;

      systemContext = `
**Current System State (Live Data):**
- Database Connection: ${tablesError ? 'Issues Detected' : 'Healthy'}
- Active Memberships: ${activeMembers}
- Trial Memberships: ${trialMembers}
- Expired Memberships: ${expiredMembers}
- Recent User Activity: ${recentUsers?.length || 0} users checked
`;
    }

    // Build the conversation for the AI
    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + (systemContext ? '\n\n' + systemContext : '') },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    console.log('Calling Gemini API...');

    const response = await fetch(ADMIN_GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ADMIN_GEMINI_MODEL,
        messages: aiMessages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          message: '⚠️ I\'m receiving too many requests right now. Please wait a moment and try again.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          message: '⚠️ AI service credits exhausted. Please add credits to continue using the Engineer Bot.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    // For scan requests, also return structured issues if any are detected
    let issues: any[] = [];
    if (type === 'scan') {
      // Parse the AI response for any issues mentioned
      // This is a simplified detection - the AI will provide detailed analysis
      if (aiMessage.toLowerCase().includes('error') || aiMessage.toLowerCase().includes('issue')) {
        // AI found issues, but we return empty for now since AI describes them
      }
    }

    console.log('Engineer bot response generated successfully');

    return new Response(JSON.stringify({ 
      message: aiMessage,
      issues: issues,
      type: type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Engineer bot error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: `❌ **Error occurred:** ${error instanceof Error ? error.message : 'Unknown error'}

I encountered an issue while processing your request. Here are some things to try:

1. **Refresh the page** and try again
2. **Check your network connection**
3. **Try a simpler query** first

If the issue persists, there may be a temporary service disruption.`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
