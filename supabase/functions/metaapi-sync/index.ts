import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaApiAccount {
  id: string;
  login: string;
  name: string;
  server: string;
  platform: string;
  state: string;
  connectionStatus: string;
}

interface MetaApiAccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
}

interface MetaApiPosition {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  time: string;
  stopLoss?: number;
  takeProfit?: number;
}

interface MetaApiTrade {
  id: string;
  type: string;
  symbol: string;
  volume: number;
  openTime: string;
  closeTime: string;
  openPrice: number;
  closePrice: number;
  profit: number;
  swap: number;
  commission: number;
  pips: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, accountId, metaApiToken, metaApiAccountId } = await req.json();

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const METAAPI_TOKEN = metaApiToken || Deno.env.get('METAAPI_TOKEN');
    
    if (!METAAPI_TOKEN) {
      return new Response(JSON.stringify({ 
        error: 'MetaAPI token not configured',
        message: 'Please provide your MetaAPI token to connect your broker account'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'connect': {
        // Validate MetaAPI token and get account info
        const accountResponse = await fetch(
          `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${metaApiAccountId}`,
          {
            headers: {
              'auth-token': METAAPI_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!accountResponse.ok) {
          const error = await accountResponse.text();
          console.error('MetaAPI account fetch error:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to connect to MetaAPI account',
            details: error
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const metaAccount: MetaApiAccount = await accountResponse.json();

        // Save MetaAPI connection to database
        const { error: updateError } = await supabase
          .from('user_prop_accounts')
          .update({
            metaapi_account_id: metaApiAccountId,
            broker_connection_status: 'connected',
            broker_last_sync: new Date().toISOString(),
            broker_platform: metaAccount.platform,
            broker_server: metaAccount.server
          })
          .eq('id', accountId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Database update error:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to save connection' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          account: {
            id: metaAccount.id,
            login: metaAccount.login,
            server: metaAccount.server,
            platform: metaAccount.platform,
            status: metaAccount.connectionStatus
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_account': {
        // Get MetaAPI account ID from database
        const { data: propAccount, error: fetchError } = await supabase
          .from('user_prop_accounts')
          .select('metaapi_account_id')
          .eq('id', accountId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !propAccount?.metaapi_account_id) {
          return new Response(JSON.stringify({ 
            error: 'No broker connection found for this account'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch account info from MetaAPI
        const accountInfoResponse = await fetch(
          `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${propAccount.metaapi_account_id}/account-information`,
          {
            headers: {
              'auth-token': METAAPI_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!accountInfoResponse.ok) {
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch account info from broker'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const accountInfo: MetaApiAccountInfo = await accountInfoResponse.json();

        // Update account with live data
        const { error: updateError } = await supabase
          .from('user_prop_accounts')
          .update({
            current_equity: accountInfo.equity,
            current_balance: accountInfo.balance,
            broker_last_sync: new Date().toISOString(),
            broker_connection_status: 'connected'
          })
          .eq('id', accountId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update account:', updateError);
        }

        // Fetch open positions
        const positionsResponse = await fetch(
          `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${propAccount.metaapi_account_id}/positions`,
          {
            headers: {
              'auth-token': METAAPI_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        let positions: MetaApiPosition[] = [];
        if (positionsResponse.ok) {
          positions = await positionsResponse.json();
        }

        return new Response(JSON.stringify({ 
          success: true,
          accountInfo: {
            balance: accountInfo.balance,
            equity: accountInfo.equity,
            margin: accountInfo.margin,
            freeMargin: accountInfo.freeMargin,
            leverage: accountInfo.leverage,
            currency: accountInfo.currency
          },
          positions: positions.map(p => ({
            id: p.id,
            symbol: p.symbol,
            type: p.type,
            volume: p.volume,
            openPrice: p.openPrice,
            currentPrice: p.currentPrice,
            profit: p.profit,
            stopLoss: p.stopLoss,
            takeProfit: p.takeProfit
          })),
          lastSync: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_trades': {
        // Get MetaAPI account ID from database
        const { data: propAccount, error: fetchError } = await supabase
          .from('user_prop_accounts')
          .select('metaapi_account_id')
          .eq('id', accountId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !propAccount?.metaapi_account_id) {
          return new Response(JSON.stringify({ 
            error: 'No broker connection found for this account'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch closed trades from last 7 days
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7);

        const tradesResponse = await fetch(
          `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${propAccount.metaapi_account_id}/history-deals/time/${startTime.toISOString()}/${new Date().toISOString()}`,
          {
            headers: {
              'auth-token': METAAPI_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!tradesResponse.ok) {
          return new Response(JSON.stringify({ 
            error: 'Failed to fetch trade history from broker'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const trades: MetaApiTrade[] = await tradesResponse.json();
        let importedCount = 0;

        // Import trades to user_trade_allocations
        for (const trade of trades) {
          if (trade.profit === 0) continue; // Skip balance operations

          // Check if trade already exists
          const { data: existing } = await supabase
            .from('user_trade_allocations')
            .select('id')
            .eq('broker_trade_id', trade.id)
            .eq('account_id', accountId)
            .maybeSingle();

          if (existing) continue;

          // Calculate risk amount (estimate based on SL distance)
          const riskAmount = Math.abs(trade.profit) / (trade.profit > 0 ? 2 : 1);

          // Insert trade
          await supabase
            .from('user_trade_allocations')
            .insert({
              user_id: user.id,
              account_id: accountId,
              signal_id: null,
              symbol: trade.symbol,
              direction: trade.type.toLowerCase().includes('buy') ? 'long' : 'short',
              entry_price: trade.openPrice,
              exit_price: trade.closePrice,
              lot_size: trade.volume,
              risk_amount: riskAmount,
              realized_pnl: trade.profit,
              r_multiple: trade.profit / riskAmount,
              status: 'closed',
              closed_at: trade.closeTime,
              broker_trade_id: trade.id,
              imported_from_broker: true
            });

          importedCount++;
        }

        return new Response(JSON.stringify({ 
          success: true,
          importedTrades: importedCount,
          totalTrades: trades.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'disconnect': {
        // Remove MetaAPI connection
        const { error: updateError } = await supabase
          .from('user_prop_accounts')
          .update({
            metaapi_account_id: null,
            broker_connection_status: 'disconnected',
            broker_last_sync: null
          })
          .eq('id', accountId)
          .eq('user_id', user.id);

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('MetaAPI sync error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
