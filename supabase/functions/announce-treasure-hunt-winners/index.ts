import { createHmac } from "node:crypto";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Twitter OAuth config
const API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Winner {
  id: string;
  email: string;
  twitter_handle: string;
  winner_position: number;
  discount_code: string;
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  return signature;
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, API_SECRET!, ACCESS_TOKEN_SECRET!);

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));

  return "OAuth " + entries.map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ");
}

async function sendTweet(tweetText: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(method, url);

  console.log("Sending tweet:", tweetText.substring(0, 100) + "...");

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });

  const responseText = await response.text();
  console.log("Twitter API response:", responseText);

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function sendWinnerEmail(winner: Winner): Promise<void> {
  const positionLabel = winner.winner_position === 1 ? "1st" : winner.winner_position === 2 ? "2nd" : "3rd";
  const emoji = winner.winner_position === 1 ? "🥇" : winner.winner_position === 2 ? "🥈" : "🥉";

  console.log(`Sending email to winner ${winner.email}...`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TraderEdge Pro <hello@traderedgepro.com>",
      to: [winner.email],
      subject: `🏆 Congratulations! You Won ${positionLabel} Place in the Treasure Hunt!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .trophy { font-size: 80px; }
            .title { font-size: 32px; font-weight: bold; color: #fbbf24; margin: 20px 0; }
            .position { font-size: 24px; color: #fbbf24; margin-bottom: 10px; }
            .card { background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05)); border: 2px solid rgba(251, 191, 36, 0.3); border-radius: 16px; padding: 30px; margin: 20px 0; }
            .code-box { background: rgba(34, 197, 94, 0.1); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 28px; font-family: monospace; font-weight: bold; color: #22c55e; letter-spacing: 2px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; color: #888888; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="trophy">🏆</div>
              <div class="title">YOU WON!</div>
              <div class="position">${emoji} ${positionLabel} Place</div>
            </div>
            
            <div class="card">
              <p style="margin: 0 0 15px;">Congratulations <strong>@${winner.twitter_handle}</strong>!</p>
              <p style="margin: 0 0 15px;">You've successfully conquered all 3 challenges in the TraderEdge Pro Treasure Hunt and claimed <strong>${positionLabel} place</strong>!</p>
              <p style="margin: 0;"><strong>🎁 Your Prize:</strong> 1 Month FREE Pro Account Access</p>
            </div>
            
            <div class="code-box">
              <p style="margin: 0 0 10px; color: #888;">Your Exclusive Discount Code:</p>
              <div class="code">${winner.discount_code}</div>
            </div>
            
            <div style="text-align: center;">
              <a href="https://traderedgepro.com/payment-flow?plan=pro&code=${winner.discount_code}" class="cta-button">
                🎁 Claim Your Free Pro Account
              </a>
            </div>
            
            <p style="text-align: center; color: #888; margin-top: 20px; font-size: 14px;">
              This code is valid for 30 days and can only be used once.
            </p>
            
            <div class="footer">
              <p>Thank you for participating!</p>
              <p>TraderEdge Pro Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }

  console.log("Email sent successfully");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { winners, sendEmail = true, sendTwitter = true } = await req.json() as {
      winners: Winner[];
      sendEmail?: boolean;
      sendTwitter?: boolean;
    };

    if (!winners || winners.length === 0) {
      throw new Error("No winners provided");
    }

    console.log(`Processing ${winners.length} winners...`);

    const results: { email: boolean; twitter: boolean; errors: string[] } = {
      email: false,
      twitter: false,
      errors: [],
    };

    // Send individual emails to winners
    if (sendEmail && RESEND_API_KEY) {
      for (const winner of winners) {
        try {
          await sendWinnerEmail(winner);
          
          // Update notified_at in database
          await supabase
            .from("treasure_hunt_entries")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", winner.id);
        } catch (emailError: any) {
          console.error(`Error sending email to ${winner.email}:`, emailError);
          results.errors.push(`Email to ${winner.email}: ${emailError.message}`);
        }
      }
      results.email = true;
    }

    // Send Twitter announcement
    if (sendTwitter && API_KEY && API_SECRET && ACCESS_TOKEN && ACCESS_TOKEN_SECRET) {
      try {
        const sortedWinners = [...winners].sort((a, b) => a.winner_position - b.winner_position);
        
        const tweetText = `🏴‍☠️ TREASURE HUNT WINNERS! 🏆

🥇 1st Place: @${sortedWinners[0]?.twitter_handle || "TBD"}
🥈 2nd Place: @${sortedWinners[1]?.twitter_handle || "TBD"}
🥉 3rd Place: @${sortedWinners[2]?.twitter_handle || "TBD"}

Congrats to our champions who conquered all 3 trading challenges! 🎉

Each winner gets 1 month FREE Pro access! 🎁

Thanks to everyone who participated!
#TreasureHunt #Trading #TraderEdgePro`;

        await sendTweet(tweetText);
        results.twitter = true;
      } catch (twitterError: any) {
        console.error("Error posting to Twitter:", twitterError);
        results.errors.push(`Twitter: ${twitterError.message}`);
      }
    }

    // Update config to mark winners as announced
    await supabase
      .from("treasure_hunt_config")
      .update({ winners_announced: true })
      .eq("is_active", true);

    // Update all winners' announcement status
    for (const winner of winners) {
      await supabase
        .from("treasure_hunt_entries")
        .update({ announcement_status: "announced" })
        .eq("id", winner.id);
    }

    console.log("Announcement completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in announce-treasure-hunt-winners:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
