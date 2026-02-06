-- =====================================================
-- SECURITY FIX: Tighten overly permissive RLS policies
-- =====================================================

-- 1. Fix marketing tables - require authentication
DROP POLICY IF EXISTS "Allow all operations for marketing automation" ON marketing_ai_automation;
DROP POLICY IF EXISTS "Allow all for marketing_ai_chats" ON marketing_ai_chats;
DROP POLICY IF EXISTS "Allow all for marketing_ai_conversations" ON marketing_ai_conversations;
DROP POLICY IF EXISTS "Allow all for marketing_blog_posts" ON marketing_blog_posts;
DROP POLICY IF EXISTS "Allow all for marketing_blog_posts_v2" ON marketing_blog_posts_v2;
DROP POLICY IF EXISTS "Allow all for marketing_compliance_reviews" ON marketing_compliance_reviews;
DROP POLICY IF EXISTS "Allow all for marketing_emails" ON marketing_emails;
DROP POLICY IF EXISTS "Allow all for marketing_engagement_analytics" ON marketing_engagement_analytics;
DROP POLICY IF EXISTS "Allow all for marketing_engagement_config" ON marketing_engagement_config;
DROP POLICY IF EXISTS "Allow all for marketing_engagement_history" ON marketing_engagement_history;
DROP POLICY IF EXISTS "Allow all for marketing_engagement_hourly_stats" ON marketing_engagement_hourly_stats;
DROP POLICY IF EXISTS "Allow all for marketing_engagement_queue" ON marketing_engagement_queue;
DROP POLICY IF EXISTS "Allow all for marketing_leads" ON marketing_leads;
DROP POLICY IF EXISTS "Allow all for marketing_leads_v2" ON marketing_leads_v2;
DROP POLICY IF EXISTS "Allow all for marketing_meeting_notes" ON marketing_meeting_notes;
DROP POLICY IF EXISTS "Allow all for marketing_reports" ON marketing_reports;
DROP POLICY IF EXISTS "Allow all for marketing_sessions" ON marketing_sessions;
DROP POLICY IF EXISTS "Allow all for marketing_social_posts" ON marketing_social_posts;
DROP POLICY IF EXISTS "Allow all for marketing_support_tickets" ON marketing_support_tickets;
DROP POLICY IF EXISTS "Allow all for marketing_tasks" ON marketing_tasks;
DROP POLICY IF EXISTS "Allow all for marketing_tasks_v2" ON marketing_tasks_v2;

-- Create authenticated-only policies for marketing tables
CREATE POLICY "Authenticated access to marketing_ai_automation" ON marketing_ai_automation FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_ai_chats" ON marketing_ai_chats FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_ai_conversations" ON marketing_ai_conversations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_blog_posts" ON marketing_blog_posts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_blog_posts_v2" ON marketing_blog_posts_v2 FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_compliance_reviews" ON marketing_compliance_reviews FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_emails" ON marketing_emails FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_engagement_analytics" ON marketing_engagement_analytics FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_engagement_config" ON marketing_engagement_config FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_engagement_history" ON marketing_engagement_history FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_engagement_hourly_stats" ON marketing_engagement_hourly_stats FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_engagement_queue" ON marketing_engagement_queue FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_leads" ON marketing_leads FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_leads_v2" ON marketing_leads_v2 FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_meeting_notes" ON marketing_meeting_notes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_reports" ON marketing_reports FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_sessions" ON marketing_sessions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_social_posts" ON marketing_social_posts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_support_tickets" ON marketing_support_tickets FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_tasks" ON marketing_tasks FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated access to marketing_tasks_v2" ON marketing_tasks_v2 FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix trade_daily_stats - remove anonymous access
DROP POLICY IF EXISTS "Allow anon all on trade_daily_stats" ON trade_daily_stats;
CREATE POLICY "Authenticated access to trade_daily_stats" ON trade_daily_stats FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix treasure_hunt_entries - restrict updates to own entries based on email
DROP POLICY IF EXISTS "Anyone can update treasure hunt entries" ON treasure_hunt_entries;
CREATE POLICY "Users can update own treasure hunt entries" ON treasure_hunt_entries FOR UPDATE USING (email = auth.email()) WITH CHECK (email = auth.email());

-- 4. Fix agent_signal_comments - ensure only active agents can add comments
DROP POLICY IF EXISTS "Agents can add comments" ON agent_signal_comments;
CREATE POLICY "Active agents can add signal comments" ON agent_signal_comments FOR INSERT WITH CHECK (
  public.is_active_agent(auth.uid())
);

-- 5. Add policy to admin_sessions - service role only (edge functions)
DROP POLICY IF EXISTS "Service role only access" ON admin_sessions;
CREATE POLICY "No direct client access to admin_sessions" ON admin_sessions FOR ALL USING (false) WITH CHECK (false);

-- 6. Fix signal_vip_votes - restrict to active agents
DROP POLICY IF EXISTS "Agents can manage VIP votes" ON signal_vip_votes;
CREATE POLICY "Active agents can manage VIP votes" ON signal_vip_votes FOR ALL 
  USING (public.is_active_agent(auth.uid())) 
  WITH CHECK (public.is_active_agent(auth.uid()));

-- 7. Fix signal_expert_validations - restrict to active agents  
DROP POLICY IF EXISTS "Agents can manage validations" ON signal_expert_validations;
CREATE POLICY "Active agents can manage signal validations" ON signal_expert_validations FOR ALL 
  USING (public.is_active_agent(auth.uid())) 
  WITH CHECK (public.is_active_agent(auth.uid()));