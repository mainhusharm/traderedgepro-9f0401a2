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
    throw new Error("Invalid VAPID_PUBLIC_KEY (expected uncompressed P-256 public key)");
  }

  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);

  const dBytes = base64UrlToBytes(params.vapidPrivateKey);
  if (dBytes.length !== 32) {
    throw new Error("Invalid VAPID_PRIVATE_KEY (expected 32-byte P-256 private key)");
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
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    // Validate JWT and get user id (sub)
    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requesterUserId = claimsData.claims.sub as string;

    const {
      userId: requestedUserId,
      title,
      body,
      icon,
      badge,
      tag,
      data,
      url,
      urgency,
      ttl,
    } = await req.json();

    const targetUserId = (requestedUserId || requesterUserId) as string;

    // Only allow sending to yourself (simple + safe default)
    if (targetUserId !== requesterUserId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", targetUserId)
      .single();

    if (subError || !subscription) {
      console.log("No subscription found for user:", targetUserId, subError);
      return new Response(JSON.stringify({ error: "No push subscription found for user" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateJWK = buildVapidPrivateJwk({ vapidPublicKey, vapidPrivateKey });

    const payload = {
      title: title || "TraderEdge Pro",
      body: body || "New notification",
      icon: icon || "/favicon.ico",
      badge: badge || "/favicon.ico",
      tag: tag || "traderedge-notification",
      data: {
        ...(data || {}),
        url: url || data?.url || "/dashboard",
      },
    };

    const message = {
      payload,
      options: {
        ttl: typeof ttl === "number" ? ttl : 24 * 60 * 60,
        urgency: urgency || "normal",
        topic: payload.tag,
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
      // Subscription is gone/expired, remove it.
      console.log("Push subscription expired; removing from DB", targetUserId, pushRes.status);
      await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", targetUserId);
    }

    const responseText = await pushRes.text().catch(() => "");

    if (!pushRes.ok) {
      console.error("Push provider error", pushRes.status, responseText);
      return new Response(
        JSON.stringify({
          error: "Failed to send push notification",
          status: pushRes.status,
          details: responseText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: pushRes.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Error sending web push:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
