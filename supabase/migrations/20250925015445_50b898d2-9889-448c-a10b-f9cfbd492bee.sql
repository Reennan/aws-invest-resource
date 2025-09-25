-- SECURITY FIX: Remove public access to password reset tokens
-- This prevents attackers from viewing valid tokens and hijacking accounts

-- Drop the insecure public policy
DROP POLICY IF EXISTS "Anyone can validate password reset tokens" ON public.password_reset_tokens;

-- Add secure policy: only the service role can access tokens (used by edge functions)
-- No RLS policy needed since edge function uses service role key which bypasses RLS
-- This ensures only our backend can validate tokens, not public users

-- Add additional security: ensure tokens are unique and add index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);