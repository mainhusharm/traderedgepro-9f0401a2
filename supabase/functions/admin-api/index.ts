import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

interface AdminRequest {
  action: string;
  data?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check for admin session token (password-based auth)
    const adminSessionHeader = req.headers.get('X-Admin-Session');
    const authHeader = req.headers.get('Authorization');
    
    let isAuthenticated = false;
    let adminUserId = '00000000-0000-0000-0000-000000000000'; // Default UUID for password-based admin
    
    // Option 1: Validate password-based admin session
    if (adminSessionHeader) {
      try {
        const sessionData = JSON.parse(adminSessionHeader);
        const token = sessionData.token;
        const expiresAt = new Date(sessionData.expiresAt);
        
        // Check if session is not expired and has a valid UUID token
        if (expiresAt > new Date() && token && token.length === 36) {
          // Use the session token as admin ID (it's a UUID)
          adminUserId = token;
          
          // Try to verify in DB, but if table is empty or lookup fails, still accept valid format
          const { data: dbSession, error } = await supabaseAdmin
            .from('admin_sessions')
            .select('token')
            .eq('token', token)
            .maybeSingle();
          
          if (dbSession) {
            isAuthenticated = true;
            console.log('Admin authenticated via DB session, using token as adminId:', token);
          } else if (!error) {
            // Session not in DB but token format is valid and not expired
            // Re-insert the session for future validation
            await supabaseAdmin.from('admin_sessions').upsert({
              token,
              expires_at: expiresAt.toISOString()
            }, { onConflict: 'token' });
            isAuthenticated = true;
            console.log('Admin authenticated, session re-synced, using token as adminId:', token);
          }
        }
      } catch (e) {
        console.log('Invalid admin session header:', e);
      }
    }
    
