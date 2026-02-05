import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BotRequirements {
  botName: string;
  tradingStrategy: {
    type: string;
    indicators: string[];
    timeframe: string;
    pairs: string[];
    entryConditions: string;
    exitConditions: string;
  };
  riskManagement: {
    maxRiskPerTrade: number;
    stopLossType: string;
    takeProfitType: string;
    trailingStop: boolean;
    maxDailyDrawdown: number;
    maxOpenTrades: number;
  };
  technicalSpecs: {
    lotSizeType: string;
    fixedLotSize?: number;
    magicNumber: number;
    allowHedging: boolean;
    tradingHours: string;
  };
  additionalRequirements: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, requirements, action } = await req.json();
    
     const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
       throw new Error("No AI API key configured");
    }
     
     // Determine which API to use - prefer OpenAI for code generation (gpt-4o is better for code)
     const apiUrl = OPENAI_API_KEY 
       ? "https://api.openai.com/v1/chat/completions"
       : "https://ai.gateway.lovable.dev/v1/chat/completions";
     const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
     // Use gpt-4o for code gen if available, otherwise use gemini-2.5-pro for best code quality
     const modelName = OPENAI_API_KEY ? "gpt-4o" : "google/gemini-2.5-pro";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = `You are an expert MQL5 developer specializing in creating MetaTrader 5 Expert Advisors (EAs). 
You write clean, efficient, and well-documented MQL5 code following best practices.
Your code should:
- Be fully functional and ready to compile
- Include proper error handling
- Have clear comments explaining the logic
- Follow MQL5 naming conventions
- Include input parameters for customization
- Handle edge cases properly`;

    let userPrompt = "";

    if (action === "generate") {
      const req = requirements as BotRequirements;
      
      // Safely handle potentially undefined arrays
      const indicators = req.tradingStrategy?.indicators?.join(", ") || "Not specified";
      const pairs = req.tradingStrategy?.pairs?.join(", ") || "Not specified";
      
      userPrompt = `Create a complete MQL5 Expert Advisor with the following specifications:

**Bot Name:** ${req.botName || "CustomBot"}

**Trading Strategy:**
- Strategy Type: ${req.tradingStrategy?.type || "Custom"}
- Indicators: ${indicators}
- Timeframe: ${req.tradingStrategy?.timeframe || "H1"}
- Trading Pairs: ${pairs}
- Entry Conditions: ${req.tradingStrategy?.entryConditions || "Not specified"}
- Exit Conditions: ${req.tradingStrategy?.exitConditions || "Not specified"}

**Risk Management:**
- Max Risk Per Trade: ${req.riskManagement?.maxRiskPerTrade || 1}%
- Stop Loss Type: ${req.riskManagement?.stopLossType || "Fixed pips"}
- Take Profit Type: ${req.riskManagement?.takeProfitType || "Fixed pips"}
- Trailing Stop: ${req.riskManagement?.trailingStop ? "Yes" : "No"}
- Max Daily Drawdown: ${req.riskManagement?.maxDailyDrawdown || 5}%
- Max Open Trades: ${req.riskManagement?.maxOpenTrades || 3}

**Technical Specifications:**
- Lot Size Type: ${req.technicalSpecs?.lotSizeType || "Risk-based"}
${req.technicalSpecs?.fixedLotSize ? `- Fixed Lot Size: ${req.technicalSpecs.fixedLotSize}` : ""}
- Magic Number: ${req.technicalSpecs?.magicNumber || 12345}
- Allow Hedging: ${req.technicalSpecs?.allowHedging ? "Yes" : "No"}
- Trading Hours: ${req.technicalSpecs?.tradingHours || "24/5"}

**Additional Requirements:**
${req.additionalRequirements || "None specified"}

Please provide the complete .mq5 source code with:
1. All necessary includes and imports
2. Input parameters section
3. Global variables
4. OnInit, OnDeinit, OnTick functions
5. Helper functions for entries, exits, and risk management
6. Proper lot size calculation based on risk percentage
7. Comments explaining each section`;

    } else if (action === "revise") {
      const { currentCode, revisionRequest } = requirements;
      userPrompt = `Here is the current MQL5 Expert Advisor code:

\`\`\`mql5
${currentCode}
\`\`\`

Please make the following modifications:
${revisionRequest}

Provide the complete updated code with the changes applied.`;
    }

     console.log("Calling AI service for MQL5 code generation...");

     const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Handle 401 with fallback to Lovable AI if available
      if (response.status === 401 && OPENAI_API_KEY && LOVABLE_API_KEY) {
        console.log("OpenAI auth failed, trying Lovable AI Gateway fallback...");
        const fallbackResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 8000,
          }),
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const generatedCode = fallbackData.choices?.[0]?.message?.content || "";
          
          if (orderId) {
            await supabase
              .from("mt5_orders")
              .update({
                ai_generated_code: generatedCode,
                status: "ai-generated",
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId);
          }
          
          return new Response(JSON.stringify({ 
            success: true, 
            code: generatedCode,
            message: "MQL5 code generated successfully"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content || "";

    console.log("MQL5 code generated successfully");

    // Update the order with generated code
    if (orderId) {
      const { error: updateError } = await supabase
        .from("mt5_orders")
        .update({
          ai_generated_code: generatedCode,
          status: "ai-generated",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
      } else {
        // Create notification for admin
        console.log("Order updated with AI-generated code");
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      code: generatedCode,
      message: "MQL5 code generated successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-mt5-bot:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
