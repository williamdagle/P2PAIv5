/*
  # Fix Service Role Access to Scheduling Tables

  This migration ensures that the service role (used by edge functions) has
  unrestricted access to all scheduling tables, bypassing RLS.

  ## Problem
  Edge functions are getting "permission denied" errors even though service_role
  policies exist. This is because:
  1. There might be conflicting policies
  2. Service role needs explicit GRANT permissions
  3. RLS might be enforced even for service role in some cases

  ## Solution
  1. Explicitly GRANT all permissions to service_role
  2. Ensure service_role policies are permissive
  3. Verify no restrictive policies conflict
*/

-- ========================================
-- GRANT Direct Table Access to Service Role
-- ========================================

-- Grant full access to service_role on all scheduling tables
GRANT ALL ON TABLE provider_schedules TO service_role;
GRANT ALL ON TABLE provider_schedule_exceptions TO service_role;
GRANT ALL ON TABLE appointment_buffers TO service_role;
GRANT ALL ON TABLE provider_appointment_preferences TO service_role;
GRANT ALL ON TABLE patient_scheduling_preferences TO service_role;

-- Also grant on related tables that edge functions query
GRANT SELECT ON TABLE users TO service_role;
GRANT SELECT ON TABLE roles TO service_role;
GRANT SELECT ON TABLE clinics TO service_role;
GRANT SELECT ON TABLE appointments TO service_role;
GRANT SELECT ON TABLE appointment_types TO service_role;
GRANT SELECT ON TABLE patients TO service_role;

-- Grant usage on sequences if they exist
DO $$
BEGIN
  -- This is safe even if sequences don't exist
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ========================================
-- Verify Service Role Policies are Permissive
-- ========================================

-- Drop and recreate service role policies to ensure they're truly permissive
DO $$
BEGIN
  -- provider_schedules
  DROP POLICY IF EXISTS "Service role has full access to provider_schedules" ON provider_schedules;
  CREATE POLICY "Service role has full access to provider_schedules"
    ON provider_schedules
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  -- provider_schedule_exceptions
  DROP POLICY IF EXISTS "Service role has full access to provider_schedule_exceptions" ON provider_schedule_exceptions;
  CREATE POLICY "Service role has full access to provider_schedule_exceptions"
    ON provider_schedule_exceptions
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  -- appointment_buffers
  DROP POLICY IF EXISTS "Service role has full access to appointment_buffers" ON appointment_buffers;
  CREATE POLICY "Service role has full access to appointment_buffers"
    ON appointment_buffers
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  -- provider_appointment_preferences
  DROP POLICY IF EXISTS "Service role has full access to provider_appointment_preferences" ON provider_appointment_preferences;
  CREATE POLICY "Service role has full access to provider_appointment_preferences"
    ON provider_appointment_preferences
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  -- patient_scheduling_preferences
  DROP POLICY IF EXISTS "Service role has full access to patient_scheduling_preferences" ON patient_scheduling_preferences;
  CREATE POLICY "Service role has full access to patient_scheduling_preferences"
    ON patient_scheduling_preferences
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  RAISE NOTICE 'All service role policies recreated successfully';
END $$;

-- ========================================
-- Verification Queries
-- ========================================

-- Check that service_role has the correct permissions
SELECT 
  'Service Role Permissions Check' as check_name,
  schemaname,
  tablename,
  HAS_TABLE_PRIVILEGE('service_role', schemaname || '.' || tablename, 'SELECT') as can_select,
  HAS_TABLE_PRIVILEGE('service_role', schemaname || '.' || tablename, 'INSERT') as can_insert,
  HAS_TABLE_PRIVILEGE('service_role', schemaname || '.' || tablename, 'UPDATE') as can_update,
  HAS_TABLE_PRIVILEGE('service_role', schemaname || '.' || tablename, 'DELETE') as can_delete
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'provider_schedules',
  'provider_schedule_exceptions', 
  'appointment_buffers',
  'provider_appointment_preferences',
  'patient_scheduling_preferences'
)
ORDER BY tablename;

-- Check service role policies exist
SELECT 
  'Service Role Policies Check' as check_name,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN (
  'provider_schedules',
  'provider_schedule_exceptions',
  'appointment_buffers',
  'provider_appointment_preferences',
  'patient_scheduling_preferences'
)
AND roles::text LIKE '%service_role%'
ORDER BY tablename;
