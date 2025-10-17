/*
  # Seed Default Scheduling Data

  This migration seeds the scheduling system with sensible defaults for all existing providers and clinics.

  ## What Gets Created

  1. **Default Clinic Buffers** - 5 minutes pre, 10 minutes post for all clinics
  2. **Standard Work Hours** - Monday-Friday 9:00 AM - 5:00 PM for all active providers
  3. **Lunch Breaks** - 12:00 PM - 1:00 PM Monday-Friday for all active providers

  ## Notes
  - Only creates schedules for providers who don't already have them
  - Only creates buffers for clinics that don't already have them
  - Safe to run multiple times (idempotent)
  - Can be customized after initial setup
*/

-- ========================================
-- 1. Create Default Clinic Buffers
-- ========================================

DO $$
DECLARE
  clinic_rec RECORD;
BEGIN
  FOR clinic_rec IN SELECT id FROM clinics
  LOOP
    -- Check if clinic already has a default buffer
    IF NOT EXISTS (
      SELECT 1 FROM appointment_buffers 
      WHERE clinic_id = clinic_rec.id 
      AND buffer_level = 'clinic_default'
      AND is_active = true
    ) THEN
      -- Create default clinic buffer: 5 min pre, 10 min post
      INSERT INTO appointment_buffers (
        clinic_id,
        buffer_level,
        pre_appointment_buffer_minutes,
        post_appointment_buffer_minutes,
        applies_to_back_to_back,
        priority,
        is_active,
        notes
      ) VALUES (
        clinic_rec.id,
        'clinic_default',
        5,
        10,
        true,
        1,
        true,
        'Default clinic buffer - automatically created during system setup'
      );
      
      RAISE NOTICE 'Created default buffer for clinic: %', clinic_rec.id;
    END IF;
  END LOOP;
END $$;

-- ========================================
-- 2. Create Standard Work Hours for All Providers
-- ========================================

DO $$
DECLARE
  provider_rec RECORD;
  day_num integer;
BEGIN
  -- Get all active providers (those with Provider role or who can see appointments)
  FOR provider_rec IN 
    SELECT DISTINCT u.id, u.clinic_id, u.full_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE r.name IN ('Provider', 'clinic_admin', 'system_admin')
  LOOP
    -- Check if provider already has a schedule
    IF NOT EXISTS (
      SELECT 1 FROM provider_schedules 
      WHERE provider_id = provider_rec.id
      AND is_deleted = false
    ) THEN
      -- Create Monday-Friday 9 AM - 5 PM schedule
      FOR day_num IN 1..5 LOOP  -- 1=Monday through 5=Friday
        INSERT INTO provider_schedules (
          clinic_id,
          provider_id,
          day_of_week,
          start_time,
          end_time,
          is_available,
          schedule_type,
          notes
        ) VALUES (
          provider_rec.clinic_id,
          provider_rec.id,
          day_num,
          '09:00:00'::time,
          '17:00:00'::time,
          true,
          'working_hours',
          'Default work hours - automatically created during system setup'
        );
      END LOOP;
      
      RAISE NOTICE 'Created default schedule for provider: % (%)', provider_rec.full_name, provider_rec.id;
    END IF;
  END LOOP;
END $$;

-- ========================================
-- 3. Create Lunch Breaks for All Providers
-- ========================================

DO $$
DECLARE
  provider_rec RECORD;
  day_num integer;
BEGIN
  -- Get all active providers who have schedules
  FOR provider_rec IN 
    SELECT DISTINCT ps.provider_id, ps.clinic_id, u.full_name
    FROM provider_schedules ps
    INNER JOIN users u ON ps.provider_id = u.id
    WHERE ps.is_deleted = false
    AND ps.is_available = true
  LOOP
    -- Check if provider already has lunch break configured
    IF NOT EXISTS (
      SELECT 1 FROM provider_schedules 
      WHERE provider_id = provider_rec.provider_id
      AND schedule_type = 'break'
      AND is_deleted = false
    ) THEN
      -- Create Monday-Friday 12 PM - 1 PM lunch break
      FOR day_num IN 1..5 LOOP  -- 1=Monday through 5=Friday
        -- Only add lunch break if provider works on this day
        IF EXISTS (
          SELECT 1 FROM provider_schedules
          WHERE provider_id = provider_rec.provider_id
          AND day_of_week = day_num
          AND is_available = true
          AND schedule_type = 'working_hours'
          AND is_deleted = false
        ) THEN
          INSERT INTO provider_schedules (
            clinic_id,
            provider_id,
            day_of_week,
            start_time,
            end_time,
            is_available,
            schedule_type,
            notes
          ) VALUES (
            provider_rec.clinic_id,
            provider_rec.provider_id,
            day_num,
            '12:00:00'::time,
            '13:00:00'::time,
            false,  -- Not available during break
            'break',
            'Default lunch break - automatically created during system setup'
          );
        END IF;
      END LOOP;
      
      RAISE NOTICE 'Created lunch breaks for provider: % (%)', provider_rec.full_name, provider_rec.provider_id;
    END IF;
  END LOOP;
END $$;

-- ========================================
-- Summary Report
-- ========================================

SELECT 
  'Scheduling System Seed Complete' as status,
  (SELECT COUNT(*) FROM appointment_buffers WHERE buffer_level = 'clinic_default') as clinic_buffers_created,
  (SELECT COUNT(DISTINCT provider_id) FROM provider_schedules WHERE schedule_type = 'working_hours') as providers_with_schedules,
  (SELECT COUNT(DISTINCT provider_id) FROM provider_schedules WHERE schedule_type = 'break') as providers_with_breaks;
