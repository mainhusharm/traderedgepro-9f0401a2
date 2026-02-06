import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
  invitationToken?: string;
}

// Rate limit constants
const MAX_VERIFY_ATTEMPTS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, otp, invitationToken } = await req.json() as VerifyOTPRequest;
    
    console.log('Verifying OTP for email:', email);

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate OTP format (6 digits)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return new Response(
        JSON.stringify({ error: 'Invalid OTP format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit for verification attempts
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: attemptCount, error: rateLimitError } = await supabase
      .from('otp_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .eq('request_type', 'verify')
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Error checking rate limit:', rateLimitError);
    }

    if (attemptCount && attemptCount >= MAX_VERIFY_ATTEMPTS_PER_HOUR) {
      console.log(`Rate limit exceeded for agent verification ${normalizedEmail}: ${attemptCount} attempts in last hour`);
      return new Response(
        JSON.stringify({ error: 'Too many verification attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this verification attempt for rate limiting
    await supabase.from('otp_rate_limits').insert({
      email: normalizedEmail,
      request_type: 'verify',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    });

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp_code', otp)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      console.log('Invalid or expired OTP:', otpError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // Find the agent
    let agentQuery = supabase.from('admin_agents').select('*');
    
    if (invitationToken) {
      agentQuery = agentQuery.eq('invitation_token', invitationToken);
    } else {
      agentQuery = agentQuery.eq('email', normalizedEmail);
    }
    
    const { data: agent, error: agentError } = await agentQuery.single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours

    // Create agent session
    const { error: sessionError } = await supabase
      .from('agent_sessions')
      .insert({
        agent_id: agent.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        last_activity_at: new Date().toISOString()
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update agent status to active if pending, and set invitation_accepted_at
    const updateData: Record<string, unknown> = {
      is_online: true,
      last_seen_at: new Date().toISOString()
    };

    if (agent.status === 'pending') {
      updateData.status = 'active';
      updateData.invitation_accepted_at = new Date().toISOString();
      console.log('Activating agent:', agent.id);
    }

    await supabase
      .from('admin_agents')
      .update(updateData)
      .eq('id', agent.id);

    console.log('Agent verified and session created:', agent.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          permissions: agent.permissions,
          status: agent.status === 'pending' ? 'active' : agent.status
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agent-verify-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
