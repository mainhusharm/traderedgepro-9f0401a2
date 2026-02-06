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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[RESCRAPE-ALL] Starting full rescrape of all prop firm rules...');

    // Get all active prop firms
    const { data: propFirms, error: firmsError } = await supabase
      .from('prop_firms')
      .select('id, slug, name')
      .eq('is_active', true);

    if (firmsError) throw firmsError;

    const totalFirms = propFirms?.length || 0;
    console.log(`[RESCRAPE-ALL] Found ${totalFirms} active prop firms`);

    let successCount = 0;
    let failedCount = 0;
    const results: { firm: string; status: string; rules_count?: number; error?: string }[] = [];

    // Process in batches of 5 to avoid overwhelming the scraper
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < totalFirms; i += BATCH_SIZE) {
      const batch = propFirms!.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (firm) => {
        try {
          console.log(`[RESCRAPE-ALL] Scraping ${firm.name} (${firm.slug})...`);
          
          const { data, error } = await supabase.functions.invoke('scrape-prop-firm', {
            body: { firmSlug: firm.slug },
          });

          if (error) {
            throw new Error(error.message || 'Scrape failed');
          }

          if (data?.success) {
            successCount++;
            results.push({
              firm: firm.name,
              status: 'success',
              rules_count: data.results?.[0]?.rulesCount || 0,
            });
          } else {
            failedCount++;
            results.push({
              firm: firm.name,
              status: 'failed',
              error: data?.error || 'Unknown error',
            });
          }
        } catch (e: any) {
          failedCount++;
          results.push({
            firm: firm.name,
            status: 'failed',
            error: e.message,
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + BATCH_SIZE < totalFirms) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[RESCRAPE-ALL] Complete: ${successCount}/${totalFirms} successful`);

    // After rescraping, check for rule changes and notify users
    try {
      await supabase.functions.invoke('notify-rule-changes', {});
    } catch (e) {
      console.log('[RESCRAPE-ALL] Rule change notification check failed:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_firms: totalFirms,
        successful: successCount,
        failed: failedCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[RESCRAPE-ALL] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
