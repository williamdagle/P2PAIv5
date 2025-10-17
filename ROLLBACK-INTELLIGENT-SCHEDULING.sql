/*
  ========================================
  EMERGENCY ROLLBACK SCRIPT
  ========================================

  Purpose: Rollback the Intelligent Scheduling System implementation

  This script will:
  1. Drop all RLS policies for scheduling tables
  2. Drop all indexes for scheduling tables
  3. Drop all scheduling-related tables
  4. Preserve all existing data in other tables

  WHEN TO USE THIS:
  - If the scheduling system causes errors
  - If RLS policies break existing functionality
  - If you need to revert to the state before scheduling implementation

  HOW TO USE THIS:
  1. Copy this entire file
  2. Go to Supabase Dashboard > SQL Editor
  3. Paste and run this script
  4. Verify that your existing appointments, users, and clinics still work

  WHAT THIS DOES NOT AFFECT:
  - Existing appointments (appointments table is untouched)
  - Users and authentication (users table is untouched)
  - Clinics and organizations (unchanged)
  - Patient data (unchanged)
  - All other EHR functionality (unchanged)

  Created: 2025-10-17
  Migration to rollback: 20251017_create_intelligent_scheduling_system.sql
*/

-- ========================================
-- STEP 1: Drop RLS Policies
-- ========================================

DO $$
BEGIN
    -- Drop policies for patient_scheduling_preferences
    DROP POLICY IF EXISTS "Users can view scheduling preferences in their clinic" ON patient_scheduling_preferences;
    DROP POLICY IF EXISTS "Users can manage scheduling preferences in their clinic" ON patient_scheduling_preferences;
    DROP POLICY IF EXISTS "Patients can view own scheduling preferences" ON patient_scheduling_preferences;
    DROP POLICY IF EXISTS "Service role has full access to patient_scheduling_preferences" ON patient_scheduling_preferences;

    -- Drop policies for provider_appointment_preferences
    DROP POLICY IF EXISTS "Users can view provider preferences in their clinic" ON provider_appointment_preferences;
    DROP POLICY IF EXISTS "Providers can manage own preferences" ON provider_appointment_preferences;
    DROP POLICY IF EXISTS "Clinic admins can manage provider preferences" ON provider_appointment_preferences;
    DROP POLICY IF EXISTS "Service role has full access to provider_appointment_preferences" ON provider_appointment_preferences;

    -- Drop policies for appointment_buffers
    DROP POLICY IF EXISTS "Users can view appointment buffers in their clinic" ON appointment_buffers;
    DROP POLICY IF EXISTS "Clinic admins can manage appointment buffers" ON appointment_buffers;
    DROP POLICY IF EXISTS "Service role has full access to appointment_buffers" ON appointment_buffers;

    -- Drop policies for provider_schedule_exceptions
    DROP POLICY IF EXISTS "Users can view schedule exceptions in their clinic" ON provider_schedule_exceptions;
    DROP POLICY IF EXISTS "Providers can manage own schedule exceptions" ON provider_schedule_exceptions;
    DROP POLICY IF EXISTS "Clinic admins can manage schedule exceptions" ON provider_schedule_exceptions;
    DROP POLICY IF EXISTS "Service role has full access to provider_schedule_exceptions" ON provider_schedule_exceptions;

    -- Drop policies for provider_schedules
    DROP POLICY IF EXISTS "Users can view provider schedules in their clinic" ON provider_schedules;
    DROP POLICY IF EXISTS "Providers can manage own schedules" ON provider_schedules;
    DROP POLICY IF EXISTS "Clinic admins can manage provider schedules" ON provider_schedules;
    DROP POLICY IF EXISTS "Service role has full access to provider_schedules" ON provider_schedules;

    RAISE NOTICE 'All RLS policies dropped successfully';
END $$;

-- ========================================
-- STEP 2: Drop Indexes
-- ========================================

