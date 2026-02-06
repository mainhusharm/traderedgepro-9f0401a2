import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
     const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { uploadId, fileUrl, fileType, userId, accountId } = await req.json();

    console.log('Parsing trading statement:', { uploadId, fileType });

    // Update status to processing
    await supabase
      .from('account_statement_uploads')
      .update({ parsing_status: 'processing' })
      .eq('id', uploadId);

    // Fetch the file content
    let content = '';
    try {
      const response = await fetch(fileUrl);
      if (fileType === 'html' || fileType === 'csv') {
        content = await response.text();
      } else {
        // For screenshots/PDFs, we'll use AI vision (if supported)
        content = `[Binary file: ${fileType}]`;
      }
    } catch (fetchError: unknown) {
      throw new Error(`Failed to fetch file: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    // Use AI to parse the statement
    let parsedData: any = {};
    
     if ((openaiApiKey || lovableApiKey) && content && fileType !== 'screenshot') {
      try {
        const apiUrl = openaiApiKey 
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://ai.gateway.lovable.dev/v1/chat/completions';
        const apiKey = openaiApiKey || lovableApiKey;
        const modelName = openaiApiKey ? 'gpt-4o-mini' : 'google/gemini-3-flash-preview';
        
        const aiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content: `You are a trading statement parser. Extract key metrics from MT4/MT5 statements.
                
Return a JSON object with these fields:
- balance: number (current balance)
- equity: number (current equity)
- floating_pnl: number (unrealized P&L)
- margin: number (used margin)
- free_margin: number
- margin_level: number (percentage)
- trades: array of {symbol, type, lots, open_price, current_price, pnl, open_time}

Only return valid JSON, no markdown or explanation.`
              },
              {
                role: 'user',
                content: `Parse this ${fileType.toUpperCase()} trading statement:\n\n${content.substring(0, 15000)}`
              }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'extract_statement_data',
                  description: 'Extract trading statement metrics',
                  parameters: {
                    type: 'object',
                    properties: {
                      balance: { type: 'number' },
                      equity: { type: 'number' },
                      floating_pnl: { type: 'number' },
                      margin: { type: 'number' },
                      free_margin: { type: 'number' },
                      margin_level: { type: 'number' },
                      trades: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            symbol: { type: 'string' },
                            type: { type: 'string' },
                            lots: { type: 'number' },
                            open_price: { type: 'number' },
                            current_price: { type: 'number' },
                            pnl: { type: 'number' },
                            open_time: { type: 'string' }
                          }
                        }
                      }
                    },
                    required: ['balance', 'equity']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'extract_statement_data' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            parsedData = JSON.parse(toolCall.function.arguments);
          }
        }
      } catch (aiError) {
        console.error('AI parsing error:', aiError);
        // Continue with regex fallback
      }
    }

    // Fallback regex parsing for HTML statements
    if (!parsedData.equity && fileType === 'html') {
      // Common MT4/MT5 statement patterns
      const balanceMatch = content.match(/Balance[:\s]+\$?([\d,]+\.?\d*)/i);
      const equityMatch = content.match(/Equity[:\s]+\$?([\d,]+\.?\d*)/i);
      const floatingMatch = content.match(/Floating P\/L[:\s]+\$?([-\d,]+\.?\d*)/i);
      
      parsedData = {
        balance: balanceMatch ? parseFloat(balanceMatch[1].replace(',', '')) : null,
        equity: equityMatch ? parseFloat(equityMatch[1].replace(',', '')) : null,
        floating_pnl: floatingMatch ? parseFloat(floatingMatch[1].replace(',', '')) : null,
      };
    }

    // Update the upload record with parsed data
    const { error: updateError } = await supabase
      .from('account_statement_uploads')
      .update({
        parsing_status: 'completed',
        parsed_at: new Date().toISOString(),
        parsed_data: parsedData,
        equity_extracted: parsedData.equity,
        balance_extracted: parsedData.balance,
        trades_extracted: parsedData.trades || []
      })
      .eq('id', uploadId);

    if (updateError) throw updateError;

    // If we got equity, update the prop account
    if (parsedData.equity && accountId) {
      await supabase
        .from('user_prop_accounts')
        .update({
          reported_equity: parsedData.equity,
          current_equity: parsedData.equity,
          unrealized_pnl: parsedData.floating_pnl || 0,
          last_equity_update_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString()
        })
        .eq('id', accountId);

      // Also create a daily equity confirmation
      await supabase
        .from('daily_equity_confirmations')
        .upsert({
          user_id: userId,
          account_id: accountId,
          date: new Date().toISOString().split('T')[0],
          reported_equity: parsedData.equity,
          reported_balance: parsedData.balance,
          open_pnl: parsedData.floating_pnl,
          notes: `Parsed from ${fileType} statement`
        }, {
          onConflict: 'user_id,account_id,date'
        });
    }

    console.log('Statement parsed successfully:', parsedData);

    return new Response(JSON.stringify({ 
      success: true, 
      parsedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error parsing statement:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
