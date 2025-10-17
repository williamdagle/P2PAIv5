/*
  # Fix Authentication Logging Permissions
  
  This migration fixes permission issues preventing authentication event logging.
  
  ## Changes
  1. Grant INSERT permission to anon role on authentication_events (for login failures before auth)
  2. Grant ALL permissions to service_role on all audit tables
  3. Ensure proper grants exist for audit logging infrastructure
  
  ## Security
  - RLS remains enabled on all tables
  - Service role bypasses RLS for system logging
  - Anon role can only insert (for pre-auth logging), not read
  - Authenticated users follow existing RLS policies
*/

-- Grant INSERT to anon role for authentication_events (needed for login failures)
GRANT INSERT ON public.authentication_events TO anon;

-- Grant full permissions to service_role on all audit tables
GRANT ALL ON public.authentication_events TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.user_sessions TO service_role;

-- Ensure authenticated role has proper permissions
GRANT INSERT, SELECT, UPDATE ON public.audit_logs TO authenticated;
GRANT INSERT, SELECT, UPDATE ON public.user_sessions TO authenticated;

-- Add comment
COMMENT ON TABLE public.authentication_events IS 'Authentication event tracking - anon can INSERT for pre-auth logging, service_role bypasses RLS';
