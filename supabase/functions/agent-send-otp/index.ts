import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

interface SendOTPRequest {
  email: string;
  invitationToken?: string;
}

// Rate limit constants
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, invitationToken } = await req.json() as SendOTPRequest;
    
    console.log('Agent OTP request for email:', email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit for this email
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: requestCount, error: rateLimitError } = await supabase
      .from('otp_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .eq('request_type', 'send')
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Error checking rate limit:', rateLimitError);
    }

    if (requestCount && requestCount >= MAX_OTP_REQUESTS_PER_HOUR) {
      console.log(`Rate limit exceeded for agent ${normalizedEmail}: ${requestCount} requests in last hour`);
      return new Response(
        JSON.stringify({ error: 'Too many OTP requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the agent by email or invitation token
    let agentQuery = supabase.from('admin_agents').select('*');
    
    if (invitationToken) {
      agentQuery = agentQuery.eq('invitation_token', invitationToken);
    } else {
      agentQuery = agentQuery.eq('email', normalizedEmail);
    }
    
    const { data: agent, error: agentError } = await agentQuery.single();

    if (agentError || !agent) {
      console.log('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found. Please check your email or contact admin.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if agent is not deactivated
    if (agent.status === 'inactive') {
      return new Response(
        JSON.stringify({ error: 'Your account has been deactivated. Please contact admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this request for rate limiting
    await supabase.from('otp_rate_limits').insert({
      email: agent.email.toLowerCase(),
      request_type: 'send',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in otp_verifications table
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert({
        email: agent.email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OTP via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TraderEdge Pro <noreply@traderedgepro.com>',
        to: agent.email,
        subject: 'Your Agent Login Code - TraderEdge Pro',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(212, 175, 55, 0.2);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: 700;">TraderEdge Pro</h1>
                  <p style="color: #888; margin-top: 8px; font-size: 14px;">Agent Portal</p>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                  <p style="color: #ccc; margin: 0 0 20px 0; font-size: 16px;">Hello${agent.name ? ` ${agent.name}` : ''},</p>
                  <p style="color: #aaa; margin: 0 0 25px 0; font-size: 14px;">Use the following code to log in to your Agent Dashboard:</p>
                  
                  <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); border-radius: 8px; padding: 20px; display: inline-block;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000;">${otp}</span>
                  </div>
                  
                  <p style="color: #888; margin: 25px 0 0 0; font-size: 12px;">This code expires in 10 minutes</p>
                </div>
                
                <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                  <p style="color: #666; margin: 0; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('Failed to send email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send OTP email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OTP sent successfully to:', agent.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent to your email',
        agentId: agent.id,
        agentName: agent.name,
        maskedEmail: agent.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agent-send-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
