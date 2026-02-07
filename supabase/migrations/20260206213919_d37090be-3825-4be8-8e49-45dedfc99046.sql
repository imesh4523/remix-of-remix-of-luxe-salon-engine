-- Fix overly permissive RLS policy - drop and replace with proper service role check
DROP POLICY IF EXISTS "Service role can update any crypto payments" ON public.crypto_payments;

-- Note: Service role bypasses RLS automatically in Supabase
-- So we don't need a special policy for it. The user policies are sufficient
-- because webhooks will use the service role key which bypasses RLS.