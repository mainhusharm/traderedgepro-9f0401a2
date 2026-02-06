import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pip values for different instruments
const PIP_VALUES: Record<string, number> = {
  'EURUSD': 0.0001, 'GBPUSD': 0.0001, 'AUDUSD': 0.0001, 'NZDUSD': 0.0001,
  'USDCAD': 0.0001, 'USDCHF': 0.0001, 'USDJPY': 0.01, 'EURJPY': 0.01,
  'GBPJPY': 0.01, 'AUDJPY': 0.01, 'EURGBP': 0.0001, 'XAUUSD': 0.01,
};

const getPipValue = (symbol: string): number => {
  return PIP_VALUES[symbol.toUpperCase()] || 0.0001;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, accountId } = await req.json();

    console.log('Syncing trade P&L for:', { userId, accountId });

    // Fetch open trade allocations
    const query = supabase
      .from('user_trade_allocations')
      .select(`
        *,
        signal:signals(symbol, signal_type, entry_price, stop_loss, take_profit)
      `)
      .eq('status', 'open');

    if (userId) query.eq('user_id', userId);
    if (accountId) query.eq('prop_account_id', accountId);

    const { data: allocations, error: allocError } = await query;

    if (allocError) throw allocError;

    if (!allocations || allocations.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No open allocations to sync',
        updated: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get unique symbols
    const symbols = [...new Set(allocations.map(a => a.signal?.symbol).filter(Boolean))];

    // Fetch live prices
    const { data: pricesData, error: pricesError } = await supabase.functions.invoke('get-live-prices', {
      body: { symbols }
    });

    const prices: Record<string, number> = pricesData?.prices || {};

    // Calculate and update P&L for each allocation
    let updatedCount = 0;
    const updates: any[] = [];

    for (const allocation of allocations) {
      const signal = allocation.signal;
      if (!signal) continue;

      const currentPrice = prices[signal.symbol];
      if (!currentPrice) {
        console.log(`No price available for ${signal.symbol}, using theoretical price`);
        continue;
      }

      const pipValue = getPipValue(signal.symbol);
      const direction = signal.signal_type === 'BUY' ? 1 : -1;
      const priceDiff = (currentPrice - signal.entry_price) * direction;
      const pips = priceDiff / pipValue;
      
      // Calculate P&L based on lot size and pip value
      // Standard lot = 100,000 units, pip value ~$10 per pip for major pairs
      const pipValueUSD = allocation.lot_size * 10; // Simplified
      const unrealizedPnl = pips * pipValueUSD;

      // Calculate distance to SL and TP
      const pipsToSL = Math.abs(signal.entry_price - signal.stop_loss) / pipValue;
      const pipsToTP = Math.abs(signal.take_profit - signal.entry_price) / pipValue;
      
      // Calculate progress percentage
      const totalRange = pipsToSL + pipsToTP;
      const progress = totalRange > 0 ? ((pips + pipsToSL) / totalRange) * 100 : 50;

      updates.push({
        id: allocation.id,
        unrealized_pnl: Number(unrealizedPnl.toFixed(2)),
        current_price: currentPrice,
        pips_moved: Number(pips.toFixed(1)),
        progress_pct: Math.min(100, Math.max(0, Number(progress.toFixed(1)))),
        updated_at: new Date().toISOString()
      });
      updatedCount++;
    }

    // Batch update allocations
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('user_trade_allocations')
        .update({
          unrealized_pnl: update.unrealized_pnl,
          updated_at: update.updated_at
        })
        .eq('id', update.id);

      if (updateError) {
        console.error('Error updating allocation:', update.id, updateError);
      }
    }

    // Aggregate unrealized P&L per account
    if (accountId) {
      const totalUnrealizedPnl = updates.reduce((sum, u) => sum + u.unrealized_pnl, 0);
      
      await supabase
        .from('user_prop_accounts')
        .update({
          unrealized_pnl: totalUnrealizedPnl,
          theoretical_equity: supabase.rpc('calculate_theoretical_equity', { account_id: accountId }),
          last_sync_at: new Date().toISOString()
        })
        .eq('id', accountId);
    }

    console.log(`Synced ${updatedCount} allocations`);

    return new Response(JSON.stringify({ 
      success: true, 
      updated: updatedCount,
      allocations: updates
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error syncing trade P&L:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
