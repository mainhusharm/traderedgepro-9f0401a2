import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushHTTPRequest } from "https://cdn.jsdelivr.net/npm/@pushforge/builder@1.1.0/dist/lib/main.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 ? "=".repeat(4 - (padded.length % 4)) : "";
  const raw = atob(padded + pad);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function buildVapidPrivateJwk(params: {
  vapidPublicKey: string;
  vapidPrivateKey: string;
}): JsonWebKey {
  const pub = base64UrlToBytes(params.vapidPublicKey);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error("Invalid VAPID_PUBLIC_KEY");
  }
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const dBytes = base64UrlToBytes(params.vapidPrivateKey);
  if (dBytes.length !== 32) {
    throw new Error("Invalid VAPID_PRIVATE_KEY");
  }
  return {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(x),
    y: bytesToBase64Url(y),
    d: bytesToBase64Url(dBytes),
    ext: true,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session, event } = await req.json();

    if (!session || !session.user_id) {
      return new Response(JSON.stringify({ error: "Missing session data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user's push subscription
    const { data: subscription, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", session.user_id)
      .single();

    if (subError || !subscription) {
      console.log("No push subscription for user:", session.user_id);
      return new Response(JSON.stringify({ success: true, sent: 0, reason: "No subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateJWK = buildVapidPrivateJwk({ vapidPublicKey, vapidPrivateKey });

    // Build notification based on event type
    let title = "📅 Guidance Session Update";
    let body = `Your session "${session.topic}" has been updated.`;

    if (event === "scheduled" || session.status === "scheduled") {
      title = "📅 Session Scheduled";
      const scheduledDate = session.scheduled_at 
        ? new Date(session.scheduled_at).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "soon";
      body = `Your session "${session.topic}" is scheduled for ${scheduledDate}`;
    } else if (event === "completed" || session.status === "completed") {
      title = "✅ Session Completed";
      body = `Your session "${session.topic}" has been completed. Please rate your experience!`;
    } else if (event === "in_progress" || session.status === "in_progress") {
      title = "🔴 Session In Progress";
      body = `Your session "${session.topic}" is now in progress.`;
    } else if (event === "cancelled" || session.status === "cancelled") {
      title = "❌ Session Cancelled";
      body = `Your session "${session.topic}" has been cancelled.`;
    }

    const payload = {
      title,
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `session-${session.id}`,
      data: {
        url: "/dashboard/guidance",
        sessionId: session.id,
        type: "guidance_session",
      },
    };

    const message = {
      payload,
      options: {
        ttl: 24 * 60 * 60,
        urgency: "normal",
        topic: "guidance-session",
      },
      adminContact: "mailto:support@traderedgepro.com",
    };

    const subscriptionForPush = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const { endpoint, headers, body: encryptedBody } = await buildPushHTTPRequest({
      privateJWK,
      message,
      subscription: subscriptionForPush,
    });

    const pushRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: new Uint8Array(encryptedBody),
    });

    if (pushRes.status === 410 || pushRes.status === 404) {
      // Subscription expired, remove it
      await supabase.from("push_subscriptions").delete().eq("user_id", session.user_id);
      console.log("Removed expired subscription for user:", session.user_id);
      return new Response(JSON.stringify({ success: true, sent: 0, reason: "Subscription expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pushRes.ok) {
      const errText = await pushRes.text().catch(() => "");
      console.error("Push failed:", pushRes.status, errText);
      return new Response(JSON.stringify({ error: "Push delivery failed", status: pushRes.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Session push sent to user ${session.user_id} for event: ${event || session.status}`);

    return new Response(
      JSON.stringify({ success: true, sent: 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending session push:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
