import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, platform } = await req.json();
    
    const HIVE_API_KEY = Deno.env.get('HIVE_AI_API_KEY');
    if (!HIVE_API_KEY) {
      throw new Error('HIVE_AI_API_KEY is not configured');
    }

    // Style enhancements
    const styleGuide: Record<string, string> = {
      modern: "sleek minimalist aesthetic, soft gradients, clean shapes, modern design",
      bold: "bold vibrant colors, dynamic composition, strong contrast, eye-catching",
      elegant: "sophisticated elegant design, premium feel, muted tones, luxury aesthetic",
      tech: "futuristic tech aesthetic, neon accents, dark background, holographic elements, cyber style",
      trading: "professional trading theme, abstract charts, gold and navy colors, financial aesthetic, stock market vibes",
    };

    // Platform sizes mapping
    const platformSizes: Record<string, { width: number; height: number }> = {
      instagram: { width: 1024, height: 1024 },
      story: { width: 768, height: 1344 },
      twitter: { width: 1280, height: 720 },
      linkedin: { width: 1280, height: 720 },
      youtube: { width: 1280, height: 720 },
      facebook: { width: 1280, height: 720 },
      pinterest: { width: 768, height: 1152 },
      tiktok: { width: 768, height: 1344 },
    };

    const imageSize = platformSizes[platform] || platformSizes.instagram;
    const styleEnhancement = styleGuide[style] || styleGuide.trading;

    // Build enhanced prompt
    const enhancedPrompt = `${prompt}. Style: ${styleEnhancement}. Ultra high quality, professional photography, stunning visuals, no text or words in the image, purely visual artwork, cinematic lighting, 8K resolution quality.`;

    console.log('Generating image with Hive AI:', enhancedPrompt.substring(0, 200) + '...');
    console.log('Image size:', imageSize);

    const response = await fetch('https://api.thehive.ai/api/v3/hive/flux-schnell-enhanced', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: enhancedPrompt,
          image_size: imageSize,
          num_inference_steps: 15,
          num_images: 1,
          seed: Math.floor(Math.random() * 1000),
          output_format: "jpeg",
          output_quality: 90
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hive AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: 'API authentication failed. Please check your API key.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Hive AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Hive AI response received:', JSON.stringify(data).substring(0, 500));

    // Extract the image URL from Hive AI response
    // Hive AI returns images in output array with url property
    const generatedImageUrl = data.output?.[0]?.url || data.output?.[0] || data.image_url || data.url;

    if (!generatedImageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image was generated');
    }

    // Upload to Supabase Storage for persistence
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'social-images');
    
    if (!bucketExists) {
      await supabase.storage.createBucket('social-images', { public: true });
    }

    // Download the image from Hive AI URL and upload to our storage
    try {
      const imageResponse = await fetch(generatedImageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch generated image');
      }
      
      const imageBlob = await imageResponse.arrayBuffer();
      const imageBuffer = new Uint8Array(imageBlob);
      
      const fileName = `generated/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Return original Hive AI URL as fallback
        return new Response(JSON.stringify({ 
          imageUrl: generatedImageUrl,
          isBase64: false,
          description: `Generated with style: ${style} for ${platform}` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('social-images')
        .getPublicUrl(fileName);

      console.log('Image uploaded successfully:', publicUrlData.publicUrl);

      return new Response(JSON.stringify({ 
        imageUrl: publicUrlData.publicUrl,
        isBase64: false,
        description: `Generated with style: ${style} for ${platform}`,
        fileName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (uploadErr) {
      console.error('Error processing image:', uploadErr);
      // Return original URL as fallback
      return new Response(JSON.stringify({ 
        imageUrl: generatedImageUrl,
        isBase64: false,
        description: `Generated with style: ${style} for ${platform}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-social-image:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
