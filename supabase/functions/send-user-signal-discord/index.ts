import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// User signals Discord webhook
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1463444841735389261/y4ZYY18MXLGa1Y83yhPJZWs9jwyGJpX4l4xkW3HYtvxVpftWuYa1DfRhQtMWrdrwVE6e";

interface SignalData {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss?: number | null;
  take_profit_1?: number | null;
  take_profit_2?: number | null;
  take_profit_3?: number | null;
  confidence?: number | null;
  reasoning?: string | null;
  timeframe?: string | null;
  kill_zone?: string | null;
  confluence_score?: number | null;
  analysis_mode?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signal: SignalData = await req.json();
    console.log('Sending user signal to Discord:', signal);

    // Build the Discord embed
    const isBuy = signal.direction === 'BUY';
    const color = isBuy ? 0x22c55e : 0xef4444; // green or red
    
    const killZoneLabels: Record<string, string> = {
      'london_open': '🇬🇧 London Open',
      'ny_open': '🇺🇸 New York Open',
      'london_close': '🌆 London Close',
      'asian': '🌏 Asian Session',
    };

    const analysisModeLabels: Record<string, string> = {
      'scalp': '⚡ Scalp',
      'intraday': '📊 Intraday',
      'swing': '📈 Swing',
    };

    const embed: any = {
      title: `📊 ${signal.symbol} ${signal.direction}`,
      color: color,
      fields: [
        {
          name: '📍 Entry Price',
          value: `\`${signal.entry_price}\``,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'TraderEdge Pro • User Signals',
        icon_url: 'https://traderedgepro.lovable.app/favicon.png',
      },
    };

    // Add stop loss
    if (signal.stop_loss) {
      embed.fields.push({
        name: '🛑 Stop Loss',
        value: `\`${signal.stop_loss}\``,
        inline: true,
      });
    }

    // Add take profits
    const takeProfits = [signal.take_profit_1, signal.take_profit_2, signal.take_profit_3].filter(Boolean);
    if (takeProfits.length > 0) {
      embed.fields.push({
        name: '🎯 Take Profit(s)',
        value: takeProfits.map((tp, i) => `TP${i + 1}: \`${tp}\``).join(' | '),
        inline: true,
      });
    }

    // Add confluence score
    if (signal.confluence_score) {
      const scoreEmoji = signal.confluence_score >= 8 ? '🔥' : signal.confluence_score >= 6 ? '✅' : '📊';
      embed.fields.push({
        name: `${scoreEmoji} Confluence`,
        value: `\`${signal.confluence_score}/10\``,
        inline: true,
      });
    }

    // Add timeframe
    if (signal.timeframe) {
      embed.fields.push({
        name: '⏱️ Timeframe',
        value: `\`${signal.timeframe}\``,
        inline: true,
      });
    }

    // Add kill zone
    if (signal.kill_zone) {
      embed.fields.push({
        name: '🕐 Kill Zone',
        value: killZoneLabels[signal.kill_zone] || signal.kill_zone,
        inline: true,
      });
    }

    // Add analysis mode
    if (signal.analysis_mode) {
      embed.fields.push({
        name: '📋 Trade Type',
        value: analysisModeLabels[signal.analysis_mode] || signal.analysis_mode,
        inline: true,
      });
    }

    // Add reasoning if available
    if (signal.reasoning) {
      const truncatedReasoning = signal.reasoning.length > 800 
        ? signal.reasoning.substring(0, 797) + '...' 
        : signal.reasoning;
      embed.fields.push({
        name: '📝 Analysis',
        value: truncatedReasoning,
        inline: false,
      });
    }

    // Add fun signal icon from GitHub
    embed.thumbnail = {
      url: 'https://raw.githubusercontent.com/anchalw11/photos/main/joy.png',
    };

    // Build the message content
    const directionEmoji = isBuy ? '🟢' : '🔴';
    const content = `${directionEmoji} **New Signal Alert** • ${signal.symbol}`;

    // Send to Discord
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send to Discord', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User signal successfully sent to Discord');
    return new Response(
      JSON.stringify({ success: true, message: 'Signal sent to Discord' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-user-signal-discord:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
