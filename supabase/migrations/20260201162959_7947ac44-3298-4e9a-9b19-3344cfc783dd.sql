-- Fix the activity logs INSERT policy to be more restrictive (authenticated users only)
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;

CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);