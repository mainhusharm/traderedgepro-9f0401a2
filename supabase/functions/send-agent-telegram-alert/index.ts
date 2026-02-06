import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignalData {
  id?: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2?: number;
  take_profit_3?: number;
  confidence?: number;
  confluence_score?: number;
  timeframe?: string;
  kill_zone?: string;
  htf_bias?: string;
  reasoning?: string;
  confluence_factors?: string[];
  risk_reward_ratio?: number;
}

// Escape special Markdown characters for Telegram
const escapeMarkdown = (text: string): string => {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

const formatTelegramMessage = (signal: SignalData): string => {
  const direction = signal.direction.toUpperCase();
  const directionEmoji = direction === 'BUY' || direction === 'LONG' ? '🟢' : '🔴';
  
  let message = `🔔 *NEW SIGNAL FOR REVIEW*\n\n`;
  message += `${directionEmoji} *${signal.symbol}* — *${direction}*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Entry and levels
  message += `📍 *Entry:* \`${signal.entry_price}\`\n`;
  message += `🛑 *Stop Loss:* \`${signal.stop_loss}\`\n`;
  message += `🎯 *TP1:* \`${signal.take_profit_1}\``;
  
  if (signal.take_profit_2) {
    message += ` | *TP2:* \`${signal.take_profit_2}\``;
  }
  if (signal.take_profit_3) {
    message += ` | *TP3:* \`${signal.take_profit_3}\``;
  }
  message += `\n\n`;
  
  // Metrics
  if (signal.confidence) {
    message += `💪 *Confidence:* ${signal.confidence}%\n`;
  }
  if (signal.confluence_score) {
    message += `🎯 *Confluence:* ${signal.confluence_score}/10\n`;
  }
  if (signal.risk_reward_ratio) {
    message += `📊 *Risk/Reward:* 1:${signal.risk_reward_ratio.toFixed(1)}\n`;
  }
  if (signal.timeframe) {
    message += `⏰ *Timeframe:* ${escapeMarkdown(signal.timeframe)}\n`;
  }
  if (signal.kill_zone) {
    message += `🌍 *Kill Zone:* ${escapeMarkdown(signal.kill_zone)}\n`;
  }
  if (signal.htf_bias) {
    message += `📈 *HTF Bias:* ${escapeMarkdown(signal.htf_bias)}\n`;
  }
  
  // Confluence factors
  if (signal.confluence_factors && signal.confluence_factors.length > 0) {
    message += `\n✅ *Confluence Factors:*\n`;
    signal.confluence_factors.slice(0, 5).forEach(factor => {
      message += `  • ${escapeMarkdown(factor)}\n`;
    });
  }
  
  // Analysis/Reasoning - escape underscores that break Markdown
  if (signal.reasoning) {
    message += `\n📝 *Analysis:*\n`;
    const maxLength = 500;
    let reasoning = signal.reasoning.length > maxLength 
      ? signal.reasoning.substring(0, maxLength) + '...' 
      : signal.reasoning;
    // Escape underscores in reasoning text
    reasoning = reasoning.replace(/_/g, '\\_');
    message += `${reasoning}\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━━━━\n`;
  
  // Dashboard link - remove trailing slash from SITE_URL if present
  const siteUrl = (Deno.env.get("SITE_URL") || "https://traderedgepro.lovable.app").replace(/\/+$/, '');
  message += `👉 [Review & Approve on Dashboard](${siteUrl}/agent)\n`;
  
  message += `\n⏱ ${new Date().toUTCString()}`;
  
  return message;
};

const sendTelegramMessage = async (chatId: string, message: string, botToken: string): Promise<boolean> => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return false;
    }
    
    console.log('Telegram message sent successfully:', result.result?.message_id);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_AGENT_CHAT_ID");
    
    console.log("Telegram config - Chat ID:", chatId, "Bot Token exists:", !!botToken);
    
    if (!botToken || !chatId) {
      console.error("Missing Telegram configuration - Bot Token:", !!botToken, "Chat ID:", chatId);
      return new Response(
        JSON.stringify({ error: "Telegram not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { signal, signals } = await req.json();
    
    // Handle single signal or array of signals
    const signalsToSend: SignalData[] = signals || (signal ? [signal] : []);
    
    if (signalsToSend.length === 0) {
      return new Response(
        JSON.stringify({ error: "No signal data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const results: { symbol: string; success: boolean }[] = [];
    
    for (const sig of signalsToSend) {
      const message = formatTelegramMessage(sig);
      const success = await sendTelegramMessage(chatId, message, botToken);
      results.push({ symbol: sig.symbol, success });
      
      // Small delay between messages to avoid rate limiting
      if (signalsToSend.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log(`Sent ${successCount}/${signalsToSend.length} Telegram alerts to agents`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: signalsToSend.length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("Error in send-agent-telegram-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
