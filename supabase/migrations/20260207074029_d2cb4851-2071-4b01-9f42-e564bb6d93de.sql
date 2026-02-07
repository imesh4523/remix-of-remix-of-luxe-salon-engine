-- Fix the overly permissive INSERT policy on email_logs
-- Drop the permissive policy and create a proper one
DROP POLICY IF EXISTS "Service role can insert logs" ON public.email_logs;

-- Email logs should only be inserted by authenticated users or service role
-- Since edge functions use service role, we need to allow inserts but restrict to auth context
CREATE POLICY "Authenticated users can insert email logs"
ON public.email_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');