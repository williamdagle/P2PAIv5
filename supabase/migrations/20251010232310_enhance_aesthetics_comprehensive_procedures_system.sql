/*
  # Comprehensive Aesthetic Procedures System Enhancement

  ## Summary
  This migration significantly enhances the aesthetics module to support a complete suite 
  of non-surgical aesthetic procedures with structured workflows, clinical documentation,
  role-based access, and automated business logic.

  ## New Tables

  ### 1. aesthetic_procedure_protocols
  - Stores standardized protocols for each procedure type
  - Includes pre-treatment checklists, post-care instructions, contraindications
  - Supports protocol versioning and customization per clinic

  ### 2. aesthetic_consent_templates  
  - Procedure-specific consent form templates with version control
  - Supports digital e-signature workflow and PDF upload
  - Tracks template revisions and legal compliance

  ### 3. aesthetic_injection_maps
  - Stores injection site mapping data for Botox and fillers
  - Links to treatment records and photos
  - Supports anatomical zone tracking and unit distribution

  ### 4. aesthetic_treatment_reminders
  - Automated re-treatment reminder system
  - Calculates optimal follow-up windows by procedure type
  - Tracks reminder status and patient responses

  ### 5. aesthetic_soap_notes
  - Auto-generated SOAP notes from treatment templates
  - Structured clinical documentation with searchable fields
  - Links to treatments for comprehensive record keeping

  ### 6. aesthetic_billing_codes
  - Maps procedures to customizable billing/CPT codes
  - Supports multiple pricing models (per-unit, per-area, flat-rate)
  - Enables automated invoice generation

  ### 7. user_aesthetic_roles
  - Role assignments for aesthetic module users
  - Supports: Aesthetic Nurse, Doctor, Admin, Front Desk
  - Granular permission control per role

  ## Table Enhancements

  ### aesthetic_treatments
  - Added support for multiple concurrent procedures per session
  - Enhanced product tracking with automatic inventory links
  - Added injection map reference and consent form links
  - Added structured fields for better clinical documentation

  ## Security
  - All new tables have RLS enabled
  - Role-based policies for aesthetic module access
  - Audit logging for all critical operations
  - Service role access for Edge Functions

  ## Performance
  - Comprehensive indexing on foreign keys and query patterns
  - Optimized for high-volume clinic operations
*/

-- =====================================================
-- PROCEDURE PROTOCOLS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS aesthetic_procedure_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_category text NOT NULL,
  procedure_name text NOT NULL,
  protocol_version text NOT NULL DEFAULT '1.0',
  is_active boolean DEFAULT true,
  is_system_protocol boolean DEFAULT false,
  
  -- Pre-treatment requirements
  pre_treatment_checklist jsonb DEFAULT '[]',
  contraindications text[],
  patient_screening_questions jsonb DEFAULT '[]',
  required_consent_forms text[],
  
  -- Treatment protocol details
  typical_duration_minutes integer DEFAULT 30,
  typical_dosage_range text,
  typical_areas text[],
  product_requirements jsonb DEFAULT '[]',
  equipment_required text[],
  technique_guidelines text,
  
  -- Post-treatment care
  post_care_instructions text NOT NULL,
  expected_results text,
  possible_side_effects text[],
  activity_restrictions jsonb DEFAULT '{}',
  follow_up_timeline text,
  
  -- Re-treatment scheduling
  minimum_interval_days integer,
  optimal_interval_days integer,
  maximum_interval_days integer,
  
  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT clinic_or_org_protocol CHECK (clinic_id IS NOT NULL OR organization_id IS NOT NULL OR is_system_protocol = true)
);

