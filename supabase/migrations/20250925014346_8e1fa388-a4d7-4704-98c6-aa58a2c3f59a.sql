-- Create password reset tokens table for password reset functionality
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password reset tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for password reset tokens (public access for validation)
CREATE POLICY "Anyone can validate password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (expires_at > now() AND used = false);

-- Add trigger to clean up expired tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() - INTERVAL '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_tokens_trigger
AFTER INSERT ON public.password_reset_tokens
FOR EACH ROW EXECUTE FUNCTION clean_expired_tokens();