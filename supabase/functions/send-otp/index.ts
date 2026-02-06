import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

// Rate limit constants
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      console.log(`Rate limit exceeded for ${normalizedEmail}: ${requestCount} requests in last hour`);
      return new Response(
        JSON.stringify({ error: 'Too many OTP requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this request for rate limiting
    await supabase.from('otp_rate_limits').insert({
      email: normalizedEmail,
      request_type: 'send',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        email: normalizedEmail,
        otp_code: otp,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      throw new Error('Failed to generate OTP');
    }

    // Send email with OTP using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Trader Edge Pro <noreply@traderedgepro.com>',
          to: [normalizedEmail],
          subject: 'Your Login Code - Trader Edge Pro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">Trader Edge Pro</h2>
              <p>Your one-time login code is:</p>
              <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send email:', await emailResponse.text());
      }
    } else {
      console.log('RESEND_API_KEY not configured, OTP:', otp);
    }

    console.log(`OTP sent to ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in send-otp:', error);
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
