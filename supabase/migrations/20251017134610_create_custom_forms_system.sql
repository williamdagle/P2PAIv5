/*
  # Custom Forms System

  1. New Tables
    - `form_definitions`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `organization_id` (uuid, references organizations)
      - `form_name` (text) - e.g., "Patient Intake Form"
      - `form_code` (text) - unique identifier for programmatic use
      - `category` (text) - 'intake', 'consent', 'assessment', 'survey', 'other'
      - `description` (text)
      - `is_active` (boolean)
      - `is_published` (boolean)
      - `current_version_id` (uuid) - references form_versions
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `form_versions`
      - `id` (uuid, primary key)
      - `form_definition_id` (uuid, references form_definitions)
      - `version_number` (integer)
      - `version_name` (text) - e.g., "v2.0 - California Compliance Update"
      - `form_schema` (jsonb) - complete form structure with fields, validations, conditional logic
      - `state_codes` (jsonb) - array of state codes this version applies to
      - `effective_date` (date)
      - `expiration_date` (date)
      - `change_summary` (text)
      - `is_current` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)

    - `form_field_library`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `organization_id` (uuid, references organizations)
      - `field_name` (text)
      - `field_type` (text) - 'text', 'email', 'phone', 'date', 'dropdown', 'checkbox', 'radio', 'signature', 'file_upload', 'textarea'
      - `field_config` (jsonb) - validation rules, options, defaults
      - `description` (text)
      - `is_reusable` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)

    - `patient_form_assignments`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `patient_id` (uuid, references patients)
      - `form_definition_id` (uuid, references form_definitions)
      - `form_version_id` (uuid, references form_versions)
      - `assigned_by` (uuid, references users)
      - `assigned_date` (timestamptz)
      - `due_date` (date)
      - `priority` (text) - 'low', 'medium', 'high', 'urgent'
      - `status` (text) - 'assigned', 'in_progress', 'completed', 'expired', 'waived'
      - `assignment_reason` (text)
      - `reminder_sent_count` (integer)
      - `last_reminder_sent` (timestamptz)
      - `completed_at` (timestamptz)
      - `waived_by` (uuid, references users)
      - `waived_reason` (text)
      - `created_at` (timestamptz)

    - `patient_form_submissions`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `patient_id` (uuid, references patients)
      - `form_assignment_id` (uuid, references patient_form_assignments)
      - `form_definition_id` (uuid, references form_definitions)
      - `form_version_id` (uuid, references form_versions)
      - `form_responses` (jsonb) - all field responses
      - `submission_source` (text) - 'patient_portal', 'staff_assisted', 'api'
      - `is_complete` (boolean)
      - `is_partial_save` (boolean) - for drafts
      - `ip_address` (text)
      - `user_agent` (text)
      - `signature_data` (jsonb) - if form includes signature
      - `submitted_by_user_id` (uuid, references users) - if staff submitted
      - `submitted_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `form_publication_rules`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `organization_id` (uuid, references organizations)
      - `form_definition_id` (uuid, references form_definitions)
      - `rule_name` (text)
      - `trigger_type` (text) - 'new_patient', 'state_change', 'group_assignment', 'appointment_type', 'manual'
      - `trigger_conditions` (jsonb) - detailed conditions
      - `auto_assign` (boolean)
      - `assignment_priority` (text)
      - `due_days_offset` (integer) - days after trigger to set due date
      - `is_active` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users within same clinic
    - Add policies for service role (Patient Portal API access)
*/

-- Form Definitions Table
CREATE TABLE IF NOT EXISTS form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL,
  form_code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('intake', 'consent', 'assessment', 'survey', 'other')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  current_version_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, form_code)
);

-- Form Versions Table
CREATE TABLE IF NOT EXISTS form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_definition_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  form_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  state_codes JSONB DEFAULT '[]'::jsonb,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  change_summary TEXT,
  is_current BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(form_definition_id, version_number)
);

