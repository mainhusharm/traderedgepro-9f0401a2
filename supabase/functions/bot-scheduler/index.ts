import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is called by a cron job to run active bots automatically
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Bot Scheduler: Checking for active institutional bot...');

    // Get the institutional signal bot status
    const { data: botStatus, error } = await supabase
      .from('bot_status')
      .select('*')
      .eq('bot_type', 'institutional_signal_bot')
      .eq('is_running', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching bot status:', error);
      throw error;
    }

    if (!botStatus) {
      console.log('Institutional bot is not running');
      return new Response(JSON.stringify({ message: 'Bot not running' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: any[] = [];

    console.log('Running institutional-signal-bot...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/institutional-signal-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'run_bot'
        })
      });

      const result = await response.json();
      results.push({
        botType: 'institutional_signal_bot',
        success: response.ok,
        signalsGenerated: result.signalsGenerated || 0
      });
      
      console.log('Institutional bot result:', result);
      
      // Update last_signal_at
      if (result.signalsGenerated > 0) {
        await supabase
          .from('bot_status')
          .update({ last_signal_at: new Date().toISOString() })
          .eq('bot_type', 'institutional_signal_bot');
      }
    } catch (err) {
      console.error('Error running institutional bot:', err);
      results.push({
        botType: 'institutional_signal_bot',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Reset signals_sent_today at midnight UTC
    const now = new Date();
    if (now.getUTCHours() === 0 && now.getUTCMinutes() < 15) {
      await supabase
        .from('bot_status')
        .update({ signals_sent_today: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('Reset daily signal counts');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      botsRun: 1,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bot Scheduler error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});