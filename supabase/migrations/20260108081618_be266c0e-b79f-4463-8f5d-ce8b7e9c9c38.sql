-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.push_subscriptions;