import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitter OAuth 1.0a signature generation
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const normalizedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(
    normalizedParams
  )}`;

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(
  method: string,
  url: string,
  apiKeys: any,
  signatureParams: Record<string, string> = {}
): string {
  const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET } = apiKeys;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_CONSUMER_KEY,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    { ...oauthParams, ...signatureParams },
    TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN_SECRET
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return "OAuth " + Object.entries(signedOAuthParams)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function uploadTwitterMediaFromUrl(imageUrl: string, apiKeys: any): Promise<string> {
  const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch image (${imgRes.status})`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);

  // Use application/x-www-form-urlencoded so the media_data param is part of the OAuth signature
  const bodyParams = {
    media_data: base64,
    media_category: "tweet_image",
  };

  const oauthHeader = generateOAuthHeader("POST", uploadUrl, apiKeys, bodyParams);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  const responseText = await response.text();
  if (!response.ok) {
    console.error("Twitter media upload error:", response.status, responseText.slice(0, 500));
    throw new Error(`Twitter media upload failed (HTTP ${response.status})`);
  }

  const data = JSON.parse(responseText);
  const mediaId = data.media_id_string || String(data.media_id);
  if (!mediaId) throw new Error("Twitter media upload: missing media_id");

  return mediaId;
}

// Post to Twitter/X using v2 API (with optional media upload)
async function postToTwitter(
  content: string,
  imageUrl: string | null,
  images: string[] | null,
  apiKeys: any
) {
  const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET } = apiKeys;

  if (!TWITTER_CONSUMER_KEY || !TWITTER_CONSUMER_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    console.log('Twitter keys status:', {
      hasConsumerKey: !!TWITTER_CONSUMER_KEY,
      hasConsumerSecret: !!TWITTER_CONSUMER_SECRET,
      hasAccessToken: !!TWITTER_ACCESS_TOKEN,
      hasAccessTokenSecret: !!TWITTER_ACCESS_TOKEN_SECRET
    });
    return { success: false, error: 'Twitter API keys not fully configured', platform: 'twitter' };
  }

  try {
    const tweetUrl = "https://api.x.com/2/tweets";

    const requestedImages = (images && Array.isArray(images) && images.length > 0)
      ? images
      : (imageUrl ? [imageUrl] : []);

    const mediaIds: string[] = [];
    if (requestedImages.length > 0) {
      console.log(`Uploading ${Math.min(requestedImages.length, 4)} media item(s) to Twitter...`);
      for (const url of requestedImages.slice(0, 4)) {
        const mediaId = await uploadTwitterMediaFromUrl(url, apiKeys);
        mediaIds.push(mediaId);
      }
    }

    const oauthHeader = generateOAuthHeader("POST", tweetUrl, apiKeys);

    console.log('Posting to Twitter:', content.slice(0, 50) + '...');

    const body: any = { text: content };
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds };
    }

    const response = await fetch(tweetUrl, {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('Twitter response:', response.status, responseText);

    if (!response.ok) {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.detail || errorData.title || `HTTP ${response.status}`);
    }

    const data = JSON.parse(responseText);
    return {
      success: true,
      postId: data.data?.id,
      platform: 'twitter',
      url: `https://twitter.com/i/web/status/${data.data?.id}`
    };
  } catch (error) {
    console.error('Twitter posting error:', error);
    return { success: false, error: String(error), platform: 'twitter' };
  }
}

// Post to YouTube using Google API
async function postToYouTube(content: string, imageUrl: string | null, apiKeys: any) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = apiKeys;
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return { success: false, error: 'YouTube/Google API not fully configured', platform: 'youtube' };
  }

  try {
    // First, refresh the access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Google token refresh error:', error);
      throw new Error('Failed to refresh Google access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // YouTube community posts require different API - for now just note it
    // YouTube Data API doesn't support community posts directly
    // This would need YouTube Studio API or other methods
    
    return { 
      success: false, 
      error: 'YouTube community posts are not supported via API. Consider posting videos instead.', 
      platform: 'youtube',
      note: 'YouTube API only supports video uploads, not community posts'
    };
  } catch (error) {
    console.error('YouTube posting error:', error);
    return { success: false, error: String(error), platform: 'youtube' };
  }
}

async function postToLinkedIn(content: string, imageUrl: string | null, apiKeys: any) {
  const { LINKEDIN_ACCESS_TOKEN } = apiKeys;
  
  if (!LINKEDIN_ACCESS_TOKEN) {
    return { success: false, error: 'LinkedIn API token not configured', platform: 'linkedin' };
  }

  try {
    return { 
      success: false, 
      error: 'LinkedIn integration requires OAuth setup', 
      platform: 'linkedin',
      instructions: 'To enable LinkedIn posting, add LINKEDIN_ACCESS_TOKEN secret'
    };
  } catch (error) {
    return { success: false, error: String(error), platform: 'linkedin' };
  }
}

