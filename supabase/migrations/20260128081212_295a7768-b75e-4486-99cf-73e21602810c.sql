-- Fix security: Remove overly permissive policies and restrict access to managers and manager_sessions tables

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Service role full access to managers" ON public.managers;
DROP POLICY IF EXISTS "Service role full access to manager_sessions" ON public.manager_sessions;

-- Create restrictive policies for managers table
-- Only allow access via service role (edge functions)
-- These policies explicitly deny all access to non-service-role users
CREATE POLICY "Deny public read access to managers"
ON public.managers
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny public insert to managers"
ON public.managers
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny public update to managers"
ON public.managers
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny public delete from managers"
ON public.managers
FOR DELETE
TO anon, authenticated
USING (false);

-- Create restrictive policies for manager_sessions table
-- Session tokens must never be accessible to clients
CREATE POLICY "Deny public read access to manager_sessions"
ON public.manager_sessions
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny public insert to manager_sessions"
ON public.manager_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny public update to manager_sessions"
ON public.manager_sessions
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny public delete from manager_sessions"
ON public.manager_sessions
FOR DELETE
TO anon, authenticated
USING (false);