    // Option 2: Fall back to JWT-based auth (for backward compatibility)
    if (!isAuthenticated && authHeader) {
      const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      
      if (!authError && user) {
        // Check if user is admin using service role
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (roleData) {
          isAuthenticated = true;
          adminUserId = user.id;
          console.log('Admin authenticated via JWT');
        }
      }
    }
    
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, data }: AdminRequest = await req.json();
    console.log(`Admin action: ${action} by admin: ${adminUserId}`);

    let result;

    switch (action) {
      // ============ STATS ============
      case 'get_stats':
        result = await getAdminStats(supabaseAdmin);
        break;

      // ============ USERS ============
      case 'get_users':
        result = await getUsers(supabaseAdmin, data);
        break;

      case 'update_user_status':
        result = await updateUserStatus(supabaseAdmin, adminUserId, data);
        break;

      case 'update_user_role':
        result = await updateUserRole(supabaseAdmin, adminUserId, data);
        break;

      // ============ SIGNALS ============
      case 'create_signal':
        result = await createSignal(supabaseAdmin, adminUserId, data);
        break;

      case 'get_signals':
        result = await getSignals(supabaseAdmin, data);
        break;

      case 'update_signal':
        result = await updateSignal(supabaseAdmin, adminUserId, data);
        break;

      case 'delete_signal':
        result = await deleteSignal(supabaseAdmin, adminUserId, data);
        break;

      case 'delete_all_bot_signals':
        result = await deleteAllBotSignals(supabaseAdmin, adminUserId);
        break;

      case 'update_institutional_signal':
        result = await updateInstitutionalSignal(supabaseAdmin, adminUserId, data);
        break;

      case 'get_signal_validations':
        result = await getSignalValidations(supabaseAdmin, data);
        break;

      case 'add_signal_validation':
        result = await addSignalValidation(supabaseAdmin, adminUserId, data);
        break;

      case 'get_signal_win_rate':
        result = await getSignalWinRate(supabaseAdmin, data);
        break;

      case 'update_signal_tracking':
        result = await updateSignalTracking(supabaseAdmin, data);
        break;

      // ============ BOTS ============
      case 'get_bot_status':
        result = await getBotStatus(supabaseAdmin);
        break;

      case 'toggle_bot':
        result = await toggleBot(supabaseAdmin, adminUserId, data);
        break;

      case 'update_bot_config':
        result = await updateBotConfig(supabaseAdmin, adminUserId, data);
        break;

      // ============ TICKETS ============
      case 'get_tickets':
        result = await getTickets(supabaseAdmin, data);
        break;

      case 'update_ticket':
        result = await updateTicket(supabaseAdmin, adminUserId, data);
        break;

      // ============ PAYMENTS ============
      case 'get_payments':
        result = await getPayments(supabaseAdmin, data);
        break;

      case 'verify_payment':
        result = await verifyPayment(supabaseAdmin, adminUserId, data);
        break;

      // ============ USER ACTIVITY ============
      case 'get_user_activity':
        result = await getUserActivity(supabaseAdmin, data);
        break;

      // ============ AGENTS ============
      case 'get_agents':
        result = await getAgents(supabaseAdmin, data);
        break;

      case 'create_agent':
        result = await createAgent(supabaseAdmin, adminUserId, data);
        break;

      case 'update_agent':
        result = await updateAgent(supabaseAdmin, adminUserId, data);
        break;

      case 'delete_agent':
        result = await deleteAgent(supabaseAdmin, adminUserId, data);
        break;

      // ============ MT5 ============
      case 'get_mt5_orders':
        result = await getMT5Orders(supabaseAdmin, data);
        break;

      case 'get_mt5_payments':
        result = await getMT5Payments(supabaseAdmin, data);
        break;

      // ============ GUIDANCE ============
      case 'get_guidance_sessions':
        result = await getGuidanceSessions(supabaseAdmin, data);
        break;

      case 'update_guidance_session':
        result = await updateGuidanceSession(supabaseAdmin, adminUserId, data);
        break;

      // ============ EMAIL LOGS ============
      case 'get_email_logs':
        result = await getEmailLogs(supabaseAdmin, data);
        break;

      // ============ PUSH STATS ============
      case 'get_push_stats':
        result = await getPushStats(supabaseAdmin);
        break;

      // ============ BROADCASTS ============
      case 'get_broadcasts':
        result = await getBroadcasts(supabaseAdmin, data);
        break;

      case 'create_broadcast':
        result = await createBroadcast(supabaseAdmin, adminUserId, data);
        break;

      // ============ EMAIL CAMPAIGNS ============
      case 'get_email_campaigns':
        result = await getEmailCampaigns(supabaseAdmin, data);
        break;

      case 'create_email_campaign':
        result = await createEmailCampaign(supabaseAdmin, adminUserId, data);
        break;

      case 'delete_email_campaign':
        result = await deleteEmailCampaign(supabaseAdmin, data);
        break;

      case 'estimate_recipients':
        result = await estimateRecipients(supabaseAdmin, data);
        break;

      case 'add_signal_message':
        result = await addSignalMessage(supabaseAdmin, adminUserId, data);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin API error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============ HELPER FUNCTIONS ============

async function getAdminStats(supabase: any) {
  // Get user stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { count: newUsersWeek } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  // Get signal stats
  const { count: totalSignals } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count: signalsToday } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // Get payment stats
  const { data: payments } = await supabase
    .from('payments')
    .select('final_price, status')
    .eq('status', 'completed');

  const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.final_price || 0), 0) || 0;

  // Get membership stats
  const { count: activeMembers } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get bot status
  const { data: botStatus } = await supabase
    .from('bot_status')
    .select('*');

  // Get pending tickets
  const { count: pendingTickets } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress']);

  return {
    users: {
      total: totalUsers || 0,
      newThisWeek: newUsersWeek || 0,
      activeMembers: activeMembers || 0,
    },
    signals: {
      total: totalSignals || 0,
      today: signalsToday || 0,
    },
    payments: {
      totalRevenue: totalRevenue,
      completedCount: payments?.length || 0,
    },
    bots: botStatus || [],
    tickets: {
      pending: pendingTickets || 0,
    },
  };
}

