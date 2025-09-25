-- Fix function search path issue
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() - INTERVAL '1 day';
  RETURN NEW;
END;
$$;