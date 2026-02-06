import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateSessionRequest {
  sessionToken: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken } = await req.json() as ValidateSessionRequest;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Session token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and validate session
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('*, admin_agents(*)')
      .eq('session_token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if agent is still active
    if (session.admin_agents?.status === 'inactive') {
      // Delete the session
      await supabase
        .from('agent_sessions')
        .delete()
        .eq('id', session.id);

      return new Response(
        JSON.stringify({ valid: false, error: 'Agent account has been deactivated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity and extend session expiry (sliding window - 10 hours from now)
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours
    await supabase
      .from('agent_sessions')
      .update({ 
        last_activity_at: new Date().toISOString(),
        expires_at: newExpiresAt.toISOString()
      })
      .eq('id', session.id);

    // Update agent last seen
    await supabase
      .from('admin_agents')
      .update({ 
        last_seen_at: new Date().toISOString(),
        is_online: true 
      })
      .eq('id', session.agent_id);

    return new Response(
      JSON.stringify({ 
        valid: true,
        agent: {
          id: session.admin_agents.id,
          name: session.admin_agents.name,
          email: session.admin_agents.email,
          permissions: session.admin_agents.permissions,
          status: session.admin_agents.status
        },
        expiresAt: newExpiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating agent session:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
