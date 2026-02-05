import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();

    switch (action) {
      case 'get_payments': {
        const { data: payments, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, payments }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_affiliate_data': {
        const { data: affiliates, error: affError } = await supabase
          .from('affiliates')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: referrals, error: refError } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .order('created_at', { ascending: false });

        if (affError) throw affError;
        if (refError) throw refError;

        return new Response(JSON.stringify({ success: true, affiliates, referrals }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_profit_config': {
        const { data: config, error } = await supabase
          .from('profit_sharing_config')
          .select('*')
          .eq('is_active', true)
          .order('share_percentage', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, config }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_expenses': {
        const { data: expenses, error } = await supabase
          .from('business_expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, expenses }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'add_expense': {
        const { description, amount, currency, category, expense_date, notes, created_by } = data;
        const { data: expense, error } = await supabase
          .from('business_expenses')
          .insert({
            description,
            amount,
            currency: currency || 'USD',
            category,
            expense_date: expense_date || new Date().toISOString().split('T')[0],
            notes,
            created_by
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, expense }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete_expense': {
        const { id } = data;
        const { error } = await supabase
          .from('business_expenses')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_profit_config': {
        const { id, share_percentage } = data;
        const { error } = await supabase
          .from('profit_sharing_config')
          .update({ share_percentage, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_user_emails': {
        const { user_ids } = data;
        const { data: users, error } = await supabase.auth.admin.listUsers();
        
        if (error) throw error;
        
        const emailMap: Record<string, string> = {};
        users.users.forEach(user => {
          emailMap[user.id] = user.email || 'Unknown';
        });
        
        return new Response(JSON.stringify({ success: true, emailMap }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Contract Management
      case 'get_contract': {
        const { data: contract, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, contract }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_contract': {
        const { contract_terms } = data;
        const { data: contract, error } = await supabase
          .from('contracts')
          .insert({
            contract_terms,
            effective_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, contract }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sign_contract': {
        const { contract_id, party, signature_data } = data;
        
        const updateData = party === 'owner' 
          ? { owner_signature_data: signature_data, owner_signed_at: new Date().toISOString() }
          : { ceo_signature_data: signature_data, ceo_signed_at: new Date().toISOString() };

        const { error } = await supabase
          .from('contracts')
          .update(updateData)
          .eq('id', contract_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Brand Collaborations
      case 'get_brand_collaborations': {
        const { data: collaborations, error } = await supabase
          .from('brand_collaborations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, collaborations }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'add_brand_collaboration': {
        const { 
          brand_name, brand_logo_url, contact_person, contact_email, contact_phone,
          deal_type, deal_title, deal_description, upfront_amount, currency,
          revenue_share_pct, deliverables, contract_start_date, contract_end_date,
          payment_status, payment_method, invoice_number, status, notes
        } = data;

        const { data: collab, error } = await supabase
          .from('brand_collaborations')
          .insert({
            brand_name, brand_logo_url, contact_person, contact_email, contact_phone,
            deal_type, deal_title, deal_description, upfront_amount, currency,
            revenue_share_pct, deliverables: deliverables || [], 
            contract_start_date: contract_start_date || null, 
            contract_end_date: contract_end_date || null,
            payment_status, payment_method, invoice_number, status, notes
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, collaboration: collab }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_brand_collaboration': {
        const { id, ...updateFields } = data;
        
        const { error } = await supabase
          .from('brand_collaborations')
          .update({
            ...updateFields,
            deliverables: updateFields.deliverables || [],
            contract_start_date: updateFields.contract_start_date || null,
            contract_end_date: updateFields.contract_end_date || null
          })
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete_brand_collaboration': {
        const { id } = data;
        const { error } = await supabase
          .from('brand_collaborations')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: unknown) {
    console.error('Accountant API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