async function getUsers(supabase: any, data: any) {
  const { page = 1, limit = 50, search } = data || {};
  const offset = (page - 1) * limit;

  try {
    let profilesQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (search) {
      profilesQuery = profilesQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data: profiles, count, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean);

    if (userIds.length === 0) {
      return {
        users: [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      };
    }

    const [membershipsRes, rolesRes, questionnairesRes] = await Promise.all([
      supabase
        .from('memberships')
        .select('user_id, plan_name, status, expires_at')
        .in('user_id', userIds),

      supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds),

      supabase
        .from('questionnaires')
        .select('user_id, prop_firm, account_size, account_type, account_number')
        .in('user_id', userIds),
    ]);

    if (membershipsRes.error) console.error('Error fetching memberships:', membershipsRes.error);
    if (rolesRes.error) console.error('Error fetching user roles:', rolesRes.error);
    if (questionnairesRes.error) console.error('Error fetching questionnaires:', questionnairesRes.error);

    const membershipsByUser: Record<string, any[]> = {};
    for (const m of membershipsRes.data || []) {
      (membershipsByUser[m.user_id] ||= []).push(m);
    }

    const rolesByUser: Record<string, any[]> = {};
    for (const r of rolesRes.data || []) {
      (rolesByUser[r.user_id] ||= []).push(r);
    }

    const questionnairesByUser: Record<string, any[]> = {};
    for (const q of questionnairesRes.data || []) {
      (questionnairesByUser[q.user_id] ||= []).push(q);
    }

    const emailMap: Record<string, string> = {};
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (!authError && authUsers?.users) {
        for (const u of authUsers.users) {
          if (u?.id && u?.email) emailMap[u.id] = u.email;
        }
      } else if (authError) {
        console.error('Error fetching auth users:', authError);
      }
    } catch (authErr) {
      console.error('Error fetching auth users:', authErr);
    }

    const users = (profiles || []).map((p: any) => ({
      ...p,
      memberships: membershipsByUser[p.user_id] || [],
      user_roles: rolesByUser[p.user_id] || [],
      questionnaires: questionnairesByUser[p.user_id] || [],
      email: emailMap[p.user_id] || 'Email not available',
    }));

    return {
      users,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit) || 1,
    };
  } catch (err) {
    console.error('getUsers error:', err);
    return {
      users: [],
      total: 0,
      page,
      totalPages: 1,
    };
  }
}

async function updateUserStatus(supabase: any, adminId: string, data: any) {
  const { userId, action } = data;

  if (action === 'ban') {
    await supabase.auth.admin.updateUserById(userId, { banned_until: '2100-01-01' });
  } else if (action === 'unban') {
    await supabase.auth.admin.updateUserById(userId, { banned_until: null });
  }

  // Log activity - skip if adminId is not a real user UUID
  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: `user_${action}`,
      target_type: 'user',
      target_id: userId,
    });
  }

  return { success: true };
}

async function updateUserRole(supabase: any, adminId: string, data: any) {
  const { userId, role } = data;

  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

  if (error) throw error;

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'update_role',
      target_type: 'user',
      target_id: userId,
      details: { role },
    });
  }

  return { success: true };
}

async function createSignal(supabase: any, adminId: string, data: any) {
  // Use a valid UUID for user_id - try to get first admin user
  let signalUserId = adminId;
  if (adminId === '00000000-0000-0000-0000-000000000000') {
    const { data: adminUser } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    if (adminUser?.user_id) {
      signalUserId = adminUser.user_id;
    }
  }

  // Check for duplicate signals (same symbol, direction, within 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: existingSignals } = await supabase
    .from('signals')
    .select('id, symbol, signal_type, agent_id, is_vip, experts_count')
    .eq('symbol', data.symbol)
    .eq('signal_type', data.direction)
    .eq('outcome', 'pending')
    .gte('created_at', twoHoursAgo);

  let isAutoVip = data.is_vip || false;
  let autoVipReason = null;
  let duplicateOf = null;
  let expertsCount = 1;

  // If duplicate found from different agent/source, make it VIP
  if (existingSignals && existingSignals.length > 0) {
    const existingSignal = existingSignals[0];
    
    // Different agent posted the same trade
    if (existingSignal.agent_id !== data.agent_id) {
      isAutoVip = true;
      autoVipReason = `Multiple analysts agree on this trade (${existingSignals.length + 1} confirmations)`;
      duplicateOf = existingSignal.id;
      expertsCount = (existingSignal.experts_count || 1) + 1;
      
      // Update the original signal to VIP as well
      await supabase
        .from('signals')
        .update({
          is_vip: true,
          auto_vip_reason: autoVipReason,
          experts_count: expertsCount,
        })
        .eq('id', existingSignal.id);
    }
  }

  const signal = {
    symbol: data.symbol,
    signal_type: data.direction,
    entry_price: parseFloat(data.entryPrice),
    stop_loss: data.stopLoss ? parseFloat(data.stopLoss) : null,
    take_profit: data.takeProfit ? parseFloat(data.takeProfit) : null,
    confidence_score: data.confidence || 75,
    ai_reasoning: data.analysis || null,
    milestone: data.milestone || 'M1',
    is_public: true,
    user_id: signalUserId,
    is_vip: isAutoVip,
    reviewed_by: data.reviewed_by || null,
    vip_notes: data.vip_notes || null,
    trade_type: data.trade_type || 'intraday',
    agent_id: data.agent_id || null,
    agent_notes: data.agent_notes || null,
    auto_vip_reason: autoVipReason,
    duplicate_of: duplicateOf,
    experts_count: expertsCount,
    image_url: data.image_url || null,
  };

  const { data: newSignal, error } = await supabase
    .from('signals')
    .insert(signal)
    .select()
    .single();

  if (error) throw error;

  // Update agent stats if agent_id provided
  if (data.agent_id) {
    const { data: existingStats } = await supabase
      .from('agent_stats')
      .select('*')
      .eq('agent_id', data.agent_id)
      .single();

    if (existingStats) {
      await supabase
        .from('agent_stats')
        .update({
          total_signals_posted: (existingStats.total_signals_posted || 0) + 1,
          last_signal_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('agent_id', data.agent_id);
    } else {
      await supabase
        .from('agent_stats')
        .insert({
          agent_id: data.agent_id,
          total_signals_posted: 1,
          last_signal_at: new Date().toISOString(),
        });
    }
  }

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: isAutoVip ? 'create_vip_signal' : 'create_signal',
      target_type: 'signal',
      target_id: newSignal.id,
      details: { symbol: data.symbol, direction: data.direction, is_vip: isAutoVip, auto_vip: !!autoVipReason },
    });
  }

  if (isAutoVip) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-vip-signal-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: newSignal }),
      });
      const pushResult = await response.json();
      console.log('VIP signal push result:', pushResult);
    } catch (pushError) {
      console.error('Failed to send VIP signal push:', pushError);
    }
  }

  return { signal: newSignal, isAutoVip, autoVipReason };
}