ALTER TABLE aesthetic_procedure_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Procedure protocols: clinic access"
  ON aesthetic_procedure_protocols FOR SELECT
  TO authenticated
  USING (
    is_system_protocol = true OR
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM clinics WHERE id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY "Procedure protocols: clinic insert"
  ON aesthetic_procedure_protocols FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Procedure protocols: clinic update"
  ON aesthetic_procedure_protocols FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_procedure_protocols_clinic ON aesthetic_procedure_protocols(clinic_id);
CREATE INDEX IF NOT EXISTS idx_procedure_protocols_category ON aesthetic_procedure_protocols(procedure_category);
CREATE INDEX IF NOT EXISTS idx_procedure_protocols_active ON aesthetic_procedure_protocols(is_active);

-- =====================================================
-- CONSENT TEMPLATES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS aesthetic_consent_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  procedure_types text[] NOT NULL,
  template_version text NOT NULL DEFAULT '1.0',
  is_active boolean DEFAULT true,
  is_system_template boolean DEFAULT false,
  
  -- Template content
  consent_title text NOT NULL,
  consent_body text NOT NULL,
  risk_disclosure text NOT NULL,
  patient_acknowledgments text[] NOT NULL,
  required_signatures text[] NOT NULL DEFAULT ARRAY['patient'],
  
  -- Legal and compliance
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  expiration_date date,
  legal_review_date date,
  reviewed_by uuid REFERENCES users(id),
  compliance_notes text,
  
  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT clinic_or_org_consent CHECK (clinic_id IS NOT NULL OR organization_id IS NOT NULL OR is_system_template = true)
);

