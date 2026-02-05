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

function buildVapidPrivateJwk(params: { vapidPublicKey: string; vapidPrivateKey: string }): JsonWebKey {
  const pub = base64UrlToBytes(params.vapidPublicKey);
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error("Invalid VAPID_PUBLIC_KEY");
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const dBytes = base64UrlToBytes(params.vapidPrivateKey);
  if (dBytes.length !== 32) throw new Error("Invalid VAPID_PRIVATE_KEY");
  return { kty: "EC", crv: "P-256", x: bytesToBase64Url(x), y: bytesToBase64Url(y), d: bytesToBase64Url(dBytes), ext: true };
}

const badgeEmojis: Record<string, string> = {
  "First Trade": "🎯",
  "Win Streak": "🔥",
  "Profit Master": "💰",
  "Risk Manager": "🛡️",
  "Early Bird": "🌅",
  "Night Owl": "🦉",
  "Consistent Trader": "📊",
  "Journal Hero": "📝",
};

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
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, badgeName, badgeDescription, badgeLevel } = await req.json();

    if (!userId || !badgeName) {
      return new Response(JSON.stringify({ error: "Missing userId or badgeName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscription, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId)
      .single();

    const emoji = badgeEmojis[badgeName] || "🏆";
    const levelText = badgeLevel ? ` (Level ${badgeLevel})` : "";

    const logData = {
      user_id: userId,
      notification_type: "badge",
      title: `${emoji} Badge Unlocked: ${badgeName}${levelText}`,
      body: badgeDescription || "You've earned a new trading badge!",
      status: "pending",
      endpoint: subscription?.endpoint || null,
    };

    if (subError || !subscription) {
      await supabase.from("push_notification_logs").insert({ ...logData, status: "no_subscription" });
      return new Response(JSON.stringify({ success: false, reason: "no_subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateJWK = buildVapidPrivateJwk({ vapidPublicKey, vapidPrivateKey });

    const payload = {
      title: logData.title,
      body: logData.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "badge-unlock",
      data: { url: "/achievements", type: "badge", badgeName, badgeLevel },
    };

    const { endpoint, headers, body: encryptedBody } = await buildPushHTTPRequest({
      privateJWK,
      message: {
        payload,
        options: { ttl: 86400, urgency: "high", topic: "badge" },
        adminContact: "mailto:support@traderedgepro.com",
      },
      subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    });

    const pushRes = await fetch(endpoint, { method: "POST", headers, body: new Uint8Array(encryptedBody) });

    if (pushRes.status === 410 || pushRes.status === 404) {
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
      await supabase.from("push_notification_logs").insert({ ...logData, status: "expired", error_message: "Subscription expired" });
      return new Response(JSON.stringify({ success: false, reason: "subscription_expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pushRes.ok) {
      const errText = await pushRes.text().catch(() => "");
      await supabase.from("push_notification_logs").insert({ ...logData, status: "failed", error_message: `${pushRes.status}: ${errText}` });
      return new Response(JSON.stringify({ success: false, status: pushRes.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("push_notification_logs").insert({ ...logData, status: "delivered", delivered_at: new Date().toISOString() });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