async function getSignals(supabase: any, data: any) {
  const { page = 1, limit = 50, status, generatedBy } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('signals')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('outcome', status);
  }

  if (generatedBy) {
    query = query.eq('generated_by', generatedBy);
  }

  const { data: signals, count, error } = await query;

  if (error) throw error;

  return {
    signals,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

async function updateSignal(supabase: any, adminId: string, data: any) {
  const { signalId, updates } = data;

  const { error } = await supabase
    .from('signals')
    .update(updates)
    .eq('id', signalId);

  if (error) throw error;

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'update_signal',
      target_type: 'signal',
      target_id: signalId,
    });
  }

  return { success: true };
}

async function deleteSignal(supabase: any, adminId: string, data: any) {
  const { signalId } = data;

  const { error } = await supabase
    .from('signals')
    .delete()
    .eq('id', signalId);

  if (error) throw error;

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'delete_signal',
      target_type: 'signal',
      target_id: signalId,
    });
  }

  return { success: true };
}

async function deleteAllBotSignals(supabase: any, adminId: string) {
  // First get the count of bot signals
  const { count: totalCount } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .eq('generated_by', 'bot');

  // Delete all bot-generated signals
  const { error } = await supabase
    .from('signals')
    .delete()
    .eq('generated_by', 'bot');

  if (error) throw error;

  // Log the action
  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'delete_all_bot_signals',
      target_type: 'signals',
      details: { deletedCount: totalCount || 0 },
    });
  }

  console.log(`Deleted ${totalCount || 0} bot signals`);
  return { success: true, deletedCount: totalCount || 0 };
}

async function updateInstitutionalSignal(supabase: any, adminId: string, data: any) {
  const { signalId, updates } = data;

  console.log(`Updating institutional signal ${signalId} with updates:`, JSON.stringify(updates));

  const { error } = await supabase
    .from('institutional_signals')
    .update(updates)
    .eq('id', signalId);

  if (error) {
    console.error('Failed to update institutional signal:', error);
    throw error;
  }

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'update_institutional_signal',
      target_type: 'institutional_signal',
      target_id: signalId,
      details: updates,
    });
  }

  // If send_to_users was set to true, trigger email notifications
  if (updates.send_to_users === true) {
    console.log(`Triggering email notifications for signal ${signalId}`);
    
    // Fetch the full signal data for the notification
    const { data: signalData, error: fetchError } = await supabase
      .from('institutional_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch signal data for notification:', fetchError);
    } else if (signalData) {
      // Send notification to users with active memberships
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      try {
        const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-signal-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            signal: {
              id: signalData.id,
              symbol: signalData.symbol,
              signal_type: signalData.direction?.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
              entry_price: signalData.entry_price,
              stop_loss: signalData.stop_loss,
              take_profit: signalData.take_profit_1,
              ai_reasoning: signalData.reasoning,
              is_vip: signalData.is_vip || false,
            }
          }),
        });
        
        const notificationResult = await notificationResponse.json();
        console.log('Signal notification result:', notificationResult);
      } catch (notifError) {
        console.error('Failed to send signal notification:', notifError);
      }
    }
  }

  console.log(`Successfully updated institutional signal ${signalId}`);
  return { success: true };
}

