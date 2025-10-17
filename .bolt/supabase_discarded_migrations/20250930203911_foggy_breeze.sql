/*
  # Add Note Templates and Categories System

  1. New Tables
    - `note_templates`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, foreign key to clinics)
      - `name` (text, template name)
      - `template_type` (text, soap/custom/follow_up/etc)
      - `structure` (jsonb, template fields and layout)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `note_categories`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, foreign key to clinics)
      - `name` (text, category name)
      - `description` (text, category description)
      - `color` (text, hex color for UI)
      - `icon` (text, lucide icon name)
      - `is_active` (boolean, default true)
      - `sort_order` (integer, for ordering)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for clinic-based access
    - Users can read/write within their clinic only

  3. Default Data
    - Insert default SOAP and follow-up templates
    - Insert default note categories with colors
*/

-- Create note_templates table
CREATE TABLE IF NOT EXISTS note_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  template_type text NOT NULL DEFAULT 'custom',
  structure jsonb NOT NULL DEFAULT '{}',
  description text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint for template_type
ALTER TABLE note_templates 
ADD CONSTRAINT note_templates_template_type_check 
CHECK (template_type = ANY (ARRAY['soap'::text, 'follow_up'::text, 'initial_visit'::text, 'progress'::text, 'custom'::text]));

