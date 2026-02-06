import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

// Rate limit constants
const MAX_VERIFY_ATTEMPTS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      console.log(`Rate limit exceeded for verification ${normalizedEmail}: ${attemptCount} attempts in last hour`);
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

    // Find valid OTP
    const { data: otpRecord, error: findError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp_code', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !otpRecord) {
      console.error('OTP verification failed:', findError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // Check if user exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const user = existingUser.users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (user) {
      // User exists - create a session directly using signInWithPassword workaround
      // Generate a temporary password and update user, then sign them in
      const tempPassword = crypto.randomUUID() + '-Temp1!';
      
      // Update user's password temporarily
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: tempPassword
      });

      if (updateError) {
        console.error('Failed to update user password:', updateError);
        throw new Error('Authentication failed. Please try again.');
      }

      // Sign in the user with the temporary password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: tempPassword
      });

      if (signInError) {
        console.error('Failed to sign in user:', signInError);
        throw new Error('Authentication failed. Please try again.');
      }

      // Return the session tokens
      return new Response(
        JSON.stringify({ 
          success: true, 
          userExists: true,
          session: {
            access_token: signInData.session?.access_token,
            refresh_token: signInData.session?.refresh_token,
            expires_in: signInData.session?.expires_in,
            expires_at: signInData.session?.expires_at,
            token_type: signInData.session?.token_type
          },
          user: {
            id: signInData.user?.id,
            email: signInData.user?.email
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // User doesn't exist
      return new Response(
        JSON.stringify({ 
          success: true, 
          userExists: false,
          email: normalizedEmail
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error in verify-otp:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify OTP';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