async function postToFacebook(content: string, imageUrl: string | null, apiKeys: any) {
  const { FACEBOOK_PAGE_TOKEN, FACEBOOK_PAGE_ID } = apiKeys;
  
  if (!FACEBOOK_PAGE_TOKEN || !FACEBOOK_PAGE_ID) {
    return { success: false, error: 'Facebook API credentials not configured', platform: 'facebook' };
  }

  try {
    const url = imageUrl 
      ? `https://graph.facebook.com/${FACEBOOK_PAGE_ID}/photos`
      : `https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed`;
    
    const body = imageUrl
      ? { url: imageUrl, caption: content, access_token: FACEBOOK_PAGE_TOKEN }
      : { message: content, access_token: FACEBOOK_PAGE_TOKEN };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    return { success: true, postId: data.id || data.post_id, platform: 'facebook' };
  } catch (error) {
    return { success: false, error: String(error), platform: 'facebook' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, imageUrl, images, platforms, postId } = await req.json();

    const imagesArr: string[] = Array.isArray(images) ? images : [];
    const primaryImageUrl: string | null = imageUrl || imagesArr[0] || null;

    console.log('Post to social request:', {
      platforms,
      hasImage: !!primaryImageUrl,
      imagesCount: imagesArr.length,
      contentLength: content?.length,
    });

    // Get API keys from environment - use correct secret names
    const apiKeys = {
      TWITTER_CONSUMER_KEY: Deno.env.get('TWITTER_CONSUMER_KEY')?.trim(),
      TWITTER_CONSUMER_SECRET: Deno.env.get('TWITTER_CONSUMER_SECRET')?.trim(),
      TWITTER_ACCESS_TOKEN: Deno.env.get('TWITTER_ACCESS_TOKEN')?.trim(),
      TWITTER_ACCESS_TOKEN_SECRET: Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')?.trim(),
      GOOGLE_CLIENT_ID: Deno.env.get('GOOGLE_CLIENT_ID')?.trim(),
      GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET')?.trim(),
      GOOGLE_REFRESH_TOKEN: Deno.env.get('GOOGLE_REFRESH_TOKEN')?.trim(),
      LINKEDIN_ACCESS_TOKEN: Deno.env.get('LINKEDIN_ACCESS_TOKEN'),
      FACEBOOK_PAGE_TOKEN: Deno.env.get('FACEBOOK_PAGE_TOKEN'),
      FACEBOOK_PAGE_ID: Deno.env.get('FACEBOOK_PAGE_ID'),
    };

    const results: any[] = [];
    const configuredPlatforms: string[] = [];
    const unconfiguredPlatforms: string[] = [];

    // Check which platforms are configured
    if (apiKeys.TWITTER_CONSUMER_KEY && apiKeys.TWITTER_ACCESS_TOKEN) {
      configuredPlatforms.push('twitter');
    }
    if (apiKeys.GOOGLE_CLIENT_ID && apiKeys.GOOGLE_REFRESH_TOKEN) {
      configuredPlatforms.push('youtube');
    }
    if (apiKeys.LINKEDIN_ACCESS_TOKEN) {
      configuredPlatforms.push('linkedin');
    }
    if (apiKeys.FACEBOOK_PAGE_TOKEN && apiKeys.FACEBOOK_PAGE_ID) {
      configuredPlatforms.push('facebook');
    }

    console.log('Configured platforms:', configuredPlatforms);

    for (const platform of platforms) {
      const platformLower = platform.toLowerCase();
      
      if (!configuredPlatforms.includes(platformLower)) {
        unconfiguredPlatforms.push(platform);
        results.push({
          platform,
          success: false,
          error: `${platform} API not configured`,
          requiresSetup: true
        });
        continue;
      }

      let result;
      switch (platformLower) {
        case 'twitter':
        case 'x':
          result = await postToTwitter(content, primaryImageUrl, imagesArr, apiKeys);
          break;
        case 'youtube':
          result = await postToYouTube(content, primaryImageUrl, apiKeys);
          break;
        case 'linkedin':
          result = await postToLinkedIn(content, primaryImageUrl, apiKeys);
          break;
        case 'facebook':
          result = await postToFacebook(content, primaryImageUrl, apiKeys);
          break;
        default:
          result = { success: false, error: `Platform ${platform} not supported for auto-posting yet`, platform };
      }
      results.push(result);
    }

    // Update post status in database if postId provided
    if (postId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const successfulPlatforms = results.filter(r => r.success).map(r => r.platform);
      
      if (successfulPlatforms.length > 0) {
        await supabase
          .from('marketing_social_posts')
          .update({ 
            status: 'published', 
            published_at: new Date().toISOString(),
          })
          .eq('id', postId);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const setupRequired = unconfiguredPlatforms.length > 0;

    return new Response(JSON.stringify({ 
      results,
      summary: {
        total: platforms.length,
        successful: successCount,
        failed: platforms.length - successCount,
        setupRequired,
        configuredPlatforms,
        unconfiguredPlatforms,
        message: successCount === platforms.length 
          ? 'All posts published successfully!'
          : successCount > 0
            ? `Posted to ${successCount}/${platforms.length} platforms`
            : setupRequired 
              ? `Platforms require API configuration: ${unconfiguredPlatforms.join(', ')}`
              : 'Failed to post to platforms'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in post-to-social:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
