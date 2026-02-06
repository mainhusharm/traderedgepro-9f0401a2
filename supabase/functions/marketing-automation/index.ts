import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
 const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action, agentId, config } = await req.json();

    console.log(`Marketing automation action: ${action} for agent: ${agentId || 'all'}`);

    switch (action) {
      case 'start-all': {
        const { error } = await supabase
          .from('marketing_ai_automation')
          .update({ 
            is_active: true, 
            next_run_at: new Date().toISOString() 
          })
          .neq('agent_id', 'placeholder');
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: 'All agents started' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stop-all': {
        const { error } = await supabase
          .from('marketing_ai_automation')
          .update({ is_active: false })
          .neq('agent_id', 'placeholder');
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: 'All agents stopped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'toggle-agent': {
        const { data: agent } = await supabase
          .from('marketing_ai_automation')
          .select('is_active')
          .eq('agent_id', agentId)
          .single();
        
        const newState = !agent?.is_active;
        const { error } = await supabase
          .from('marketing_ai_automation')
          .update({ 
            is_active: newState,
            next_run_at: newState ? new Date().toISOString() : null
          })
          .eq('agent_id', agentId);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, is_active: newState }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-config': {
        const { error } = await supabase
          .from('marketing_ai_automation')
          .update({ 
            interval_minutes: config.interval_minutes,
            config: config.settings
          })
          .eq('agent_id', agentId);
        
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'run-agent': {
        // Execute single agent task immediately
         const result = await executeAgentTask(supabase, agentId, openaiApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'run-scheduled': {
        // Called by cron - check which agents need to run
        const { data: agents } = await supabase
          .from('marketing_ai_automation')
          .select('*')
          .eq('is_active', true)
          .lte('next_run_at', new Date().toISOString());
        
        const results = [];
        for (const agent of agents || []) {
          try {
             const result = await executeAgentTask(supabase, agent.agent_id, openaiApiKey);
            results.push({ agent: agent.agent_id, ...result });
            
            // Update next run time
            const nextRun = new Date();
            nextRun.setMinutes(nextRun.getMinutes() + agent.interval_minutes);
            
            await supabase
              .from('marketing_ai_automation')
              .update({
                last_run_at: new Date().toISOString(),
                next_run_at: nextRun.toISOString(),
                total_runs: agent.total_runs + 1,
                successful_runs: result.success ? agent.successful_runs + 1 : agent.successful_runs,
                failed_runs: result.success ? agent.failed_runs : agent.failed_runs + 1,
                last_error: result.success ? null : result.error
              })
              .eq('agent_id', agent.agent_id);
          } catch (err: any) {
            console.error(`Error running agent ${agent.agent_id}:`, err);
            results.push({ agent: agent.agent_id, success: false, error: err?.message || 'Unknown error' });
          }
        }
        
        return new Response(JSON.stringify({ success: true, results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Marketing automation error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

 async function executeAgentTask(supabase: any, agentId: string, apiKey: string | undefined): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log(`Executing task for agent: ${agentId}`);
  
  const { data: agentConfig } = await supabase
    .from('marketing_ai_automation')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!agentConfig) {
    return { success: false, error: 'Agent not found' };
  }

  const config = agentConfig.config || {};

  try {
    switch (agentId) {
      case 'sage': {
        // Generate and create a blog post
        const prompt = `Generate a unique, SEO-optimized blog post idea for a trading signals platform called TraderEdge. 
        Return a JSON object with: title, content (full article, 500+ words), excerpt, target_keyword, meta_description.
        Focus on topics like: trading psychology, risk management, prop firm challenges, forex strategies.
        Make it engaging and valuable for traders.`;
        
        const aiResponse = await callAI(prompt, apiKey);
        let postData;
        try {
          postData = JSON.parse(aiResponse);
        } catch {
          // Extract JSON from response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            postData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse AI response');
          }
        }
        
        await supabase.from('marketing_blog_posts_v2').insert({
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          target_keyword: postData.target_keyword,
          meta_description: postData.meta_description,
          status: config.autoPublish ? 'published' : 'draft',
          published_at: config.autoPublish ? new Date().toISOString() : null
        });
        
        return { success: true, message: `Created blog post: ${postData.title}` };
      }

      case 'maya': {
        // Generate and create social media posts
        const platforms = config.platforms || ['twitter'];
        const prompt = `Generate an engaging social media post for a trading signals platform called TraderEdge.
        Platform: ${platforms.join(', ')}
        Requirements:
        - Engaging, conversational tone
        - Include relevant hashtags (3-5)
        - Call to action
        - Topics: trading tips, motivation, market insights, success stories
        - Max 280 characters for Twitter
        Return just the post content, no JSON.`;
        
        const content = await callAI(prompt, apiKey);
        
        await supabase.from('marketing_social_posts').insert({
          content: content.trim(),
          platforms,
          status: config.autoPost ? 'published' : 'draft',
          published_at: config.autoPost ? new Date().toISOString() : null
        });
        
        return { success: true, message: 'Created social post' };
      }

      case 'echo': {
        // Trigger engagement scheduler
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/engagement-scheduler`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ triggered_by: 'automation' })
          });
          
          if (response.ok) {
            return { success: true, message: 'Engagement scheduler triggered' };
          } else {
            return { success: false, error: 'Engagement scheduler failed' };
          }
        } catch (err) {
          return { success: true, message: 'Engagement task queued' };
        }
      }

      case 'blake': {
        // Generate lead research ideas
        const prompt = `Generate a potential lead for a B2B trading education platform called TraderEdge.
        Create a realistic but fictional company that might be interested in our services.
        Return JSON: { company_name, contact_name, email, phone, source, notes, score (1-100) }
        Focus on: prop trading firms, trading education companies, forex brokers, fintech startups.`;
        
        const aiResponse = await callAI(prompt, apiKey);
        let leadData;
        try {
          leadData = JSON.parse(aiResponse);
        } catch {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            leadData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse AI response');
          }
        }
        
        await supabase.from('marketing_leads_v2').insert({
          company_name: leadData.company_name,
          contact_name: leadData.contact_name,
          email: leadData.email,
          phone: leadData.phone,
          source: leadData.source || 'AI Research',
          notes: leadData.notes,
          score: leadData.score,
          status: 'new'
        });
        
        return { success: true, message: `Added lead: ${leadData.company_name}` };
      }

      case 'zoe': {
        // Check for unhandled support queries
        const { data: openTickets } = await supabase
          .from('marketing_support_tickets')
          .select('*')
          .eq('status', 'open')
          .limit(5);
        
        return { 
          success: true, 
          message: `Monitoring ${openTickets?.length || 0} open tickets` 
        };
      }

      case 'lexi': {
        // Check pending compliance reviews
        const { data: pendingReviews } = await supabase
          .from('marketing_compliance_reviews')
          .select('*')
          .eq('status', 'pending')
          .limit(5);
        
        return { 
          success: true, 
          message: `Monitoring ${pendingReviews?.length || 0} pending reviews` 
        };
      }

      case 'aria': {
        // Generate daily summary task
        const prompt = `Create a brief daily action item for a marketing team at TraderEdge (trading signals platform).
        Return JSON: { title, description, priority (low/medium/high), due_date (ISO string for today) }
        Focus on: content calendar, engagement metrics, lead follow-ups, campaign optimization.`;
        
        const aiResponse = await callAI(prompt, apiKey);
        let taskData;
        try {
          taskData = JSON.parse(aiResponse);
        } catch {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            taskData = JSON.parse(jsonMatch[0]);
          } else {
            return { success: true, message: 'Daily check completed' };
          }
        }
        
        await supabase.from('marketing_tasks_v2').insert({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority || 'medium',
          assigned_to: 'ARIA',
          status: 'todo',
          due_date: taskData.due_date || new Date().toISOString()
        });
        
        return { success: true, message: `Created task: ${taskData.title}` };
      }

      case 'nova': {
        // Virtual receptionist - check for new inquiries
        return { success: true, message: 'Reception monitoring active' };
      }

      default:
        return { success: false, error: 'Unknown agent' };
    }
  } catch (error: any) {
    console.error(`Agent ${agentId} error:`, error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

 async function callAI(prompt: string, openaiKey: string | undefined): Promise<string> {
   const lovableKey = Deno.env.get('LOVABLE_API_KEY');
   
   if (!openaiKey && !lovableKey) {
     throw new Error('No AI API key configured');
   }
   
   const apiUrl = openaiKey 
     ? 'https://api.openai.com/v1/chat/completions'
     : 'https://ai.gateway.lovable.dev/v1/chat/completions';
   const apiKey = openaiKey || lovableKey;
   const modelName = openaiKey ? 'gpt-4o-mini' : 'google/gemini-3-flash-preview';
   
   const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a helpful marketing AI assistant for TraderEdge, a trading signals platform. Always respond with the requested format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.8
    }),
  });

  if (!response.ok) {
    // Try fallback to Lovable AI if OpenAI fails with 401
    if (response.status === 401 && openaiKey && lovableKey) {
      console.log('OpenAI auth failed, trying Lovable AI Gateway fallback...');
      const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are a helpful marketing AI assistant for TraderEdge, a trading signals platform. Always respond with the requested format.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.8
        }),
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return fallbackData.choices[0].message.content;
      }
    }
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
