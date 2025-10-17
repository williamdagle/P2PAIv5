/*
  # Resource Management System

  1. New Tables
    - `resource_types`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `organization_id` (uuid, references organizations)
      - `name` (text) - e.g., "IV Chair", "Group Session", "Equipment"
      - `description` (text)
      - `capacity_type` (text) - 'single' or 'multi'
      - `default_capacity` (integer) - max bookings per time slot
      - `default_duration_minutes` (integer)
      - `default_buffer_minutes` (integer) - time between bookings
      - `booking_window_days` (integer) - how far in advance bookings allowed
      - `requires_approval` (boolean)
      - `approval_roles` (jsonb) - array of role IDs that can approve
      - `portal_visible` (boolean) - show in patient portal
      - `portal_bookable` (boolean) - allow portal bookings
      - `attributes` (jsonb) - custom attributes for filtering
      - `color_code` (text) - for calendar display
      - `is_active` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `resources`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `resource_type_id` (uuid, references resource_types)
      - `name` (text) - e.g., "IV Chair 1", "Weight Loss Support Group"
      - `description` (text)
      - `location` (text)
      - `capacity_override` (integer) - null uses type default
      - `booking_instructions` (text) - patient-facing instructions
      - `internal_notes` (text) - staff notes
      - `availability_schedule` (jsonb) - recurring availability patterns
      - `booking_rules` (jsonb) - custom rules and restrictions
      - `provider_id` (uuid, references users) - assigned provider if applicable
      - `is_active` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `resource_bookings`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `resource_id` (uuid, references resources)
      - `patient_id` (uuid, references patients)
      - `booked_by_user_id` (uuid, references users) - who created the booking
      - `booking_date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `duration_minutes` (integer)
      - `status` (text) - 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
      - `booking_source` (text) - 'staff', 'patient_portal', 'api'
      - `notes` (text)
      - `cancellation_reason` (text)
      - `cancelled_at` (timestamptz)
      - `cancelled_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `resource_blackouts`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `resource_id` (uuid, references resources)
      - `blackout_date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `reason` (text) - "Maintenance", "Holiday", etc.
      - `is_recurring` (boolean)
      - `recurrence_pattern` (jsonb)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users within same clinic
    - Add policies for service role (API access)
*/

-- Resource Types Table
CREATE TABLE IF NOT EXISTS resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity_type TEXT NOT NULL DEFAULT 'single' CHECK (capacity_type IN ('single', 'multi')),
  default_capacity INTEGER NOT NULL DEFAULT 1,
  default_duration_minutes INTEGER NOT NULL DEFAULT 60,
  default_buffer_minutes INTEGER NOT NULL DEFAULT 0,
  booking_window_days INTEGER NOT NULL DEFAULT 30,
  requires_approval BOOLEAN DEFAULT false,
  approval_roles JSONB DEFAULT '[]'::jsonb,
  portal_visible BOOLEAN DEFAULT true,
  portal_bookable BOOLEAN DEFAULT true,
  attributes JSONB DEFAULT '{}'::jsonb,
  color_code TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  resource_type_id UUID NOT NULL REFERENCES resource_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  capacity_override INTEGER,
  booking_instructions TEXT,
  internal_notes TEXT,
  availability_schedule JSONB DEFAULT '{}'::jsonb,
  booking_rules JSONB DEFAULT '{}'::jsonb,
  provider_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resource Bookings Table
CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  booked_by_user_id UUID REFERENCES users(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  booking_source TEXT NOT NULL DEFAULT 'staff' CHECK (booking_source IN ('staff', 'patient_portal', 'api')),
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resource Blackouts Table
CREATE TABLE IF NOT EXISTS resource_blackouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  blackout_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_types_clinic ON resource_types(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resource_types_org ON resource_types(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resources_clinic ON resources(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resource_bookings_resource_date ON resource_bookings(resource_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_patient ON resource_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_clinic_date ON resource_bookings(clinic_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_resource_blackouts_resource_date ON resource_blackouts(resource_id, blackout_date);

-- Enable RLS
ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_blackouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_types
CREATE POLICY "Users can view resource types in their clinic"
  ON resource_types FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage resource types"
  ON resource_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to resource_types"
  ON resource_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resources
CREATE POLICY "Users can view resources in their clinic"
  ON resources FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage resources"
  ON resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to resources"
  ON resources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resource_bookings
CREATE POLICY "Users can view bookings in their clinic"
  ON resource_bookings FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create bookings in their clinic"
  ON resource_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update bookings in their clinic"
  ON resource_bookings FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to resource_bookings"
  ON resource_bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resource_blackouts
CREATE POLICY "Users can view blackouts in their clinic"
  ON resource_blackouts FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage blackouts"
  ON resource_blackouts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to resource_blackouts"
  ON resource_blackouts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);