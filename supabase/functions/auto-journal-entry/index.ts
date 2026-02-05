import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect trading session based on UTC hour
function detectSession(utcHour: number): string {
  if (utcHour >= 0 && utcHour < 8) return 'asian';
  if (utcHour >= 8 && utcHour < 13) return 'london';
  if (utcHour >= 13 && utcHour < 16) return 'overlap';
  if (utcHour >= 16 && utcHour < 21) return 'new_york';
  return 'after_hours';
}

// Detect potential trading mistakes
function detectMistakes(trade: any, recentTrades: any[], accountSettings: any): string[] {
  const mistakes: string[] = [];
  const tradeOpenTime = new Date(trade.created_at);
  
  // FOMO: Trade taken < 5 min after another trade closed
  const fiveMinAgo = new Date(tradeOpenTime.getTime() - 5 * 60 * 1000);
  const recentClosedTrades = recentTrades.filter(t => 
    t.status === 'closed' && 
    new Date(t.closed_at || t.updated_at) > fiveMinAgo &&
    t.id !== trade.id
  );
  if (recentClosedTrades.length > 0) {
    mistakes.push('fomo');
  }
  
  // Revenge: Trade taken immediately after a loss
  const lastTrade = recentTrades
    .filter(t => t.status === 'closed' && t.id !== trade.id)
    .sort((a, b) => new Date(b.closed_at || b.updated_at).getTime() - new Date(a.closed_at || a.updated_at).getTime())[0];
  
  if (lastTrade && lastTrade.pnl < 0) {
    const lastTradeCloseTime = new Date(lastTrade.closed_at || lastTrade.updated_at);
    const timeDiff = tradeOpenTime.getTime() - lastTradeCloseTime.getTime();
    if (timeDiff < 10 * 60 * 1000) { // Within 10 minutes
      mistakes.push('revenge');
    }
  }
  
  // Oversized: Lot size > 150% of average
  if (accountSettings?.average_lot_size && trade.lot_size) {
    if (trade.lot_size > accountSettings.average_lot_size * 1.5) {
      mistakes.push('oversized');
    }
  }
  
  // Session violation: Trade outside configured hours
  if (accountSettings?.allowed_trading_hours?.enabled) {
    const hours = accountSettings.allowed_trading_hours;
    const tradeHour = tradeOpenTime.getUTCHours();
    const tradeMinute = tradeOpenTime.getUTCMinutes();
    const tradeTime = tradeHour * 60 + tradeMinute;
    
    const [startH, startM] = (hours.start || '08:00').split(':').map(Number);
    const [endH, endM] = (hours.end || '17:00').split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    
    const isWithinHours = startTime <= endTime 
      ? (tradeTime >= startTime && tradeTime <= endTime)
      : (tradeTime >= startTime || tradeTime <= endTime);
    
    if (!isWithinHours) {
      mistakes.push('session_violation');
    }
  }
  
  return mistakes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { allocation_id, user_id } = await req.json();
    
    if (!allocation_id || !user_id) {
      return new Response(JSON.stringify({ error: 'allocation_id and user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[auto-journal] Processing closed trade: ${allocation_id} for user ${user_id}`);

    // Get the closed trade allocation
    const { data: trade, error: tradeError } = await supabase
      .from('user_trade_allocations')
      .select('*, signal:signal_id(*)')
      .eq('id', allocation_id)
      .single();

    if (tradeError || !trade) {
      console.error('[auto-journal] Trade not found:', tradeError);
      return new Response(JSON.stringify({ error: 'Trade not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if journal entry already exists for this allocation
    const { data: existingEntry } = await supabase
      .from('trade_journal')
      .select('id')
      .eq('allocation_id', allocation_id)
      .single();

    if (existingEntry) {
      console.log('[auto-journal] Journal entry already exists');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Journal entry already exists',
        journal_id: existingEntry.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get account settings for mistake detection
    const { data: account } = await supabase
      .from('user_prop_accounts')
      .select('average_lot_size, allowed_trading_hours')
      .eq('id', trade.account_id)
      .single();

    // Get recent trades for pattern detection
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTrades } = await supabase
      .from('user_trade_allocations')
      .select('id, status, pnl, created_at, closed_at, updated_at, lot_size')
      .eq('user_id', user_id)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    // Detect trading session
    const tradeOpenTime = new Date(trade.created_at);
    const sessionTaken = detectSession(tradeOpenTime.getUTCHours());

    // Detect mistakes
    const mistakeTags = detectMistakes(trade, recentTrades || [], account || {});

    // Calculate R:R
    let autoCalculatedRR = null;
    if (trade.signal) {
      const signal = trade.signal;
      const entryPrice = signal.entry_price;
      const stopLoss = signal.stop_loss;
      const exitPrice = trade.exit_price || trade.actual_pnl;
      
      if (entryPrice && stopLoss) {
        const riskPips = Math.abs(entryPrice - stopLoss);
        if (riskPips > 0 && trade.pnl !== undefined) {
          // Approximate R based on PnL direction
          const direction = signal.direction === 'BUY' ? 1 : -1;
          const pipsGained = exitPrice ? (exitPrice - entryPrice) * direction : 0;
          autoCalculatedRR = pipsGained / riskPips;
        }
      }
    }

    // Determine outcome
    let outcome = 'breakeven';
    if (trade.pnl > 0) outcome = 'win';
    else if (trade.pnl < 0) outcome = 'loss';

    // Create journal entry
    const { data: journalEntry, error: journalError } = await supabase
      .from('trade_journal')
      .insert({
        user_id,
        account_id: trade.account_id,
        signal_id: trade.signal_id,
        allocation_id,
        date: trade.created_at.split('T')[0],
        symbol: trade.signal?.symbol || 'Unknown',
        direction: trade.signal?.direction || 'BUY',
        entry_price: trade.signal?.entry_price,
        exit_price: trade.exit_price,
        lot_size: trade.lot_size,
        pnl: trade.pnl,
        outcome,
        session_taken: sessionTaken,
        auto_calculated_rr: autoCalculatedRR,
        is_auto_generated: true,
        mistake_tags: mistakeTags,
        notes: mistakeTags.length > 0 
          ? `Auto-generated. Detected issues: ${mistakeTags.join(', ')}`
          : 'Auto-generated from closed trade.'
      })
      .select()
      .single();

    if (journalError) {
      console.error('[auto-journal] Error creating journal entry:', journalError);
      return new Response(JSON.stringify({ error: journalError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update mistake patterns if any detected
    if (mistakeTags.length > 0) {
      const weekStart = getWeekStart(new Date());
      
      for (const mistakeType of mistakeTags) {
        // Simple upsert for mistake patterns
        await supabase
          .from('trading_mistake_patterns')
          .upsert({
            user_id,
            account_id: trade.account_id,
            week_start: weekStart,
            mistake_type: mistakeType,
            count: 1,
            total_pnl_impact: trade.pnl || 0
          }, { onConflict: 'user_id,account_id,week_start,mistake_type' });
      }
    }

    console.log(`[auto-journal] Created journal entry: ${journalEntry.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      journal_id: journalEntry.id,
      session_taken: sessionTaken,
      mistake_tags: mistakeTags,
      auto_calculated_rr: autoCalculatedRR
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[auto-journal] Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
