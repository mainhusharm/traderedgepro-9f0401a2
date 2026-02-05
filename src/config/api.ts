 // Production API Configuration
 // This file centralizes all API endpoint configurations for TraderEdgePro

import { supabase } from '@/integrations/supabase/client';
 
 // Render Backend URL
 export const RENDER_BACKEND_URL = 'https://traderedgepro-9f0401a2.onrender.com';
 
 // Supabase configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gsmfjghxwebasmmxqlsi.supabase.co';
// Support both env var names to avoid production misconfig (common when migrating)
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta.env as any).VITE_SUPABASE_ANON_KEY ||
  '';
 
 // Environment detection
 export const IS_PRODUCTION = import.meta.env.PROD;
 export const IS_DEVELOPMENT = import.meta.env.DEV;
 
 // Determine which backend to use
 // In production deployed on Render: use Render backend
 // In development/Lovable preview: use Supabase directly
 const shouldUseRenderBackend = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  const isLovablePreview = hostname.includes('lovable.app');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // Never use the Render proxy inside Lovable preview or local dev
  if (isLovablePreview || isLocal || import.meta.env.DEV) return false;

  // In production builds, default to Render proxy to avoid direct /functions/v1 auth/CORS issues
  if (import.meta.env.PROD) return true;

  // Fallback: use Render backend when deployed on Render or custom domain
  if (
    hostname.includes('onrender.com') ||
    hostname.includes('traderedgepro.com') ||
    hostname === 'traderedgepro.com'
  ) {
    return true;
  }

  return false;
 };
 
 export const USE_RENDER_BACKEND = shouldUseRenderBackend();
 
 // Get the appropriate API base URL
 export const getApiBaseUrl = (): string => {
   if (USE_RENDER_BACKEND) {
     return RENDER_BACKEND_URL;
   }
   return SUPABASE_URL;
 };
 
 export const API_CONFIG = {
   RENDER_BACKEND_URL,
   SUPABASE_URL,
   SUPABASE_ANON_KEY,
   IS_PRODUCTION,
   IS_DEVELOPMENT,
   USE_RENDER_BACKEND,
   BASE_URL: getApiBaseUrl(),
 } as const;
 
 // Helper to build API endpoints
 export const buildApiUrl = (path: string): string => {
   const baseUrl = API_CONFIG.BASE_URL;
   const cleanPath = path.startsWith('/') ? path.slice(1) : path;
   return `${baseUrl}/${cleanPath}`;
 };
 
 // Helper function to call edge functions
 // Uses Render backend proxy in production, Supabase directly in development
 export const callEdgeFunction = async <T = any>(
   functionName: string,
   body: Record<string, any>,
   customHeaders: Record<string, string> = {}
 ): Promise<{ data: T | null; error: Error | null }> => {
   try {
     let url: string;
    const headers: Record<string, string> = {
       'Content-Type': 'application/json',
       ...customHeaders,
     };

    // Prefer the logged-in user's JWT so backend functions can securely identify the caller.
    // Fallback to the publishable key when no session exists (public/anon calls).
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    } catch {
      // ignore session lookup failures
    }
 
     if (USE_RENDER_BACKEND) {
       // Use Render backend proxy
       url = `${RENDER_BACKEND_URL}/api/functions/${functionName}`;
     } else {
       // Use Supabase directly
       url = `${SUPABASE_URL}/functions/v1/${functionName}`;
       headers['apikey'] = SUPABASE_ANON_KEY;
      // If we didn't already set a user JWT above, fall back to an anon/public token.
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
      }
     }
 
     console.log(`[API] Calling ${functionName} via ${USE_RENDER_BACKEND ? 'Render' : 'Supabase'}`);
 
     const response = await fetch(url, {
       method: 'POST',
       headers,
       body: JSON.stringify(body),
     });
 
     const data = await response.json();
 
     if (!response.ok) {
       return { data: null, error: new Error(data.error || data.message || 'API request failed') };
     }
 
     return { data, error: null };
   } catch (error) {
     console.error(`[API] Error calling ${functionName}:`, error);
     return { data: null, error: error as Error };
   }
 };
 
 // Auth-specific API calls
 export const authApi = {
   sendOtp: (email: string) => callEdgeFunction('send-otp', { email }),
   verifyOtp: (email: string, otp: string) => callEdgeFunction('verify-otp', { email, otp }),
   
   validateAdminAccess: (password: string, mpin: string) => 
     callEdgeFunction('validate-admin-access', { password, mpin }),
   
   agentSendOtp: (data: { email?: string; invitationToken?: string }) => 
     callEdgeFunction('agent-send-otp', data),
   agentVerifyOtp: (data: { email: string; otp: string; invitationToken?: string }) => 
     callEdgeFunction('agent-verify-otp', data),
   validateAgentSession: (sessionToken: string) => 
     callEdgeFunction('validate-agent-session', { sessionToken }),
   
   managerSendOtp: (email: string) => callEdgeFunction('manager-send-otp', { email }),
   managerVerifyOtp: (email: string, otp: string) => callEdgeFunction('manager-verify-otp', { email, otp }),
   
   clientSendOtp: (email: string) => callEdgeFunction('client-send-otp', { email }),
   clientVerifyOtp: (email: string, otp: string) => callEdgeFunction('client-verify-otp', { email, otp }),
   
   validateMarketingAccess: (mpin: string) => callEdgeFunction('validate-marketing-access', { mpin }),
 };
 
 export default API_CONFIG;