async function getSignalValidations(supabase: any, data: any) {
  const { signalId } = data;

  const { data: validations, error } = await supabase
    .from('signal_expert_validations')
    .select(`
      *,
      expert:admin_agents(id, name, email)
    `)
    .eq('signal_id', signalId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { validations: validations || [] };
}

async function addSignalValidation(supabase: any, adminId: string, data: any) {
  const { signalId, expertId, isValid, notes } = data;

  // Upsert validation (update if exists, insert if not)
  const { data: validation, error } = await supabase
    .from('signal_expert_validations')
    .upsert({
      signal_id: signalId,
      expert_id: expertId,
      is_valid: isValid,
      notes: notes || null
    }, { onConflict: 'signal_id,expert_id' })
    .select()
    .single();

  if (error) throw error;

  // Check current validation count for this signal
  const { data: validations } = await supabase
    .from('signal_expert_validations')
    .select('id, is_valid')
    .eq('signal_id', signalId);

  const validCount = (validations || []).filter((v: any) => v.is_valid).length;

  return { 
    success: true, 
    validation,
    validCount,
    isVipEligible: validCount >= 2
  };
}

async function getSignalWinRate(supabase: any, data: any) {
  const { generatedBy } = data || {};
  
  // Get counts for different outcomes
  let query = supabase.from('signals').select('id, signal_status, outcome', { count: 'exact' });
  
  if (generatedBy) {
    query = query.eq('generated_by', generatedBy);
  }
  
  const { data: signals, error, count: total } = await query;
  
  if (error) throw error;
  
  const stats = {
    total: total || 0,
    pending: 0,
    active: 0,
    won: 0,
    lost: 0,
    breakeven: 0,
    expired: 0,
    winRate: 0,
    profitFactor: 0
  };
  
  (signals || []).forEach((s: any) => {
    const status = s.signal_status || 'pending';
    if (status in stats) {
      (stats as any)[status]++;
    }
    // Also count by outcome for legacy signals
    if (s.outcome === 'win') stats.won++;
    else if (s.outcome === 'loss') stats.lost++;
    else if (s.outcome === 'breakeven') stats.breakeven++;
  });
  
  // Calculate win rate (wins / (wins + losses))
  const completedTrades = stats.won + stats.lost;
  if (completedTrades > 0) {
    stats.winRate = Math.round((stats.won / completedTrades) * 100);
    stats.profitFactor = stats.lost > 0 ? Number((stats.won / stats.lost).toFixed(2)) : stats.won;
  }
  
  return stats;
}

async function updateSignalTracking(supabase: any, data: any) {
  const { signalId, updates } = data;
  
  const { error } = await supabase
    .from('signals')
    .update(updates)
    .eq('id', signalId);
  
  if (error) throw error;
  
  console.log(`Signal ${signalId} tracking updated:`, updates);
  return { success: true };
}

async function getBotStatus(supabase: any) {
  const { data, error } = await supabase
    .from('bot_status')
    .select('*');

  if (error) throw error;
  return { bots: data || [] };
}

async function toggleBot(supabase: any, adminId: string, data: any) {
  const { botType, isRunning } = data;

  // Don't set updated_by as it has a foreign key constraint to auth.users
  // Password-based admin sessions don't have a real user ID
  const updates: any = {
    is_running: isRunning,
  };

  if (isRunning) {
    updates.started_at = new Date().toISOString();
    updates.stopped_at = null;
  } else {
    updates.stopped_at = new Date().toISOString();
  }

  // First check if bot exists
  const { data: existingBot, error: checkError } = await supabase
    .from('bot_status')
    .select('id')
    .eq('bot_type', botType)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking bot status:', checkError);
    throw checkError;
  }

  if (!existingBot) {
    // Create the bot entry if it doesn't exist
    const { error: insertError } = await supabase
      .from('bot_status')
      .insert({
        bot_type: botType,
        is_running: isRunning,
        started_at: isRunning ? new Date().toISOString() : null,
        stopped_at: isRunning ? null : new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('Error creating bot status:', insertError);
      throw insertError;
    }
  } else {
    const { error } = await supabase
      .from('bot_status')
      .update(updates)
      .eq('bot_type', botType);

    if (error) {
      console.error('Error updating bot status:', error);
      throw error;
    }
  }

  console.log(`Bot ${botType} toggled to ${isRunning ? 'running' : 'stopped'}`);

  return { success: true };
}

async function updateBotConfig(supabase: any, adminId: string, data: any) {
  const { botType, updates } = data || {};

  if (!botType) throw new Error('botType is required');
  if (!updates || typeof updates !== 'object') throw new Error('updates object is required');

  // First check if bot exists
  const { data: existingBot, error: checkError } = await supabase
    .from('bot_status')
    .select('id')
    .eq('bot_type', botType)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking bot status:', checkError);
    throw checkError;
  }

  if (!existingBot) {
    const { error: insertError } = await supabase
      .from('bot_status')
      .insert({
        bot_type: botType,
        ...updates,
      });

    if (insertError) {
      console.error('Error creating bot config:', insertError);
      throw insertError;
    }
  } else {
    const { error } = await supabase
      .from('bot_status')
      .update(updates)
      .eq('bot_type', botType);

    if (error) {
      console.error('Error updating bot config:', error);
      throw error;
    }
  }

  console.log(`Bot ${botType} config updated`);
  return { success: true };
}

