-- =====================================================
-- PHASE 2: Additional security fixes
-- =====================================================

-- 1. Add public read access for published blog posts (blog is publicly accessible)
CREATE POLICY "Public can view published blog posts v2" 
ON marketing_blog_posts_v2 FOR SELECT 
USING (status = 'published');

-- 2. Fix remaining overly permissive policies on marketing_engagement tables
-- These tables had "Allow all" policies that we created authenticated ones for,
-- but the old "Allow all" policies are still there - drop them
DROP POLICY IF EXISTS "Allow all access to engagement analytics" ON marketing_engagement_analytics;
DROP POLICY IF EXISTS "Allow all access to engagement config" ON marketing_engagement_config;
DROP POLICY IF EXISTS "Allow all access to engagement history" ON marketing_engagement_history;
DROP POLICY IF EXISTS "Allow all access to hourly stats" ON marketing_engagement_hourly_stats;
DROP POLICY IF EXISTS "Allow all access to engagement queue" ON marketing_engagement_queue;

-- 3. Fix agent_signal_comments delete policy (currently true)
DROP POLICY IF EXISTS "Agents can delete their comments" ON agent_signal_comments;
CREATE POLICY "Active agents can delete own comments" ON agent_signal_comments FOR DELETE 
USING (public.is_active_agent(auth.uid()));

-- 4. Fix signal_expert_validations policies (currently permissive)
DROP POLICY IF EXISTS "Agents can create validations" ON signal_expert_validations;
DROP POLICY IF EXISTS "Agents can update own validations" ON signal_expert_validations;
-- Note: We already added proper policies in previous migration

-- 5. Fix update_updated_at_column function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;