import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate fallback events when API is unavailable
  const generateFallbackEvents = () => {
    const now = new Date();
    return {
      events: [
        {
          name: 'Federal Reserve Interest Rate Decision',
          country: 'US',
          currency: 'USD',
          impact: 'high',
          date: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          forecast: '5.50%',
          previous: '5.25%',
        },
        {
          name: 'Non-Farm Payrolls',
          country: 'US',
          currency: 'USD',
          impact: 'high',
          date: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          forecast: '180K',
          previous: '175K',
        },
        {
          name: 'ECB President Lagarde Speech',
          country: 'EU',
          currency: 'EUR',
          impact: 'medium',
          date: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'UK CPI (YoY)',
          country: 'UK',
          currency: 'GBP',
          impact: 'high',
          date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          forecast: '4.2%',
          previous: '4.0%',
        },
        {
          name: 'Japan GDP (QoQ)',
          country: 'JP',
          currency: 'JPY',
          impact: 'medium',
          date: new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString(),
          forecast: '0.5%',
          previous: '0.4%',
        },
      ],
      source: 'fallback'
    };
  };

  try {
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!finnhubApiKey) {
      console.log('FINNHUB_API_KEY not configured, using fallback data');
      return new Response(
        JSON.stringify(generateFallbackEvents()),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching economic calendar from Finnhub API...');

    // Get date range for economic calendar (today + 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fromDate = today.toISOString().split('T')[0];
    const toDate = nextWeek.toISOString().split('T')[0];

    const response = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${finnhubApiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log('Finnhub API error, using fallback data:', response.status);
      return new Response(
        JSON.stringify(generateFallbackEvents()),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched economic calendar from Finnhub');

    // Map Finnhub response to our format
    const events = (data.economicCalendar || []).map((event: any, index: number) => ({
      name: event.event || 'Economic Event',
      country: event.country || 'US',
      currency: getCurrencyFromCountry(event.country),
      impact: mapFinnhubImpact(event.impact),
      date: event.time ? new Date(event.time * 1000).toISOString() : new Date().toISOString(),
      actual: event.actual?.toString(),
      forecast: event.estimate?.toString(),
      previous: event.prev?.toString(),
      unit: event.unit,
    }));

    return new Response(
      JSON.stringify({ events, source: 'finnhub' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.log('Error fetching data, using fallback:', error);
    return new Response(
      JSON.stringify(generateFallbackEvents()),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getCurrencyFromCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'EU': 'EUR',
    'GB': 'GBP',
    'UK': 'GBP',
    'JP': 'JPY',
    'AU': 'AUD',
    'CA': 'CAD',
    'NZ': 'NZD',
    'CH': 'CHF',
    'CN': 'CNY',
  };
  return currencyMap[country] || 'USD';
}

function mapFinnhubImpact(impact: number | string): 'high' | 'medium' | 'low' {
  if (typeof impact === 'number') {
    if (impact >= 3) return 'high';
    if (impact >= 2) return 'medium';
    return 'low';
  }
  const impactStr = String(impact).toLowerCase();
  if (impactStr.includes('high') || impactStr === '3') return 'high';
  if (impactStr.includes('medium') || impactStr === '2') return 'medium';
  return 'low';
}
