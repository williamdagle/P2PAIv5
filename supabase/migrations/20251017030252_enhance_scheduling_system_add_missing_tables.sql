/*
  # Enhance Intelligent Scheduling System - Add Missing Infrastructure

  This migration enhances the existing provider_schedules table and creates
  the missing tables needed for the intelligent scheduling system.

  ## Changes to Existing Tables

  1. **provider_schedules** - Add missing columns
     - schedule_type (working_hours, break, blocked, admin_time)
     - notes
     - is_deleted flag

  ## New Tables Created

  2. **provider_schedule_exceptions** - One-time schedule overrides
  3. **appointment_buffers** - Multi-level buffer configuration
  4. **provider_appointment_preferences** - Provider preferences per appointment type
  5. **patient_scheduling_preferences** - Patient scheduling preferences

  ## Security
  - RLS enabled on all new tables
  - Clinic-scoped access control
  - Service role has full access

  ## Performance
  - Comprehensive indexes for query optimization

  ## Rollback
  - Use ROLLBACK-INTELLIGENT-SCHEDULING.sql if needed
*/

-- ========================================
-- ENHANCE: provider_schedules table
-- ========================================

-- Add schedule_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'provider_schedules' AND column_name = 'schedule_type'
  ) THEN
    ALTER TABLE provider_schedules 
    ADD COLUMN schedule_type text NOT NULL DEFAULT 'working_hours';
    
    ALTER TABLE provider_schedules
    ADD CONSTRAINT check_schedule_type 
    CHECK (schedule_type IN ('working_hours', 'break', 'blocked', 'admin_time'));
  END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'provider_schedules' AND column_name = 'notes'
  ) THEN
    ALTER TABLE provider_schedules ADD COLUMN notes text;
  END IF;
END $$;

-- Add is_deleted column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'provider_schedules' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE provider_schedules ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;

-- Add constraint for valid time range if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'provider_schedules' AND constraint_name = 'valid_time_range'
  ) THEN
    ALTER TABLE provider_schedules 
    ADD CONSTRAINT valid_time_range CHECK (end_time > start_time);
  END IF;
END $$;

-- ========================================
-- TABLE 2: provider_schedule_exceptions
-- ========================================

CREATE TABLE IF NOT EXISTS provider_schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean NOT NULL DEFAULT false,
  reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false,
  
  CONSTRAINT valid_exception_time_range CHECK (
    (is_available = false AND start_time IS NULL AND end_time IS NULL) OR
    (is_available = true AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

COMMENT ON TABLE provider_schedule_exceptions IS 'One-time schedule overrides for time off and special hours';

-- ========================================
-- TABLE 3: appointment_buffers
-- ========================================

CREATE TABLE IF NOT EXISTS appointment_buffers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  buffer_level text NOT NULL CHECK (
    buffer_level IN ('clinic_default', 'provider_specific', 'appointment_type_specific')
  ),
  provider_id uuid REFERENCES users(id) ON DELETE CASCADE,
  appointment_type_id uuid REFERENCES appointment_types(id) ON DELETE CASCADE,
  pre_appointment_buffer_minutes integer NOT NULL DEFAULT 0 CHECK (pre_appointment_buffer_minutes >= 0),
  post_appointment_buffer_minutes integer NOT NULL DEFAULT 0 CHECK (post_appointment_buffer_minutes >= 0),
  applies_to_back_to_back boolean DEFAULT true,
  priority integer NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT buffer_level_references CHECK (
    (buffer_level = 'clinic_default' AND provider_id IS NULL AND appointment_type_id IS NULL) OR
    (buffer_level = 'provider_specific' AND provider_id IS NOT NULL AND appointment_type_id IS NULL) OR
    (buffer_level = 'appointment_type_specific' AND appointment_type_id IS NOT NULL)
  )
);

COMMENT ON TABLE appointment_buffers IS 'Multi-level buffer configuration for appointments';

-- ========================================
-- TABLE 4: provider_appointment_preferences
-- ========================================

CREATE TABLE IF NOT EXISTS provider_appointment_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_type_id uuid NOT NULL REFERENCES appointment_types(id) ON DELETE CASCADE,
  preferred_time_of_day text CHECK (
    preferred_time_of_day IN ('morning', 'afternoon', 'evening', 'any')
  ),
  preferred_start_time time,
  preferred_end_time time,
  avoid_days integer[] DEFAULT ARRAY[]::integer[],
  preference_strength integer DEFAULT 5 CHECK (preference_strength >= 1 AND preference_strength <= 10),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_preference_time_range CHECK (
    (preferred_start_time IS NULL AND preferred_end_time IS NULL) OR
    (preferred_start_time IS NOT NULL AND preferred_end_time IS NOT NULL AND preferred_end_time > preferred_start_time)
  ),
  CONSTRAINT unique_provider_appointment_type UNIQUE (provider_id, appointment_type_id)
);