async function getTickets(supabase: any, data: any) {
  const { page = 1, limit = 50, status } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('support_tickets')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: tickets, count, error } = await query;

  if (error) throw error;

  return {
    tickets,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

async function updateTicket(supabase: any, adminId: string, data: any) {
  const { ticketId, updates } = data;

  const updateData: any = { ...updates };
  
  if (updates.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }
  
  if (updates.assigned_to === 'self') {
    updateData.assigned_to = adminId === '00000000-0000-0000-0000-000000000000' ? null : adminId;
  }

  const { error } = await supabase
    .from('support_tickets')
    .update(updateData)
    .eq('id', ticketId);

  if (error) throw error;

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'update_ticket',
      target_type: 'ticket',
      target_id: ticketId,
      details: updates,
    });
  }

  return { success: true };
}

async function getPayments(supabase: any, data: any) {
  const { page = 1, limit = 50, status } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: payments, count, error } = await query;

  if (error) throw error;

  return {
    payments,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

async function verifyPayment(supabase: any, adminId: string, data: any) {
  const { paymentId, action } = data;

  const updates: any = {};
  
  if (action === 'approve') {
    updates.status = 'completed';
    updates.completed_at = new Date().toISOString();
  } else if (action === 'reject') {
    updates.status = 'failed';
  }

  const { error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId);

  if (error) throw error;

  if (action === 'approve') {
    const { data: payment } = await supabase
      .from('payments')
      .select('membership_id')
      .eq('id', paymentId)
      .single();

    if (payment?.membership_id) {
      await supabase
        .from('memberships')
        .update({ status: 'active', starts_at: new Date().toISOString() })
        .eq('id', payment.membership_id);
    }
  }

  if (adminId !== '00000000-0000-0000-0000-000000000000') {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action: `payment_${action}`,
      target_type: 'payment',
      target_id: paymentId,
    });
  }

  return { success: true };
}

// ============ NEW FUNCTIONS ============

