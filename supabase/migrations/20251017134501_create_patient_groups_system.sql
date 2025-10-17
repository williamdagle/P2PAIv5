/*
  # Patient Groups Management System

  1. New Tables
    - `patient_groups`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `organization_id` (uuid, references organizations)
      - `name` (text) - e.g., "Weight Loss Support Group - CA"
      - `description` (text)
      - `group_type` (text) - 'support', 'therapy', 'education', 'wellness', 'other'
      - `state_restrictions` (jsonb) - array of state codes this group is for
      - `eligibility_criteria` (jsonb) - criteria patients must meet
      - `session_frequency` (text) - 'weekly', 'biweekly', 'monthly', 'custom'
      - `session_duration_minutes` (integer)
      - `resource_id` (uuid, references resources) - linked resource for sessions
      - `provider_id` (uuid, references users) - facilitator
      - `max_members` (integer) - null for no limit
      - `current_member_count` (integer) - cached count
      - `status` (text) - 'forming', 'active', 'completed', 'archived'
      - `start_date` (date)
      - `end_date` (date)
      - `portal_visible` (boolean) - show in patient portal
      - `allow_self_enrollment` (boolean)
      - `requires_individual_session` (boolean) - prerequisite
      - `group_materials` (jsonb) - resources and documents
      - `communication_settings` (jsonb)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `patient_group_assignments`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `patient_id` (uuid, references patients)
      - `group_id` (uuid, references patient_groups)
      - `assignment_date` (date)
      - `assigned_by` (uuid, references users)
      - `status` (text) - 'active', 'completed', 'withdrawn', 'removed'
      - `withdrawal_date` (date)
      - `withdrawal_reason` (text)
      - `individual_session_completed` (boolean) - track prerequisite
      - `individual_session_date` (date)
      - `sessions_attended` (integer) - count
      - `last_attendance_date` (date)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `group_session_attendance`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `group_id` (uuid, references patient_groups)
      - `resource_booking_id` (uuid, references resource_bookings)
      - `patient_id` (uuid, references patients)
      - `session_date` (date)
      - `attended` (boolean)
      - `attendance_notes` (text)
      - `marked_by` (uuid, references users)
      - `marked_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users within same clinic
    - Add policies for service role (Patient Portal API access)
*/

-- Patient Groups Table
CREATE TABLE IF NOT EXISTS patient_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL DEFAULT 'support' CHECK (group_type IN ('support', 'therapy', 'education', 'wellness', 'other')),
  state_restrictions JSONB DEFAULT '[]'::jsonb,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  session_frequency TEXT DEFAULT 'weekly',
  session_duration_minutes INTEGER DEFAULT 60,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_members INTEGER,
  current_member_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  portal_visible BOOLEAN DEFAULT true,
  allow_self_enrollment BOOLEAN DEFAULT false,
  requires_individual_session BOOLEAN DEFAULT false,
  group_materials JSONB DEFAULT '[]'::jsonb,
  communication_settings JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Group Assignments Table
CREATE TABLE IF NOT EXISTS patient_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES patient_groups(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn', 'removed')),
  withdrawal_date DATE,
  withdrawal_reason TEXT,
  individual_session_completed BOOLEAN DEFAULT false,
  individual_session_date DATE,
  sessions_attended INTEGER DEFAULT 0,
  last_attendance_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, group_id)
);

-- Group Session Attendance Table
CREATE TABLE IF NOT EXISTS group_session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES patient_groups(id) ON DELETE CASCADE,
  resource_booking_id UUID REFERENCES resource_bookings(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  attended BOOLEAN DEFAULT false,
  attendance_notes TEXT,
  marked_by UUID REFERENCES users(id),
  marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, resource_booking_id, patient_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_groups_clinic ON patient_groups(clinic_id) WHERE status IN ('forming', 'active');
CREATE INDEX IF NOT EXISTS idx_patient_groups_resource ON patient_groups(resource_id);
CREATE INDEX IF NOT EXISTS idx_patient_groups_states ON patient_groups USING GIN (state_restrictions);
CREATE INDEX IF NOT EXISTS idx_group_assignments_patient ON patient_group_assignments(patient_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_group_assignments_group ON patient_group_assignments(group_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_group_attendance_booking ON group_session_attendance(resource_booking_id);
CREATE INDEX IF NOT EXISTS idx_group_attendance_patient ON group_session_attendance(patient_id);

-- Function to update current_member_count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE patient_groups
    SET current_member_count = (
      SELECT COUNT(*)
      FROM patient_group_assignments
      WHERE group_id = NEW.group_id
      AND status = 'active'
    )
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE patient_groups
    SET current_member_count = (
      SELECT COUNT(*)
      FROM patient_group_assignments
      WHERE group_id = OLD.group_id
      AND status = 'active'
    )
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep member count updated
CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR UPDATE OR DELETE ON patient_group_assignments
FOR EACH ROW
EXECUTE FUNCTION update_group_member_count();

-- Enable RLS
ALTER TABLE patient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_groups
CREATE POLICY "Users can view groups in their clinic"
  ON patient_groups FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage groups"
  ON patient_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to patient_groups"
  ON patient_groups FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for patient_group_assignments
CREATE POLICY "Users can view assignments in their clinic"
  ON patient_group_assignments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create assignments in their clinic"
  ON patient_group_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update assignments in their clinic"
  ON patient_group_assignments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to patient_group_assignments"
  ON patient_group_assignments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for group_session_attendance
CREATE POLICY "Users can view attendance in their clinic"
  ON group_session_attendance FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage attendance in their clinic"
  ON group_session_attendance FOR ALL
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to group_session_attendance"
  ON group_session_attendance FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);