import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

interface VerifyOTPRequest {
  accessToken: string;
  otp: string;
}

// Rate limit constants
const MAX_VERIFY_ATTEMPTS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken, otp } = await req.json() as VerifyOTPRequest;
    
    console.log('Verifying client OTP for token:', accessToken?.substring(0, 8) + '...');

    if (!accessToken || !otp) {
      return new Response(
        JSON.stringify({ error: 'Access token and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate access token format
    if (typeof accessToken !== 'string' || accessToken.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid access token format' }),
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the client
    const { data: client, error: clientError } = await supabase
      .from('agent_clients')
      .select('*, admin_agents(name, email)')
      .eq('access_token', accessToken)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Invalid access link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = client.email.toLowerCase().trim();

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
      console.log(`Rate limit exceeded for client verification ${normalizedEmail}: ${attemptCount} attempts in last hour`);
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

    // Generate session token
    const sessionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for clients

    // Create client session
    const { error: sessionError } = await supabase
      .from('client_sessions')
      .insert({
        client_id: client.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update client status to active if pending
    const updateData: Record<string, unknown> = {};
    
    if (client.status === 'pending') {
      updateData.status = 'active';
      updateData.invite_accepted_at = new Date().toISOString();
      
      await supabase
        .from('agent_clients')
        .update(updateData)
        .eq('id', client.id);
        
      console.log('Client activated:', client.id);
    }

    console.log('Client verified and session created:', client.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          permissions: client.permissions,
          agentName: client.admin_agents?.name
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in client-verify-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