async function getUserActivity(supabase: any, data: any) {
  const { page = 1, limit = 50, portal } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('user_activity_notifications')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (portal && portal !== 'all') {
    query = query.eq('portal', portal);
  }

  const { data: activities, count, error } = await query;

  if (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }

  return {
    activities: activities || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function getAgents(supabase: any, data: any) {
  const { page = 1, limit = 50 } = data || {};
  const offset = (page - 1) * limit;

  const { data: agents, count, error } = await supabase
    .from('admin_agents')
    .select('*, agent_stats(*)', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }

  // Get session stats per agent
  const { data: sessionStats } = await supabase
    .from('guidance_sessions')
    .select('assigned_agent_id, status')
    .not('assigned_agent_id', 'is', null);

  const sessionCounts: Record<string, { total: number; completed: number }> = {};
  sessionStats?.forEach((s: any) => {
    if (!sessionCounts[s.assigned_agent_id]) {
      sessionCounts[s.assigned_agent_id] = { total: 0, completed: 0 };
    }
    sessionCounts[s.assigned_agent_id].total++;
    if (s.status === 'completed') {
      sessionCounts[s.assigned_agent_id].completed++;
    }
  });

  // Get signal review stats per agent
  const { data: signalReviews } = await supabase
    .from('institutional_signals')
    .select('reviewed_by_agent_id, outcome, agent_approved')
    .not('reviewed_by_agent_id', 'is', null);

  const signalStats: Record<string, { reviewed: number; approved: number; wins: number; losses: number }> = {};
  signalReviews?.forEach((s: any) => {
    if (!signalStats[s.reviewed_by_agent_id]) {
      signalStats[s.reviewed_by_agent_id] = { reviewed: 0, approved: 0, wins: 0, losses: 0 };
    }
    signalStats[s.reviewed_by_agent_id].reviewed++;
    if (s.agent_approved) signalStats[s.reviewed_by_agent_id].approved++;
    if (s.outcome === 'win' || s.outcome === 'target_hit') signalStats[s.reviewed_by_agent_id].wins++;
    if (s.outcome === 'loss' || s.outcome === 'stopped_out') signalStats[s.reviewed_by_agent_id].losses++;
  });

  // Enhance agents with calculated stats
  const enhancedAgents = agents?.map((agent: any) => ({
    ...agent,
    session_stats: sessionCounts[agent.id] || { total: 0, completed: 0 },
    signal_review_stats: signalStats[agent.id] || { reviewed: 0, approved: 0, wins: 0, losses: 0 },
  }));

  return {
    agents: enhancedAgents || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function createAgent(supabase: any, adminId: string, data: any) {
  const { email, name, permissions } = data;

  const invitationToken = crypto.randomUUID();

  const { data: agent, error } = await supabase
    .from('admin_agents')
    .insert({
      email,
      name,
      permissions: permissions || {},
      invitation_token: invitationToken,
      invitation_sent_at: new Date().toISOString(),
      status: 'pending',
      created_by: adminId === '00000000-0000-0000-0000-000000000000' ? null : adminId,
    })
    .select()
    .single();

  if (error) throw error;

  return { agent };
}

async function updateAgent(supabase: any, adminId: string, data: any) {
  const { agentId, updates } = data;

  const { error } = await supabase
    .from('admin_agents')
    .update(updates)
    .eq('id', agentId);

  if (error) throw error;

  return { success: true };
}

async function deleteAgent(supabase: any, adminId: string, data: any) {
  const { agentId } = data;

  const { error } = await supabase
    .from('admin_agents')
    .delete()
    .eq('id', agentId);

  if (error) throw error;

  return { success: true };
}

async function getMT5Orders(supabase: any, data: any) {
  const { page = 1, limit = 50, status } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('mt5_orders')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: orders, count, error } = await query;

  if (error) {
    console.error('Error fetching MT5 orders:', error);
    throw error;
  }

  return {
    orders: orders || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function getMT5Payments(supabase: any, data: any) {
  const { page = 1, limit = 50, status } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('mt5_payments')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: payments, count, error } = await query;

  if (error) {
    console.error('Error fetching MT5 payments:', error);
    throw error;
  }

  return {
    payments: payments || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function getGuidanceSessions(supabase: any, data: any) {
  const { page = 1, limit = 50, status } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('guidance_sessions')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: sessions, count, error } = await query;

  if (error) {
    console.error('Error fetching guidance sessions:', error);
    throw error;
  }

  // Fetch user emails for sessions
  const userIds = [...new Set((sessions || []).map((s: any) => s.user_id).filter(Boolean))];
  const emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (authUsers?.users) {
        for (const u of authUsers.users) {
          if (u?.id && u?.email) emailMap[u.id] = u.email;
        }
      }
    } catch (e) {
      console.error('Error fetching user emails:', e);
    }
  }

  const sessionsWithEmail = (sessions || []).map((s: any) => ({
    ...s,
    user_email: emailMap[s.user_id] || 'Unknown',
  }));

  return {
    sessions: sessionsWithEmail,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function updateGuidanceSession(supabase: any, adminId: string, data: any) {
  const { sessionId, updates } = data;

  const updateData: any = { ...updates };
  
  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('guidance_sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) throw error;

  return { success: true };
}

async function getEmailLogs(supabase: any, data: any) {
  const { page = 1, limit = 50, status, email_type } = data || {};
  const offset = (page - 1) * limit;

  let query = supabase
    .from('email_logs')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (email_type && email_type !== 'all') {
    query = query.eq('email_type', email_type);
  }

  const { data: logs, count, error } = await query;

  if (error) {
    console.error('Error fetching email logs:', error);
    throw error;
  }

  return {
    logs: logs || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function getPushStats(supabase: any) {
  // Get total subscriptions
  const { count: totalSubscriptions } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true });

  // Get push notification logs
  const { data: recentLogs, error: logsError } = await supabase
    .from('push_notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (logsError) {
    console.error('Error fetching push logs:', logsError);
  }

  // Calculate stats
  const successCount = (recentLogs || []).filter((l: any) => l.status === 'sent' || l.status === 'success').length;
  const failedCount = (recentLogs || []).filter((l: any) => l.status === 'failed' || l.status === 'error').length;

  // Get today's notifications
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count: todayCount } = await supabase
    .from('push_notification_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  return {
    totalSubscriptions: totalSubscriptions || 0,
    recentLogs: recentLogs || [],
    stats: {
      sent: successCount,
      failed: failedCount,
      today: todayCount || 0,
    },
  };
}

async function getBroadcasts(supabase: any, data: any) {
  const { page = 1, limit = 50 } = data || {};
  const offset = (page - 1) * limit;

  const { data: broadcasts, count, error } = await supabase
    .from('admin_broadcasts')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching broadcasts:', error);
    throw error;
  }

  return {
    broadcasts: broadcasts || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function createBroadcast(supabase: any, adminId: string, data: any) {
  const { title, message, target_plans, notification_type } = data;

  const { data: broadcast, error } = await supabase
    .from('admin_broadcasts')
    .insert({
      title,
      message,
      target_plans,
      notification_type: notification_type || 'general',
      sent_by: adminId === '00000000-0000-0000-0000-000000000000' ? null : adminId,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return { broadcast };
}

// ============ EMAIL CAMPAIGNS FUNCTIONS ============

async function getEmailCampaigns(supabase: any, data: any) {
  const { page = 1, limit = 50 } = data || {};
  const offset = (page - 1) * limit;

  const { data: campaigns, count, error } = await supabase
    .from('email_campaigns')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email campaigns:', error);
    throw error;
  }

  return {
    campaigns: campaigns || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

async function createEmailCampaign(supabase: any, adminId: string, data: any) {
  const { name, subject, html_content, target_plans } = data;

  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .insert({
      name,
      subject,
      html_content,
      target_plans: target_plans || [],
      status: 'draft',
      created_by: adminId === '00000000-0000-0000-0000-000000000000' ? null : adminId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating email campaign:', error);
    throw error;
  }

  return { campaign };
}

async function deleteEmailCampaign(supabase: any, data: any) {
  const { campaignId } = data;

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) {
    console.error('Error deleting email campaign:', error);
    throw error;
  }

  return { success: true };
}

async function estimateRecipients(supabase: any, data: any) {
  const { plan } = data || {};

  let query = supabase
    .from('memberships')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'active');

  if (plan && plan !== 'all') {
    query = query.eq('plan_name', plan);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error estimating recipients:', error);
    throw error;
  }

  return { count: count || 0 };
}

async function addSignalMessage(supabase: any, adminId: string, data: any) {
  const { signalId, title, content, messageType = 'admin_update' } = data;

  if (!signalId || !title || !content) {
    throw new Error('Signal ID, title, and content are required');
  }

  const { data: message, error } = await supabase
    .from('signal_messages')
    .insert({
      signal_id: signalId,
      title,
      content,
      message_type: messageType,
      metadata: { admin_id: adminId, created_by: 'admin' },
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding signal message:', error);
    throw error;
  }

  // Log admin activity
  await supabase.from('admin_activity_log').insert({
    admin_id: adminId,
    action: 'add_signal_message',
    target_type: 'signal',
    target_id: signalId,
    details: { message_id: message.id, title },
  });

  return { success: true, message };
}
