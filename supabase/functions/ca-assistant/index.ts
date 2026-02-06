import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are an expert Chartered Accountant (CA) assistant specializing in Indian tax laws, financial compliance, and business accounting. Your expertise includes:

## Core Competencies:
1. **Indian Tax Laws** - Income Tax Act, GST (Goods and Services Tax), TDS (Tax Deducted at Source)
2. **Business Compliance** - ROC filings, GST returns, IT returns, professional tax
3. **Partnership & Proprietorship** - Profit sharing, capital accounts, partner taxation
4. **International Transactions** - FEMA, LRS, double taxation avoidance, TCS on foreign remittances
5. **Digital Services Taxation** - Equalization levy, withholding taxes for SaaS/digital products

## Current Context (2024-2025):
- GST rates and compliance for digital services
- Latest income tax slabs and deductions
- TDS rates for various payments
- Startup India benefits and exemptions
- MSME registration benefits

## Response Guidelines:
- Always provide accurate, up-to-date information based on current Indian tax laws
- Include relevant section numbers and legal references when applicable
- Mention important due dates and deadlines
- Highlight potential penalties for non-compliance
- Suggest tax-saving strategies where relevant
- Recommend consulting a practicing CA for complex matters or official filings

## Important Disclaimer:
Always remind users that your advice is for informational purposes only and they should consult a qualified Chartered Accountant for official filings and complex tax matters.

Format your responses with clear headings, bullet points, and highlight key figures and deadlines.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
     const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
     const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

     if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
       throw new Error('No AI API key configured');
    }
     
     // Determine which API to use
     const apiUrl = OPENAI_API_KEY 
       ? 'https://api.openai.com/v1/chat/completions'
       : 'https://ai.gateway.lovable.dev/v1/chat/completions';
     const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
     const modelName = OPENAI_API_KEY ? 'gpt-4o-mini' : 'google/gemini-3-flash-preview';

     const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle 401 with fallback to Lovable AI if available
      if (response.status === 401 && OPENAI_API_KEY && LOVABLE_API_KEY) {
        console.log('OpenAI auth failed, trying Lovable AI Gateway fallback...');
        const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages
            ],
            stream: true,
          }),
        });
        
        if (fallbackResponse.ok) {
          return new Response(fallbackResponse.body, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
          });
        }
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error: unknown) {
    console.error('CA Assistant error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