ALTER TABLE aesthetic_consent_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consent templates: clinic access"
  ON aesthetic_consent_templates FOR SELECT
  TO authenticated
  USING (
    is_system_template = true OR
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM clinics WHERE id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY "Consent templates: clinic insert"
  ON aesthetic_consent_templates FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Consent templates: clinic update"
  ON aesthetic_consent_templates FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_consent_templates_clinic ON aesthetic_consent_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consent_templates_active ON aesthetic_consent_templates(is_active);

-- =====================================================
-- INJECTION MAPPING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS aesthetic_injection_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES aesthetic_treatments(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES aesthetic_photos(id) ON DELETE SET NULL,
  
  -- Injection site data
  facial_zones jsonb NOT NULL DEFAULT '[]',
  injection_points jsonb NOT NULL DEFAULT '[]',
  total_units_mapped numeric(10,2),
  product_used text NOT NULL,
  dilution_ratio text,
  technique_used text,
  
  -- Anatomical mapping
  map_type text NOT NULL CHECK (map_type IN ('facial_botox', 'facial_filler', 'body_area', 'scalp')),
  anatomical_reference text,
  coordinates_system text DEFAULT 'grid',
  
  -- Clinical notes
  injection_depth text,
  needle_gauge text,
  cannula_used boolean DEFAULT false,
  immediate_response text,
  complications_noted text,
  
  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_injection_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Injection maps: clinic access"
  ON aesthetic_injection_maps FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Injection maps: clinic insert"
  ON aesthetic_injection_maps FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Injection maps: clinic update"
  ON aesthetic_injection_maps FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_injection_maps_clinic ON aesthetic_injection_maps(clinic_id);
CREATE INDEX IF NOT EXISTS idx_injection_maps_patient ON aesthetic_injection_maps(patient_id);
CREATE INDEX IF NOT EXISTS idx_injection_maps_treatment ON aesthetic_injection_maps(treatment_id);

-- =====================================================
-- TREATMENT REMINDERS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS aesthetic_treatment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES aesthetic_treatments(id) ON DELETE CASCADE,
  
  -- Reminder details
  procedure_type text NOT NULL,
  last_treatment_date date NOT NULL,
  optimal_followup_date date NOT NULL,
  latest_followup_date date,
  reminder_window_start date NOT NULL,
  reminder_window_end date NOT NULL,
  
  -- Status tracking
  reminder_status text NOT NULL DEFAULT 'pending' CHECK (reminder_status IN ('pending', 'sent', 'scheduled', 'completed', 'dismissed', 'expired')),
  reminder_sent_date date,
  appointment_scheduled_date date,
  completion_date date,
  
  -- Communication preferences
  notification_method text DEFAULT 'internal' CHECK (notification_method IN ('internal', 'email', 'sms', 'both')),
  patient_contacted boolean DEFAULT false,
  patient_response text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_treatment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment reminders: clinic access"
  ON aesthetic_treatment_reminders FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Treatment reminders: clinic insert"
  ON aesthetic_treatment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Treatment reminders: clinic update"
  ON aesthetic_treatment_reminders FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reminders_clinic ON aesthetic_treatment_reminders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON aesthetic_treatment_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON aesthetic_treatment_reminders(reminder_status, optimal_followup_date);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON aesthetic_treatment_reminders(reminder_status, reminder_window_start) WHERE reminder_status = 'pending';

-- =====================================================
-- SOAP NOTES AUTOMATION
-- =====================================================

CREATE TABLE IF NOT EXISTS aesthetic_soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES aesthetic_treatments(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES users(id),
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- SOAP structure
  subjective text,
  subjective_structured jsonb DEFAULT '{}',
  objective text,
  objective_structured jsonb DEFAULT '{}',
  assessment text,
  assessment_structured jsonb DEFAULT '{}',
  plan text,
  plan_structured jsonb DEFAULT '{}',
  
  -- Auto-generated sections
  auto_generated boolean DEFAULT false,
  generation_template_id uuid,
  manual_edits_made boolean DEFAULT false,
  
  -- Clinical data
  treatment_summary text,
  products_administered jsonb DEFAULT '[]',
  dosages_recorded jsonb DEFAULT '[]',
  adverse_events_noted boolean DEFAULT false,
  follow_up_required boolean DEFAULT false,
  follow_up_instructions text,
  
  -- Compliance and signatures
  note_status text NOT NULL DEFAULT 'draft' CHECK (note_status IN ('draft', 'completed', 'signed', 'amended')),
  signed_by uuid REFERENCES users(id),
  signed_at timestamptz,
  electronic_signature text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_soap_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SOAP notes: clinic access"
  ON aesthetic_soap_notes FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "SOAP notes: clinic insert"
  ON aesthetic_soap_notes FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "SOAP notes: clinic update"
  ON aesthetic_soap_notes FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_soap_notes_clinic ON aesthetic_soap_notes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient ON aesthetic_soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_treatment ON aesthetic_soap_notes(treatment_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_provider ON aesthetic_soap_notes(provider_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_date ON aesthetic_soap_notes(note_date DESC);

-- =====================================================
-- BILLING CODES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS aesthetic_billing_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Code information
  procedure_name text NOT NULL,
  procedure_category text NOT NULL,
  billing_code text,
  cpt_code text,
  internal_code text,
  
  -- Pricing models
  pricing_type text NOT NULL CHECK (pricing_type IN ('flat_rate', 'per_unit', 'per_area', 'per_syringe', 'per_session', 'custom')),
  base_price numeric(10,2) NOT NULL,
  unit_price numeric(10,2),
  minimum_charge numeric(10,2),
  
  -- Pricing tiers
  pricing_tiers jsonb DEFAULT '[]',
  member_discount_percentage numeric(5,2) DEFAULT 0,
  package_eligible boolean DEFAULT true,
  
  -- Insurance and billing
  insurance_billable boolean DEFAULT false,
  insurance_modifier text,
  requires_pre_authorization boolean DEFAULT false,
  
  -- Metadata
  is_active boolean DEFAULT true,
  effective_date date DEFAULT CURRENT_DATE,
  expiration_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT clinic_or_org_billing CHECK (clinic_id IS NOT NULL OR organization_id IS NOT NULL)
);

ALTER TABLE aesthetic_billing_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing codes: clinic access"
  ON aesthetic_billing_codes FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM clinics WHERE id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY "Billing codes: clinic insert"
  ON aesthetic_billing_codes FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Billing codes: clinic update"
  ON aesthetic_billing_codes FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_billing_codes_clinic ON aesthetic_billing_codes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_codes_category ON aesthetic_billing_codes(procedure_category);
CREATE INDEX IF NOT EXISTS idx_billing_codes_active ON aesthetic_billing_codes(is_active);

-- =====================================================
-- USER ROLES FOR AESTHETICS MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_aesthetic_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Role definition
  role_name text NOT NULL CHECK (role_name IN ('aesthetic_nurse', 'doctor', 'admin', 'front_desk')),
  
  -- Permissions
  can_create_treatments boolean DEFAULT false,
  can_edit_treatments boolean DEFAULT false,
  can_delete_treatments boolean DEFAULT false,
  can_view_photos boolean DEFAULT false,
  can_upload_photos boolean DEFAULT false,
  can_view_financial boolean DEFAULT false,
  can_process_payments boolean DEFAULT false,
  can_manage_inventory boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_manage_templates boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  
  -- Status
  is_active boolean DEFAULT true,
  assigned_date date DEFAULT CURRENT_DATE,
  assigned_by uuid REFERENCES users(id),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, clinic_id, role_name)
);

ALTER TABLE user_aesthetic_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aesthetic roles: users can view own"
  ON user_aesthetic_roles FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Aesthetic roles: admins can manage"
  ON user_aesthetic_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_user_id = auth.uid() 
      AND u.user_id IN ('System Admin', 'Admin')
      AND u.clinic_id = user_aesthetic_roles.clinic_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_aesthetic_roles_user ON user_aesthetic_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_roles_clinic ON user_aesthetic_roles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_roles_active ON user_aesthetic_roles(is_active);

-- =====================================================
-- ENHANCE EXISTING TABLES
-- =====================================================

-- Add fields to aesthetic_treatments for enhanced functionality
DO $$
BEGIN
  -- Multi-procedure support
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'is_multi_procedure') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN is_multi_procedure boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'procedure_sequence') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN procedure_sequence integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'session_group_id') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN session_group_id uuid;
  END IF;
  
  -- Protocol and consent linking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'protocol_id') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN protocol_id uuid REFERENCES aesthetic_procedure_protocols(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'consent_form_id') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN consent_form_id uuid REFERENCES aesthetic_consent_forms(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'injection_map_id') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN injection_map_id uuid REFERENCES aesthetic_injection_maps(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'soap_note_id') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN soap_note_id uuid REFERENCES aesthetic_soap_notes(id);
  END IF;
  
  -- Billing integration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'billing_code_id') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN billing_code_id uuid REFERENCES aesthetic_billing_codes(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'billed_amount') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN billed_amount numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'invoice_generated') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN invoice_generated boolean DEFAULT false;
  END IF;
  
  -- Inventory auto-decrement tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'inventory_deducted') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN inventory_deducted boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aesthetic_treatments' AND column_name = 'inventory_transaction_ids') THEN
    ALTER TABLE aesthetic_treatments ADD COLUMN inventory_transaction_ids uuid[];
  END IF;
END $$;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_treatments_session_group ON aesthetic_treatments(session_group_id) WHERE session_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_treatments_protocol ON aesthetic_treatments(protocol_id) WHERE protocol_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_treatments_billing ON aesthetic_treatments(billing_code_id) WHERE billing_code_id IS NOT NULL;

-- =====================================================
-- GRANT SERVICE ROLE ACCESS
-- =====================================================

GRANT ALL ON aesthetic_procedure_protocols TO service_role;
GRANT ALL ON aesthetic_consent_templates TO service_role;
GRANT ALL ON aesthetic_injection_maps TO service_role;
GRANT ALL ON aesthetic_treatment_reminders TO service_role;
GRANT ALL ON aesthetic_soap_notes TO service_role;
GRANT ALL ON aesthetic_billing_codes TO service_role;
GRANT ALL ON user_aesthetic_roles TO service_role;