-- Add foreign key from form_definitions to form_versions
ALTER TABLE form_definitions
ADD CONSTRAINT fk_current_version
FOREIGN KEY (current_version_id)
REFERENCES form_versions(id)
ON DELETE SET NULL;

-- Form Field Library Table
CREATE TABLE IF NOT EXISTS form_field_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'date', 'dropdown', 'checkbox', 'radio', 'signature', 'file_upload', 'textarea', 'number', 'time')),
  field_config JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  is_reusable BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Form Assignments Table
CREATE TABLE IF NOT EXISTS patient_form_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  form_definition_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  form_version_id UUID NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_date TIMESTAMPTZ DEFAULT now(),
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'expired', 'waived')),
  assignment_reason TEXT,
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  waived_by UUID REFERENCES users(id),
  waived_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Form Submissions Table
CREATE TABLE IF NOT EXISTS patient_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  form_assignment_id UUID REFERENCES patient_form_assignments(id) ON DELETE CASCADE,
  form_definition_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  form_version_id UUID NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
  form_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submission_source TEXT NOT NULL DEFAULT 'patient_portal' CHECK (submission_source IN ('patient_portal', 'staff_assisted', 'api')),
  is_complete BOOLEAN DEFAULT false,
  is_partial_save BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  signature_data JSONB,
  submitted_by_user_id UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form Publication Rules Table
CREATE TABLE IF NOT EXISTS form_publication_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  form_definition_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_patient', 'state_change', 'group_assignment', 'appointment_type', 'manual')),
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  auto_assign BOOLEAN DEFAULT true,
  assignment_priority TEXT DEFAULT 'medium',
  due_days_offset INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_definitions_clinic ON form_definitions(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_form_definitions_org ON form_definitions(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_form_versions_definition ON form_versions(form_definition_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_states ON form_versions USING GIN (state_codes);
CREATE INDEX IF NOT EXISTS idx_form_assignments_patient ON patient_form_assignments(patient_id) WHERE status IN ('assigned', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_form_assignments_status ON patient_form_assignments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_patient ON patient_form_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_assignment ON patient_form_submissions(form_assignment_id);
CREATE INDEX IF NOT EXISTS idx_form_publication_rules_clinic ON form_publication_rules(clinic_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_publication_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_definitions
CREATE POLICY "Users can view form definitions in their clinic"
  ON form_definitions FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage form definitions"
  ON form_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to form_definitions"
  ON form_definitions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for form_versions
CREATE POLICY "Users can view form versions in their clinic"
  ON form_versions FOR SELECT
  TO authenticated
  USING (
    form_definition_id IN (
      SELECT id FROM form_definitions
      WHERE clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "System admins can manage form versions"
  ON form_versions FOR ALL
  TO authenticated
  USING (
    form_definition_id IN (
      SELECT fd.id FROM form_definitions fd
      JOIN users u ON u.clinic_id = fd.clinic_id
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to form_versions"
  ON form_versions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for form_field_library
CREATE POLICY "Users can view field library in their clinic"
  ON form_field_library FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage field library"
  ON form_field_library FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to form_field_library"
  ON form_field_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for patient_form_assignments
CREATE POLICY "Users can view assignments in their clinic"
  ON patient_form_assignments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create assignments in their clinic"
  ON patient_form_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update assignments in their clinic"
  ON patient_form_assignments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to patient_form_assignments"
  ON patient_form_assignments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for patient_form_submissions
CREATE POLICY "Users can view submissions in their clinic"
  ON patient_form_submissions FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create submissions in their clinic"
  ON patient_form_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update submissions in their clinic"
  ON patient_form_submissions FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to patient_form_submissions"
  ON patient_form_submissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for form_publication_rules
CREATE POLICY "Users can view publication rules in their clinic"
  ON form_publication_rules FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System admins can manage publication rules"
  ON form_publication_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to form_publication_rules"
  ON form_publication_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);