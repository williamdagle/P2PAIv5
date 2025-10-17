/*
  # Phase 1: HIPAA Audit Infrastructure - Authentication & Session Tracking
  
  Replaces basic audit_logs table with comprehensive HIPAA-compliant audit system.
  Designed for minimal performance impact and zero disruption to existing RLS policies.

  ## Changes
  1. Drop old audit_logs table (basic change tracking)
  2. Create new audit_logs table (HIPAA-compliant comprehensive tracking)
  3. Create authentication_events table (login/logout tracking)
  4. Create user_sessions table (session lifecycle tracking)

  ## Security
  - RLS enabled on all tables
  - Users can insert their own records
  - Users can view their own records
  - Simple, non-recursive policies
*/

-- =====================================================
-- 1. Drop old audit_logs table if exists
-- =====================================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- =====================================================
-- 2. Create new audit_logs table (HIPAA-compliant)
-- =====================================================
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    auth_user_id uuid,
    clinic_id uuid,
    event_type text NOT NULL CHECK (event_type IN ('authentication', 'data_access', 'data_modification', 'security', 'system')),
    event_action text NOT NULL,
    resource_type text,
    resource_id uuid,
    ip_address inet,
    user_agent text,
    request_metadata jsonb DEFAULT '{}'::jsonb,
    phi_accessed boolean DEFAULT false,
    severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    timestamp timestamptz NOT NULL DEFAULT now(),
    session_id uuid
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_auth_user_id ON public.audit_logs(auth_user_id);
CREATE INDEX idx_audit_logs_clinic_id ON public.audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING BRIN (timestamp);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_session_id ON public.audit_logs(session_id);
CREATE INDEX idx_audit_logs_phi_accessed ON public.audit_logs(phi_accessed) WHERE phi_accessed = true;

-- =====================================================
-- 3. Create authentication_events table
-- =====================================================
CREATE TABLE public.authentication_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    auth_user_id uuid,
    event_type text NOT NULL CHECK (event_type IN ('login_success', 'login_failure', 'logout', 'password_reset_request', 'password_reset_complete', 'mfa_enabled', 'mfa_disabled', 'session_timeout', 'forced_logout')),
    ip_address inet,
    user_agent text,
    failure_reason text,
    session_id uuid,
    timestamp timestamptz NOT NULL DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_authentication_events_email ON public.authentication_events(email);
CREATE INDEX idx_authentication_events_auth_user_id ON public.authentication_events(auth_user_id);
CREATE INDEX idx_authentication_events_event_type ON public.authentication_events(event_type);
CREATE INDEX idx_authentication_events_timestamp ON public.authentication_events USING BRIN (timestamp);
CREATE INDEX idx_authentication_events_login_failures ON public.authentication_events(email, timestamp) WHERE event_type = 'login_failure';

-- =====================================================
-- 4. Create user_sessions table
-- =====================================================
CREATE TABLE public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    auth_user_id uuid NOT NULL,
    clinic_id uuid,
    session_start timestamptz NOT NULL DEFAULT now(),
    session_end timestamptz,
    last_activity timestamptz NOT NULL DEFAULT now(),
    ip_address inet,
    user_agent text,
    phi_accessed boolean DEFAULT false,
    phi_access_count integer DEFAULT 0,
    forced_logout boolean DEFAULT false,
    logout_reason text CHECK (logout_reason IN ('user_initiated', 'timeout', 'forced', 'concurrent_session', 'security_policy', 'system')),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_auth_user_id ON public.user_sessions(auth_user_id);
CREATE INDEX idx_user_sessions_clinic_id ON public.user_sessions(clinic_id);
CREATE INDEX idx_user_sessions_session_start ON public.user_sessions USING BRIN (session_start);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(auth_user_id) WHERE session_end IS NULL;

-- =====================================================
-- 5. Enable RLS
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authentication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS Policies - audit_logs
-- =====================================================

CREATE POLICY "audit_logs_insert_own"
    ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "audit_logs_select_own"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

-- =====================================================
-- 7. RLS Policies - authentication_events  
-- =====================================================

CREATE POLICY "auth_events_insert_any"
    ON public.authentication_events FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "auth_events_select_own"
    ON public.authentication_events FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

-- =====================================================
-- 8. RLS Policies - user_sessions
-- =====================================================

CREATE POLICY "sessions_insert_own"
    ON public.user_sessions FOR INSERT TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "sessions_update_own"
    ON public.user_sessions FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "sessions_select_own"
    ON public.user_sessions FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

-- =====================================================
-- 9. Comments for documentation
-- =====================================================
COMMENT ON TABLE public.audit_logs IS 'HIPAA-compliant master audit log tracking all system events, PHI access, and user actions';
COMMENT ON TABLE public.authentication_events IS 'Authentication event tracking for login attempts, successes, failures, and logouts';
COMMENT ON TABLE public.user_sessions IS 'User session lifecycle tracking for monitoring active sessions, duration, and PHI access patterns';

COMMENT ON COLUMN public.audit_logs.phi_accessed IS 'HIPAA flag indicating if Protected Health Information was accessed';
COMMENT ON COLUMN public.audit_logs.severity IS 'Event severity level for security monitoring and alerting';
COMMENT ON COLUMN public.user_sessions.phi_access_count IS 'Number of PHI records accessed during session for audit reporting';
