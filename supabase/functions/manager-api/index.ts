import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sessionToken, data } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from("manager_sessions")
      .select("*, managers(*)")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const managerId = session.manager_id;
    const permissions = session.managers.permissions || {};

    switch (action) {
      case "get_agents": {
        // Mark agents as offline if not seen in last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        await supabase
          .from("admin_agents")
          .update({ is_online: false })
          .eq("is_online", true)
          .lt("last_seen_at", twoMinutesAgo);

        const { data: agents } = await supabase
          .from("admin_agents")
          .select(`
            *,
            agent_stats(*),
            guidance_sessions:guidance_sessions(count),
            signal_comments:agent_signal_comments(count)
          `)
          .order("created_at", { ascending: false });

        // Get detailed session stats per agent
        const { data: sessionStats } = await supabase
          .from("guidance_sessions")
          .select("assigned_agent_id, status")
          .not("assigned_agent_id", "is", null);

        // Count sessions per agent
        const sessionCounts: Record<string, { total: number; completed: number }> = {};
        sessionStats?.forEach((s: any) => {
          if (!sessionCounts[s.assigned_agent_id]) {
            sessionCounts[s.assigned_agent_id] = { total: 0, completed: 0 };
          }
          sessionCounts[s.assigned_agent_id].total++;
          if (s.status === "completed") {
            sessionCounts[s.assigned_agent_id].completed++;
          }
        });

        // Get signal review stats per agent
        const { data: signalReviews } = await supabase
          .from("institutional_signals")
          .select("reviewed_by_agent_id, outcome, agent_approved")
          .not("reviewed_by_agent_id", "is", null);

        const signalStats: Record<string, { reviewed: number; approved: number; wins: number; losses: number }> = {};
        signalReviews?.forEach((s: any) => {
          if (!signalStats[s.reviewed_by_agent_id]) {
            signalStats[s.reviewed_by_agent_id] = { reviewed: 0, approved: 0, wins: 0, losses: 0 };
          }
          signalStats[s.reviewed_by_agent_id].reviewed++;
          if (s.agent_approved) signalStats[s.reviewed_by_agent_id].approved++;
          if (s.outcome === "win" || s.outcome === "target_hit" || s.outcome === "target_1_hit" || s.outcome === "target_2_hit" || s.outcome === "target_3_hit" || s.outcome === "tp1_hit" || s.outcome === "tp2_hit") {
            signalStats[s.reviewed_by_agent_id].wins++;
          }
          if (s.outcome === "loss" || s.outcome === "stopped_out" || s.outcome === "sl_hit" || s.outcome === "stop_loss") {
            signalStats[s.reviewed_by_agent_id].losses++;
          }
        });

        // Enhance agents with calculated stats
        const enhancedAgents = agents?.map((agent: any) => ({
          ...agent,
          session_stats: sessionCounts[agent.id] || { total: 0, completed: 0 },
          signal_review_stats: signalStats[agent.id] || { reviewed: 0, approved: 0, wins: 0, losses: 0 },
        }));

        return new Response(
          JSON.stringify({ success: true, agents: enhancedAgents || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_agent_details": {
        const { agentId } = data;
        
        // Get agent basic info
        const { data: agent } = await supabase
          .from("admin_agents")
          .select("*")
          .eq("id", agentId)
          .single();

        if (!agent) {
          return new Response(
            JSON.stringify({ success: false, error: "Agent not found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }

        // Get signals reviewed by this agent (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: reviewedSignals } = await supabase
          .from("institutional_signals")
          .select("id, symbol, direction, entry_price, stop_loss, take_profit_1, outcome, agent_approved, agent_review_notes, created_at, closed_at, final_pnl")
          .eq("reviewed_by_agent_id", agentId)
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false })
          .limit(50);

        // Get guidance sessions handled by this agent
        const { data: sessions } = await supabase
          .from("guidance_sessions")
          .select("id, topic, status, created_at, completed_at, scheduled_at, user_id")
          .eq("assigned_agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(50);

        // Get signal comments by this agent
        const { data: signalComments } = await supabase
          .from("agent_signal_comments")
          .select("id, comment, comment_type, created_at, signal_id, signals:institutional_signals(symbol, direction)")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(30);

        // Get messages sent by this agent (to manager)
        const { data: messages } = await supabase
          .from("manager_agent_messages")
          .select("id, content, sender_type, created_at")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(20);

        // Calculate stats
        let wins = 0, losses = 0, breakeven = 0, pending = 0;
        reviewedSignals?.forEach((s: any) => {
          if (s.outcome === "win" || s.outcome === "target_hit" || s.outcome === "target_1_hit" || s.outcome === "target_2_hit" || s.outcome === "target_3_hit" || s.outcome === "tp1_hit" || s.outcome === "tp2_hit") {
            wins++;
          } else if (s.outcome === "loss" || s.outcome === "stopped_out" || s.outcome === "sl_hit" || s.outcome === "stop_loss") {
            losses++;
          } else if (s.outcome === "breakeven") {
            breakeven++;
          } else {
            pending++;
          }
        });

        const decidedSignals = wins + losses;
        const winRate = decidedSignals > 0 ? ((wins / decidedSignals) * 100).toFixed(1) : '0';

        const completedSessions = sessions?.filter((s: any) => s.status === "completed").length || 0;

        return new Response(
          JSON.stringify({
            success: true,
            agent,
            stats: {
              totalSignals: reviewedSignals?.length || 0,
              wins,
              losses,
              breakeven,
              pending,
              winRate,
              totalSessions: sessions?.length || 0,
              completedSessions,
              totalComments: signalComments?.length || 0,
            },
            reviewedSignals: reviewedSignals || [],
            sessions: sessions || [],
            signalComments: signalComments || [],
            recentMessages: messages || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_agent": {
        if (!permissions.can_manage_agents) {
          return new Response(
            JSON.stringify({ success: false, error: "Permission denied" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }

        const { agentId, updates } = data;
        // Only allow updating specific fields
        const allowedUpdates: Record<string, any> = {};
        if (updates.permissions) allowedUpdates.permissions = updates.permissions;
        if (updates.name !== undefined) allowedUpdates.name = updates.name;
        if (updates.status) allowedUpdates.status = updates.status;

        await supabase
          .from("admin_agents")
          .update(allowedUpdates)
          .eq("id", agentId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_agent_availability": {
        const { agentId } = data;
        const { data: availability } = await supabase
          .from("agent_availability")
          .select("*")
          .eq("agent_id", agentId);

        return new Response(
          JSON.stringify({ success: true, availability: availability || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_agent_availability": {
        if (!permissions.can_manage_schedules) {
          return new Response(
            JSON.stringify({ success: false, error: "Permission denied" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }

        const { agentId, availability } = data;
        
        // Delete existing and insert new
        await supabase
          .from("agent_availability")
          .delete()
          .eq("agent_id", agentId);

        if (availability.length > 0) {
          await supabase
            .from("agent_availability")
            .insert(availability.map((a: any) => ({
              agent_id: agentId,
              ...a
            })));
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_guidance_sessions": {
        const { data: sessions } = await supabase
          .from("guidance_sessions")
          .select("*, admin_agents(name, email)")
          .order("created_at", { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({ success: true, sessions: sessions || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reassign_session": {
        if (!permissions.can_manage_guidance) {
          return new Response(
            JSON.stringify({ success: false, error: "Permission denied" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }

        const { sessionId, agentId } = data;
        await supabase
          .from("guidance_sessions")
          .update({ assigned_agent_id: agentId })
          .eq("id", sessionId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_pending_signals": {
        const { data: signals } = await supabase
          .from("institutional_signals")
          .select("*")
          .eq("agent_reviewed", false)
          .order("created_at", { ascending: false })
          .limit(50);

        return new Response(
          JSON.stringify({ success: true, signals: signals || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "approve_signal": {
        if (!permissions.can_review_signals) {
          return new Response(
            JSON.stringify({ success: false, error: "Permission denied" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }

        const { signalId, approved, notes } = data;
        await supabase
          .from("institutional_signals")
          .update({
            agent_reviewed: true,
            agent_approved: approved,
            agent_review_notes: notes,
            send_to_users: approved,
          })
          .eq("id", signalId);

        // If approved and notes provided, also create a signal_message for users
        if (approved && notes && notes.trim()) {
          // Get manager name for the message
          const { data: manager } = await supabase
            .from("managers")
            .select("name")
            .eq("id", managerId)
            .single();

          await supabase
            .from("signal_messages")
            .insert({
              signal_id: signalId,
              title: "📋 Analyst Note",
              content: notes.trim(),
              message_type: "agent_note",
              metadata: { manager_id: managerId, manager_name: manager?.name || "Analyst" },
            });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_announcement": {
        if (!permissions.can_send_broadcasts) {
          return new Response(
            JSON.stringify({ success: false, error: "Permission denied" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }

        const { title, message, priority, targetAgents } = data;
        await supabase
          .from("manager_announcements")
          .insert({
            manager_id: managerId,
            title,
            message,
            priority,
            target_agents: targetAgents || [],
          });

        // Create notifications for agents
        const { data: agents } = await supabase
          .from("admin_agents")
          .select("id")
          .eq("status", "active");

        if (agents) {
          const notifications = agents
            .filter(a => !targetAgents || targetAgents.length === 0 || targetAgents.includes(a.id))
            .map(agent => ({
              agent_id: agent.id,
              type: "manager_announcement",
              title,
              message,
            }));

          if (notifications.length > 0) {
            await supabase.from("agent_notifications").insert(notifications);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_messages": {
        const { agentId } = data;
        const { data: messages } = await supabase
          .from("manager_agent_messages")
          .select("*")
          .eq("manager_id", managerId)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: true });

        return new Response(
          JSON.stringify({ success: true, messages: messages || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_message": {
        if (!permissions.can_direct_message) {
          return new Response(
            JSON.stringify({ success: false, error: "Permission denied" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }

        const { agentId, content } = data;
        await supabase
          .from("manager_agent_messages")
          .insert({
            manager_id: managerId,
            agent_id: agentId,
            sender_type: "manager",
            content,
          });

        // Notify agent
        await supabase.from("agent_notifications").insert({
          agent_id: agentId,
          type: "manager_message",
          title: "New message from Manager",
          message: content.substring(0, 100),
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_analytics": {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Get all agents
        const { data: agents } = await supabase
          .from("admin_agents")
          .select("id, name, email, is_online, status")
          .eq("status", "active");

        // Get signal reviews per agent from last 30 days
        const { data: signalReviews } = await supabase
          .from("institutional_signals")
          .select("reviewed_by_agent_id, outcome, agent_approved")
          .not("reviewed_by_agent_id", "is", null)
          .gte("created_at", thirtyDaysAgo);

        // Get session stats per agent from last 30 days
        const { data: sessions } = await supabase
          .from("guidance_sessions")
          .select("assigned_agent_id, status")
          .not("assigned_agent_id", "is", null)
          .gte("created_at", thirtyDaysAgo);

        // Build per-agent stats
        const agentStatsMap: Record<string, any> = {};
        
        agents?.forEach((agent: any) => {
          agentStatsMap[agent.id] = {
            id: agent.id,
            admin_agents: { name: agent.name, email: agent.email, is_online: agent.is_online },
            total_signals_posted: 0,
            winning_signals: 0,
            losing_signals: 0,
            clients_handled: 0,
          };
        });

        signalReviews?.forEach((s: any) => {
          if (agentStatsMap[s.reviewed_by_agent_id]) {
            agentStatsMap[s.reviewed_by_agent_id].total_signals_posted++;
            // Check for winning outcomes
            if (s.outcome === "win" || s.outcome === "target_hit" || s.outcome === "target_1_hit" || s.outcome === "target_2_hit" || s.outcome === "target_3_hit" || s.outcome === "tp1_hit" || s.outcome === "tp2_hit" || s.outcome === "tp3_hit") {
              agentStatsMap[s.reviewed_by_agent_id].winning_signals++;
            }
            // Check for losing outcomes
            if (s.outcome === "loss" || s.outcome === "stopped_out" || s.outcome === "sl_hit" || s.outcome === "stop_loss") {
              agentStatsMap[s.reviewed_by_agent_id].losing_signals++;
            }
          }
        });

        sessions?.forEach((s: any) => {
          if (agentStatsMap[s.assigned_agent_id] && s.status === "completed") {
            agentStatsMap[s.assigned_agent_id].clients_handled++;
          }
        });

        const agentStats = Object.values(agentStatsMap);

        // Get session counts
        const { data: sessionCounts } = await supabase
          .from("guidance_sessions")
          .select("status")
          .gte("created_at", thirtyDaysAgo);

        // Get signal stats
        const { data: signalStats } = await supabase
          .from("institutional_signals")
          .select("outcome, agent_approved")
          .gte("created_at", thirtyDaysAgo);

        return new Response(
          JSON.stringify({
            success: true,
            agentStats: agentStats || [],
            sessionCounts: sessionCounts || [],
            signalStats: signalStats || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_agent_salaries": {
        // Get all agents with their salary info
        const { data: agents } = await supabase
          .from("admin_agents")
          .select("id, name, email, is_online")
          .eq("status", "active");

        // Get or create salary records for each agent
        const salaries = [];
        for (const agent of agents || []) {
          let { data: salary } = await supabase
            .from("agent_salaries")
            .select("*")
            .eq("agent_id", agent.id)
            .single();

          if (!salary) {
            // Create default salary record
            const { data: newSalary } = await supabase
              .from("agent_salaries")
              .insert({ agent_id: agent.id, salary_amount: 0 })
              .select()
              .single();
            salary = newSalary;
          }

          // Get payment methods for this agent
          const { data: paymentMethods } = await supabase
            .from("agent_payment_methods")
            .select("*")
            .eq("agent_id", agent.id);

          salaries.push({
            ...salary,
            agent,
            payment_methods: paymentMethods || [],
          });
        }

        return new Response(
          JSON.stringify({ success: true, salaries }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_agent_salary": {
        const { agentId, salaryAmount } = data;
        
        // Upsert salary record
        const { error } = await supabase
          .from("agent_salaries")
          .upsert({
            agent_id: agentId,
            salary_amount: salaryAmount,
            updated_at: new Date().toISOString(),
          }, { onConflict: "agent_id" });

        if (error) {
          console.error("Error updating salary:", error);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to update salary" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "request_payment_method": {
        const { agentId } = data;
        
        // Update salary record to mark payment method requested
        await supabase
          .from("agent_salaries")
          .upsert({
            agent_id: agentId,
            payment_method_requested: true,
            payment_method_requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "agent_id" });

        // Create notification for agent
        await supabase.from("agent_notifications").insert({
          agent_id: agentId,
          type: "payment_method_request",
          title: "Payment Method Required",
          message: "Your manager has requested you to add a payment method to receive your salary. Please set up your payment details.",
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "process_salary_payment": {
        const { agentId, salaryId, transactionReference, notes } = data;
        
        // Get salary amount
        const { data: salary } = await supabase
          .from("agent_salaries")
          .select("salary_amount")
          .eq("id", salaryId)
          .single();

        if (!salary) {
          return new Response(
            JSON.stringify({ success: false, error: "Salary record not found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }

        // Get primary payment method
        const { data: paymentMethod } = await supabase
          .from("agent_payment_methods")
          .select("id")
          .eq("agent_id", agentId)
          .eq("is_primary", true)
          .single();

        // Create payment record
        const { error } = await supabase
          .from("agent_salary_payments")
          .insert({
            agent_id: agentId,
            salary_id: salaryId,
            amount: salary.salary_amount,
            payment_method_id: paymentMethod?.id || null,
            status: "completed",
            transaction_reference: transactionReference || null,
            notes: notes || null,
            paid_by: managerId,
            paid_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Error processing payment:", error);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to process payment" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }

        // Notify agent
        await supabase.from("agent_notifications").insert({
          agent_id: agentId,
          type: "salary_paid",
          title: "Salary Payment Received",
          message: `Your salary payment of $${salary.salary_amount} has been processed.`,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_payment_history": {
        const { data: payments } = await supabase
          .from("agent_salary_payments")
          .select(`
            *,
            agent:admin_agents(name, email)
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({ success: true, payments: payments || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "logout": {
        await supabase
          .from("manager_sessions")
          .delete()
          .eq("session_token", sessionToken);

        await supabase
          .from("managers")
          .update({ is_online: false })
          .eq("id", managerId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unknown action" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in manager-api:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
