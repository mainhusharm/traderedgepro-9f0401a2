import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignalData {
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  confidence_score?: number | null;
  analysis?: string | null;
  is_vip?: boolean;
  trade_type?: string;
  reviewed_by?: string[] | null;
  vip_notes?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return new Response(
        JSON.stringify({ error: 'Discord webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signal: SignalData = await req.json();
    console.log('Received signal to broadcast:', signal);

    // Build the Discord embed
    const isBuy = signal.signal_type === 'BUY';
    const color = isBuy ? 0x22c55e : 0xef4444; // green or red
    
    const tradeTypeLabels: Record<string, string> = {
      'scalp': '⚡ Scalp Trade',
      'intraday': '📊 Intraday',
      'swing': '📈 Swing Trade',
      'position': '🎯 Position Trade',
    };

    const embed: any = {
      title: signal.is_vip 
        ? `👑 VIP SIGNAL: ${signal.symbol} ${signal.signal_type}` 
        : `📊 NEW SIGNAL: ${signal.symbol} ${signal.signal_type}`,
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
        text: 'TraderEdge Pro Signals',
      },
    };

    // Add optional fields
    if (signal.stop_loss) {
      embed.fields.push({
        name: '🛑 Stop Loss',
        value: `\`${signal.stop_loss}\``,
        inline: true,
      });
    }

    if (signal.take_profit) {
      embed.fields.push({
        name: '🎯 Take Profit',
        value: `\`${signal.take_profit}\``,
        inline: true,
      });
    }

    if (signal.confidence_score) {
      embed.fields.push({
        name: '💪 Confidence',
        value: `\`${signal.confidence_score}%\``,
        inline: true,
      });
    }

    if (signal.trade_type) {
      embed.fields.push({
        name: '📋 Trade Type',
        value: tradeTypeLabels[signal.trade_type] || signal.trade_type,
        inline: true,
      });
    }

    if (signal.analysis) {
      embed.fields.push({
        name: '📝 Analysis',
        value: signal.analysis.length > 1000 ? signal.analysis.substring(0, 997) + '...' : signal.analysis,
        inline: false,
      });
    }

    if (signal.is_vip && signal.reviewed_by && signal.reviewed_by.length > 0) {
      embed.fields.push({
        name: '👥 Reviewed By',
        value: signal.reviewed_by.join(', '),
        inline: true,
      });
    }

    if (signal.is_vip && signal.vip_notes) {
      embed.fields.push({
        name: '📌 Expert Notes',
        value: signal.vip_notes.length > 500 ? signal.vip_notes.substring(0, 497) + '...' : signal.vip_notes,
        inline: false,
      });
    }

    // Add thumbnail based on signal type
    embed.thumbnail = {
      url: isBuy 
        ? 'https://cdn-icons-png.flaticon.com/512/7621/7621073.png' 
        : 'https://cdn-icons-png.flaticon.com/512/7621/7621110.png',
    };

    // Build the message content
    const content = signal.is_vip 
      ? '🚨 **VIP SIGNAL ALERT** 🚨 @here'
      : '📢 **New Trading Signal**';

    // Send to Discord
    const discordResponse = await fetch(webhookUrl, {
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

    console.log('Signal successfully sent to Discord');
    return new Response(
      JSON.stringify({ success: true, message: 'Signal sent to Discord' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-discord-signal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