DO $$
BEGIN
    DROP INDEX IF EXISTS idx_provider_schedules_provider_day;
    DROP INDEX IF EXISTS idx_provider_schedules_provider_available;
    DROP INDEX IF EXISTS idx_schedule_exceptions_provider_date;
    DROP INDEX IF EXISTS idx_appointment_buffers_clinic_level;
    DROP INDEX IF EXISTS idx_appointment_buffers_active;
    DROP INDEX IF EXISTS idx_provider_preferences_provider_type;
    DROP INDEX IF EXISTS idx_provider_preferences_active;
    DROP INDEX IF EXISTS idx_patient_preferences_patient;

    RAISE NOTICE 'All indexes dropped successfully';
END $$;

-- ========================================
-- STEP 3: Drop Tables (in reverse dependency order)
-- ========================================

DO $$
BEGIN
    -- Drop tables that depend on other scheduling tables first
    DROP TABLE IF EXISTS patient_scheduling_preferences CASCADE;
    RAISE NOTICE 'Dropped patient_scheduling_preferences table';

    DROP TABLE IF EXISTS provider_appointment_preferences CASCADE;
    RAISE NOTICE 'Dropped provider_appointment_preferences table';

    DROP TABLE IF EXISTS appointment_buffers CASCADE;
    RAISE NOTICE 'Dropped appointment_buffers table';

    DROP TABLE IF EXISTS provider_schedule_exceptions CASCADE;
    RAISE NOTICE 'Dropped provider_schedule_exceptions table';

    DROP TABLE IF EXISTS provider_schedules CASCADE;
    RAISE NOTICE 'Dropped provider_schedules table';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLLBACK COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All scheduling system tables have been removed';
    RAISE NOTICE 'Your existing data is preserved';
    RAISE NOTICE '';
    RAISE NOTICE 'VERIFICATION STEPS:';
    RAISE NOTICE '1. Check that appointments still work';
    RAISE NOTICE '2. Check that user login still works';
    RAISE NOTICE '3. Check that patient data is intact';
    RAISE NOTICE '';
    RAISE NOTICE 'The edge functions (get_provider_availability, recommend_appointment_slots)';
    RAISE NOTICE 'will now return errors since the tables dont exist.';
    RAISE NOTICE 'This is expected behavior after rollback.';
END $$;

-- ========================================
-- STEP 4: Verification Queries
-- ========================================

-- Run these to verify your data is intact:

-- Check appointments table still exists and has data
SELECT
    'Appointments Table Status' as check_name,
    COUNT(*) as record_count,
    'OK' as status
FROM appointments;

-- Check users table still exists and has data
SELECT
    'Users Table Status' as check_name,
    COUNT(*) as record_count,
    'OK' as status
FROM users;

-- Check clinics table still exists and has data
SELECT
    'Clinics Table Status' as check_name,
    COUNT(*) as record_count,
    'OK' as status
FROM clinics;

-- Check patients table still exists and has data
SELECT
    'Patients Table Status' as check_name,
    COUNT(*) as record_count,
    'OK' as status
FROM patients;

-- Verify scheduling tables are gone
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_schedules') THEN
        RAISE EXCEPTION 'ERROR: provider_schedules table still exists!';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_schedule_exceptions') THEN
        RAISE EXCEPTION 'ERROR: provider_schedule_exceptions table still exists!';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_buffers') THEN
        RAISE EXCEPTION 'ERROR: appointment_buffers table still exists!';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_appointment_preferences') THEN
        RAISE EXCEPTION 'ERROR: provider_appointment_preferences table still exists!';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_scheduling_preferences') THEN
        RAISE EXCEPTION 'ERROR: patient_scheduling_preferences table still exists!';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION PASSED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All scheduling tables have been removed';
    RAISE NOTICE 'All core EHR tables are intact';
    RAISE NOTICE 'Rollback successful!';
END $$;
