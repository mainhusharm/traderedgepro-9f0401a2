import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYPAL_CLIENT_ID = "Adhub7PVj7wX5Fey5aNEouD7GHn0Q5MsUgchDYzDb-db3SMiKYSZkZo3-OXQhbHMvfH_evVmqYUQksJo";
const PAYPAL_SECRET_KEY = Deno.env.get("PAYPAL_SECRET_KEY");
const PAYPAL_BASE_URL = "https://api-m.paypal.com"; // Use sandbox for testing: https://api-m.sandbox.paypal.com

async function getAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`);
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, planName, currency = "USD" } = await req.json();

    if (!amount || !planName) {
      return new Response(
        JSON.stringify({ error: "Amount and plan name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: `TraderEdge Pro - ${planName}`,
        },
      ],
      application_context: {
        brand_name: "TraderEdge Pro",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${req.headers.get("origin")}/payment-success`,
        cancel_url: `${req.headers.get("origin")}/membership`,
      },
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("PayPal create order error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create PayPal order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await response.json();
    console.log("PayPal order created:", order.id);

    return new Response(
      JSON.stringify({ 
        orderId: order.id,
        approvalUrl: order.links.find((link: any) => link.rel === "approve")?.href 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("PayPal create order error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