-- Create note_categories table
CREATE TABLE IF NOT EXISTS note_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  description text,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'FileText',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for note_templates
CREATE POLICY "Note templates: clinic access"
  ON note_templates
  FOR ALL
  TO authenticated
  USING (clinic_id = (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ))
  WITH CHECK (clinic_id = (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

-- RLS Policies for note_categories  
CREATE POLICY "Note categories: clinic access"
  ON note_categories
  FOR ALL
  TO authenticated
  USING (clinic_id = (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ))
  WITH CHECK (clinic_id = (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

-- Insert default templates for all clinics
DO $$
DECLARE
  clinic_record RECORD;
  admin_user_id uuid;
BEGIN
  FOR clinic_record IN SELECT id FROM clinics LOOP
    -- Find an admin user for this clinic (or use the first user)
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE clinic_id = clinic_record.id 
    LIMIT 1;
    
    -- Skip if no users found for this clinic
    IF admin_user_id IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Insert default SOAP template
    INSERT INTO note_templates (clinic_id, name, template_type, structure, description, created_by)
    VALUES (
      clinic_record.id,
      'SOAP Note',
      'soap',
      '{
        "sections": [
          {
            "id": "subjective",
            "name": "Subjective",
            "description": "Patient''s chief complaint, history of present illness, review of systems",
            "required": true,
            "type": "textarea",
            "placeholder": "Patient reports..."
          },
          {
            "id": "objective", 
            "name": "Objective",
            "description": "Vital signs, physical examination findings, lab results, diagnostic tests",
            "required": true,
            "type": "textarea",
            "placeholder": "Physical exam reveals..."
          },
          {
            "id": "assessment",
            "name": "Assessment", 
            "description": "Clinical impression, differential diagnosis, problem list",
            "required": true,
            "type": "textarea",
            "placeholder": "Clinical impression..."
          },
          {
            "id": "plan",
            "name": "Plan",
            "description": "Treatment plan, medications, follow-up instructions, patient education",
            "required": true,
            "type": "textarea", 
            "placeholder": "Treatment plan..."
          }
        ]
      }'::jsonb,
      'Standard SOAP note template for clinical documentation',
      admin_user_id
    );
    
    -- Insert follow-up visit template
    INSERT INTO note_templates (clinic_id, name, template_type, structure, description, created_by)
    VALUES (
      clinic_record.id,
      'Follow-up Visit',
      'follow_up',
      '{
        "sections": [
          {
            "id": "interval_history",
            "name": "Interval History",
            "description": "Changes since last visit, new symptoms, medication compliance",
            "required": true,
            "type": "textarea",
            "placeholder": "Since last visit..."
          },
          {
            "id": "current_status",
            "name": "Current Status",
            "description": "Current symptoms, functional status, vital signs",
            "required": true,
            "type": "textarea",
            "placeholder": "Patient currently..."
          },
          {
            "id": "assessment_changes",
            "name": "Assessment & Changes",
            "description": "Response to treatment, plan modifications",
            "required": true,
            "type": "textarea",
            "placeholder": "Treatment response..."
          },
          {
            "id": "next_steps",
            "name": "Next Steps",
            "description": "Continued treatment, new interventions, follow-up timing",
            "required": true,
            "type": "textarea",
            "placeholder": "Continue current plan..."
          }
        ]
      }'::jsonb,
      'Template for follow-up visits and progress monitoring',
      admin_user_id
    );
    
    -- Insert initial consultation template
    INSERT INTO note_templates (clinic_id, name, template_type, structure, description, created_by)
    VALUES (
      clinic_record.id,
      'Initial Consultation',
      'initial_visit',
      '{
        "sections": [
          {
            "id": "chief_complaint",
            "name": "Chief Complaint",
            "description": "Primary reason for visit",
            "required": true,
            "type": "textarea",
            "placeholder": "Patient presents with..."
          },
          {
            "id": "history_present_illness",
            "name": "History of Present Illness",
            "description": "Detailed history of current condition",
            "required": true,
            "type": "textarea",
            "placeholder": "Onset, duration, quality..."
          },
          {
            "id": "past_medical_history",
            "name": "Past Medical History",
            "description": "Previous medical conditions, surgeries, hospitalizations",
            "required": false,
            "type": "textarea",
            "placeholder": "Previous conditions..."
          },
          {
            "id": "medications_supplements",
            "name": "Current Medications & Supplements",
            "description": "All current medications and supplements",
            "required": false,
            "type": "textarea",
            "placeholder": "Currently taking..."
          },
          {
            "id": "physical_exam",
            "name": "Physical Examination",
            "description": "Physical examination findings",
            "required": true,
            "type": "textarea",
            "placeholder": "Physical exam..."
          },
          {
            "id": "initial_assessment",
            "name": "Initial Assessment",
            "description": "Clinical impression and differential diagnosis",
            "required": true,
            "type": "textarea",
            "placeholder": "Initial impression..."
          },
          {
            "id": "treatment_plan",
            "name": "Treatment Plan",
            "description": "Initial treatment recommendations",
            "required": true,
            "type": "textarea",
            "placeholder": "Recommended treatment..."
          }
        ]
      }'::jsonb,
      'Comprehensive template for initial patient consultations',
      admin_user_id
    );
  END LOOP;
END $$;

-- Insert default categories for all clinics
DO $$
DECLARE
  clinic_record RECORD;
  admin_user_id uuid;
BEGIN
  FOR clinic_record IN SELECT id FROM clinics LOOP
    -- Find an admin user for this clinic
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE clinic_id = clinic_record.id 
    LIMIT 1;
    
    -- Skip if no users found for this clinic
    IF admin_user_id IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Insert default categories
    INSERT INTO note_categories (clinic_id, name, description, color, icon, sort_order, created_by) VALUES
    (clinic_record.id, 'Administrative', 'Administrative tasks and documentation', '#3B82F6', 'Settings', 1, admin_user_id),
    (clinic_record.id, 'Patient Communication', 'Phone calls, messages, and patient interactions', '#10B981', 'MessageCircle', 2, admin_user_id),
    (clinic_record.id, 'Clinical Observation', 'Clinical observations and findings', '#8B5CF6', 'Eye', 3, admin_user_id),
    (clinic_record.id, 'Follow-up Required', 'Items requiring follow-up action', '#F59E0B', 'Clock', 4, admin_user_id),
    (clinic_record.id, 'Insurance & Billing', 'Insurance and billing related notes', '#EF4444', 'CreditCard', 5, admin_user_id),
    (clinic_record.id, 'Lab Results', 'Lab result interpretations and notes', '#06B6D4', 'FlaskConical', 6, admin_user_id),
    (clinic_record.id, 'Referral', 'Referrals to specialists or other providers', '#84CC16', 'UserCheck', 7, admin_user_id),
    (clinic_record.id, 'Other', 'Miscellaneous notes and observations', '#6B7280', 'FileText', 8, admin_user_id);
  END LOOP;
END $$;