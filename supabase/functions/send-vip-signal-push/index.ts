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

    const { signal } = await req.json();

    if (!signal) {
      return new Response(JSON.stringify({ error: "Missing signal data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all push subscriptions with user notification preferences
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get notification preferences for all users with subscriptions
    const userIds = subscriptions.map(s => s.user_id);
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("user_id, vip_signals")
      .in("user_id", userIds);

    // Create a map for quick lookup
    const prefsMap = new Map<string, boolean>();
    if (preferences) {
      preferences.forEach(p => prefsMap.set(p.user_id, p.vip_signals));
    }

    // Filter subscriptions to only include users who want VIP signal notifications
    const filteredSubscriptions = subscriptions.filter(sub => {
      const wantsVipSignals = prefsMap.get(sub.user_id);
      // Default to true if no preference is set
      return wantsVipSignals !== false;
    });

    console.log(`Filtered ${subscriptions.length} subscriptions to ${filteredSubscriptions.length} based on preferences`);

    if (filteredSubscriptions.length === 0) {
      console.log("No users opted in for VIP signal notifications");
      return new Response(JSON.stringify({ success: true, sent: 0, filtered: subscriptions.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateJWK = buildVapidPrivateJwk({ vapidPublicKey, vapidPrivateKey });

    const signalType = signal.signal_type === "BUY" ? "🟢 BUY" : "🔴 SELL";
    const payload = {
      title: `⭐ VIP Signal: ${signal.symbol}`,
      body: `${signalType} @ ${signal.entry_price}${signal.vip_notes ? ` - ${signal.vip_notes.substring(0, 50)}` : ""}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `vip-signal-${signal.id}`,
      data: {
        url: "/dashboard/signals",
        signalId: signal.id,
        type: "vip_signal",
      },
    };

    const message = {
      payload,
      options: {
        ttl: 24 * 60 * 60,
        urgency: "high",
        topic: "vip-signal",
      },
      adminContact: "mailto:support@traderedgepro.com",
    };

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const sub of filteredSubscriptions) {
      try {
        const subscriptionForPush = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
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
          expiredSubscriptions.push(sub.user_id);
        } else if (pushRes.ok) {
          sentCount++;
        } else {
          console.error(`Push failed for user ${sub.user_id}:`, pushRes.status);
          failedCount++;
        }
      } catch (err) {
        console.error(`Error sending push to user ${sub.user_id}:`, err);
        failedCount++;
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("user_id", expiredSubscriptions);
      console.log(`Removed ${expiredSubscriptions.length} expired subscriptions`);
    }

    console.log(`VIP signal push sent: ${sentCount} success, ${failedCount} failed, ${expiredSubscriptions.length} expired`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        expired: expiredSubscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending VIP signal push:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
