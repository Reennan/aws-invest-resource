-- Add RLS policies to secure password_reset_tokens table
-- This prevents unauthorized access to sensitive password reset tokens

-- Policy to allow only service role (used by edge functions) to access tokens
CREATE POLICY "Service role can access password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy to block all other access (anonymous and authenticated users)
-- This policy explicitly denies access to regular users
CREATE POLICY "Block user access to password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
TO authenticated, anon
USING (false) 
WITH CHECK (false);