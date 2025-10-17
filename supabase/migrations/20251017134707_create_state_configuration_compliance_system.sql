/*
  # State Configuration & Compliance Tracking System

  1. New Tables
    - `state_configurations`
      - `id` (uuid, primary key)
      - `state_code` (text) - 2-letter state code (e.g., 'CA', 'TX', 'NY')
      - `state_name` (text) - full state name
      - `clinic_id` (uuid, references clinics) - null for org-wide
      - `organization_id` (uuid, references organizations) - null for clinic-specific
      - `legal_requirements` (jsonb) - array of requirements
      - `required_forms` (jsonb) - array of form_definition_ids
      - `validation_rules` (jsonb) - state-specific validation requirements
      - `data_retention_days` (integer) - state-mandated retention
      - `compliance_notes` (text)
      - `last_review_date` (date)
      - `next_review_date` (date)
      - `is_active` (boolean)
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `patient_state_history`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `patient_id` (uuid, references patients)
      - `state_code` (text)
      - `is_primary_state` (boolean)
      - `effective_date` (date)
      - `end_date` (date)
      - `change_reason` (text)
      - `detected_from` (text) - 'registration', 'address_update', 'manual'
      - `forms_triggered` (jsonb) - forms auto-assigned due to state
      - `recorded_by` (uuid, references users)
      - `created_at` (timestamptz)

    - `compliance_tracking`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `patient_id` (uuid, references patients)
      - `compliance_type` (text) - 'form_completion', 'consent', 'documentation', 'state_requirement'
      - `requirement_name` (text)
      - `required_by_state` (text) - state code
      - `status` (text) - 'compliant', 'pending', 'overdue', 'non_compliant', 'waived'
      - `due_date` (date)
      - `completed_date` (date)
      - `waived_by` (uuid, references users)
      - `waived_reason` (text)
      - `related_form_assignment_id` (uuid, references patient_form_assignments)
      - `related_document_id` (uuid)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `portal_configuration`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `organization_id` (uuid, references organizations)
      - `config_key` (text) - unique key for this configuration
      - `config_category` (text) - 'forms', 'resources', 'groups', 'notifications', 'general'
      - `config_value` (jsonb) - the actual configuration
      - `description` (text)
      - `is_active` (boolean)
      - `updated_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users within same clinic
    - Add policies for service role (Patient Portal API access)
*/

-- State Configurations Table
CREATE TABLE IF NOT EXISTS state_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  legal_requirements JSONB DEFAULT '[]'::jsonb,
  required_forms JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  data_retention_days INTEGER DEFAULT 2555,
  compliance_notes TEXT,
  last_review_date DATE,
  next_review_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_state_code CHECK (length(state_code) = 2),
  UNIQUE(state_code, clinic_id),
  UNIQUE(state_code, organization_id)
);

-- Patient State History Table
CREATE TABLE IF NOT EXISTS patient_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  is_primary_state BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  change_reason TEXT,
  detected_from TEXT NOT NULL DEFAULT 'registration' CHECK (detected_from IN ('registration', 'address_update', 'manual')),
  forms_triggered JSONB DEFAULT '[]'::jsonb,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_state_code CHECK (length(state_code) = 2)
);

-- Compliance Tracking Table
CREATE TABLE IF NOT EXISTS compliance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('form_completion', 'consent', 'documentation', 'state_requirement')),
  requirement_name TEXT NOT NULL,
  required_by_state TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('compliant', 'pending', 'overdue', 'non_compliant', 'waived')),
  due_date DATE,
  completed_date DATE,
  waived_by UUID REFERENCES users(id),
  waived_reason TEXT,
  related_form_assignment_id UUID REFERENCES patient_form_assignments(id) ON DELETE SET NULL,
  related_document_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_required_state CHECK (required_by_state IS NULL OR length(required_by_state) = 2)
);

-- Portal Configuration Table
CREATE TABLE IF NOT EXISTS portal_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_category TEXT NOT NULL CHECK (config_category IN ('forms', 'resources', 'groups', 'notifications', 'general')),
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, config_key),
  UNIQUE(organization_id, config_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_state_configurations_state ON state_configurations(state_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_state_configurations_clinic ON state_configurations(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_patient_state_history_patient ON patient_state_history(patient_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_state_history_state ON patient_state_history(state_code) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_patient ON compliance_tracking(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_status ON compliance_tracking(clinic_id, status) WHERE status IN ('pending', 'overdue', 'non_compliant');
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_due_date ON compliance_tracking(clinic_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_portal_configuration_clinic ON portal_configuration(clinic_id) WHERE is_active = true;

-- Function to get patient's current primary state
CREATE OR REPLACE FUNCTION get_patient_current_state(p_patient_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_state TEXT;
BEGIN
  SELECT state_code INTO current_state
  FROM patient_state_history
  WHERE patient_id = p_patient_id
  AND is_primary_state = true
  AND effective_date <= CURRENT_DATE
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  ORDER BY effective_date DESC
  LIMIT 1;
  
  RETURN current_state;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update compliance status based on due dates
CREATE OR REPLACE FUNCTION update_compliance_status()
RETURNS void AS $$
BEGIN
  UPDATE compliance_tracking
  SET status = 'overdue',
      updated_at = now()
  WHERE status = 'pending'
  AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE state_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for state_configurations
CREATE POLICY "Users can view state configurations in their clinic"
  ON state_configurations FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
    OR organization_id IN (
      SELECT c.organization_id FROM users u
      JOIN clinics c ON u.clinic_id = c.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage state configurations"
  ON state_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to state_configurations"
  ON state_configurations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for patient_state_history
CREATE POLICY "Users can view state history in their clinic"
  ON patient_state_history FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage state history in their clinic"
  ON patient_state_history FOR ALL
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to patient_state_history"
  ON patient_state_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for compliance_tracking
CREATE POLICY "Users can view compliance in their clinic"
  ON compliance_tracking FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage compliance in their clinic"
  ON compliance_tracking FOR ALL
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to compliance_tracking"
  ON compliance_tracking FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for portal_configuration
CREATE POLICY "Users can view portal configuration in their clinic"
  ON portal_configuration FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
    OR organization_id IN (
      SELECT c.organization_id FROM users u
      JOIN clinics c ON u.clinic_id = c.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage portal configuration"
  ON portal_configuration FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

CREATE POLICY "Service role full access to portal_configuration"
  ON portal_configuration FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);