import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOT_SIZE_SPIKE_THRESHOLD = 1.5; // 150% of average
const MIN_TRADES_FOR_CHECK = 5; // Need at least 5 trades for baseline

interface ConsistencyResult {
  allowed: boolean;
  is_spike: boolean;
  requested_lot_size: number;
  avg_lot_size: number;
  max_allowed_lot_size: number;
  spike_percentage: number;
  message: string | null;
  recommendation: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { account_id, user_id, requested_lot_size, hard_block = false } = await req.json();

    if (!account_id || !user_id || requested_lot_size === undefined) {
      return new Response(
        JSON.stringify({ error: 'account_id, user_id, and requested_lot_size required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[LOT-CONSISTENCY] Checking ${requested_lot_size} lots for account ${account_id}`);

    // Get recent trades to calculate average lot size
    const { data: recentTrades, error: tradesError } = await supabase
      .from('user_trade_allocations')
      .select('lot_size, created_at')
      .eq('user_id', user_id)
      .eq('account_id', account_id)
      .not('lot_size', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (tradesError) {
      console.error('[LOT-CONSISTENCY] Error fetching trades:', tradesError);
    }

    const trades = recentTrades || [];
    const result: ConsistencyResult = {
      allowed: true,
      is_spike: false,
      requested_lot_size,
      avg_lot_size: 0,
      max_allowed_lot_size: requested_lot_size,
      spike_percentage: 0,
      message: null,
      recommendation: null,
    };

    // Not enough trades for baseline - allow but note it
    if (trades.length < MIN_TRADES_FOR_CHECK) {
      result.message = `Building baseline: ${trades.length}/${MIN_TRADES_FOR_CHECK} trades recorded`;
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate average lot size (excluding current request)
    const lotSizes = trades.map(t => t.lot_size);
    const avgLotSize = lotSizes.reduce((sum, size) => sum + size, 0) / lotSizes.length;
    const maxAllowed = avgLotSize * LOT_SIZE_SPIKE_THRESHOLD;

    result.avg_lot_size = Math.round(avgLotSize * 100) / 100;
    result.max_allowed_lot_size = Math.round(maxAllowed * 100) / 100;
    result.spike_percentage = avgLotSize > 0 ? Math.round((requested_lot_size / avgLotSize) * 100) : 0;

    // Check for spike
    if (requested_lot_size > maxAllowed) {
      result.is_spike = true;
      result.message = `Lot size spike detected: ${requested_lot_size} lots is ${result.spike_percentage}% of your average (${result.avg_lot_size})`;
      result.recommendation = `Consider reducing to ${result.max_allowed_lot_size} lots or less`;

      if (hard_block) {
        result.allowed = false;
      }

      // Log the alert
      await supabase.from('trade_consistency_alerts').insert({
        user_id,
        account_id,
        alert_type: 'lot_size_spike',
        severity: hard_block ? 'blocked' : 'warning',
        current_value: requested_lot_size,
        expected_value: avgLotSize,
        threshold_pct: LOT_SIZE_SPIKE_THRESHOLD * 100,
        was_blocked: hard_block,
        message: result.message,
      });

      console.log(`[LOT-CONSISTENCY] SPIKE detected: ${requested_lot_size} vs avg ${avgLotSize}`);
    }

    // Update account's running average
    const newAvg = (avgLotSize * trades.length + requested_lot_size) / (trades.length + 1);
    await supabase
      .from('user_prop_accounts')
      .update({
        avg_lot_size: Math.round(newAvg * 10000) / 10000,
      })
      .eq('id', account_id);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[LOT-CONSISTENCY] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