COMMENT ON TABLE provider_appointment_preferences IS 'Provider preferences for specific appointment types';

-- ========================================
-- TABLE 5: patient_scheduling_preferences
-- ========================================

CREATE TABLE IF NOT EXISTS patient_scheduling_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  preferred_time_of_day text CHECK (
    preferred_time_of_day IN ('morning', 'afternoon', 'evening', 'any')
  ),
  preferred_days integer[] DEFAULT ARRAY[]::integer[],
  avoid_days integer[] DEFAULT ARRAY[]::integer[],
  avoid_providers uuid[] DEFAULT ARRAY[]::uuid[],
  special_requirements text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_patient_preference UNIQUE (patient_id)
);

COMMENT ON TABLE patient_scheduling_preferences IS 'Patient-specific scheduling preferences';

-- ========================================
-- INDEXES for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_provider_schedules_provider_day 
  ON provider_schedules(provider_id, day_of_week) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_provider_schedules_provider_available 
  ON provider_schedules(provider_id, is_available, day_of_week) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_provider_date 
  ON provider_schedule_exceptions(provider_id, exception_date) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_appointment_buffers_clinic_level 
  ON appointment_buffers(clinic_id, buffer_level, is_active);

CREATE INDEX IF NOT EXISTS idx_appointment_buffers_active 
  ON appointment_buffers(clinic_id, is_active, priority DESC);

CREATE INDEX IF NOT EXISTS idx_provider_preferences_provider_type 
  ON provider_appointment_preferences(provider_id, appointment_type_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_provider_preferences_active 
  ON provider_appointment_preferences(clinic_id, is_active);

CREATE INDEX IF NOT EXISTS idx_patient_preferences_patient 
  ON patient_scheduling_preferences(patient_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
DO $$
BEGIN
  ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE provider_schedule_exceptions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE appointment_buffers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE provider_appointment_preferences ENABLE ROW LEVEL SECURITY;
  ALTER TABLE patient_scheduling_preferences ENABLE ROW LEVEL SECURITY;
END $$;

-- ========================================
-- RLS POLICIES: provider_schedules
-- ========================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view provider schedules in their clinic" ON provider_schedules;
  DROP POLICY IF EXISTS "Providers can manage own schedules" ON provider_schedules;
  DROP POLICY IF EXISTS "Clinic admins can manage provider schedules" ON provider_schedules;
  DROP POLICY IF EXISTS "Service role has full access to provider_schedules" ON provider_schedules;
END $$;

CREATE POLICY "Users can view provider schedules in their clinic"
  ON provider_schedules FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage own schedules"
  ON provider_schedules FOR ALL
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can manage provider schedules"
  ON provider_schedules FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  );

CREATE POLICY "Service role has full access to provider_schedules"
  ON provider_schedules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- RLS POLICIES: provider_schedule_exceptions
-- ========================================

CREATE POLICY "Users can view schedule exceptions in their clinic"
  ON provider_schedule_exceptions FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage own schedule exceptions"
  ON provider_schedule_exceptions FOR ALL
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can manage schedule exceptions"
  ON provider_schedule_exceptions FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  );

CREATE POLICY "Service role has full access to provider_schedule_exceptions"
  ON provider_schedule_exceptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- RLS POLICIES: appointment_buffers
-- ========================================

CREATE POLICY "Users can view appointment buffers in their clinic"
  ON appointment_buffers FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can manage appointment buffers"
  ON appointment_buffers FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  );

CREATE POLICY "Service role has full access to appointment_buffers"
  ON appointment_buffers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- RLS POLICIES: provider_appointment_preferences
-- ========================================

CREATE POLICY "Users can view provider preferences in their clinic"
  ON provider_appointment_preferences FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage own preferences"
  ON provider_appointment_preferences FOR ALL
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can manage provider preferences"
  ON provider_appointment_preferences FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role_id IN (SELECT id FROM roles WHERE name IN ('clinic_admin', 'system_admin'))
    )
  );

CREATE POLICY "Service role has full access to provider_appointment_preferences"
  ON provider_appointment_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- RLS POLICIES: patient_scheduling_preferences
-- ========================================

CREATE POLICY "Users can view scheduling preferences in their clinic"
  ON patient_scheduling_preferences FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage scheduling preferences in their clinic"
  ON patient_scheduling_preferences FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to patient_scheduling_preferences"
  ON patient_scheduling_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
