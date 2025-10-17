/*
  # Create Note Templates and Categories Tables

  1. New Tables
    - `note_categories`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, foreign key to clinics)
      - `name` (text, category name)
      - `description` (text, category description)
      - `color` (text, hex color code)
      - `icon` (text, icon name)
      - `sort_order` (integer, display order)
      - `is_active` (boolean, active status)
      - `created_at`, `updated_at` (timestamps)
      - `created_by`, `updated_by` (uuid, foreign keys to users)

    - `note_templates`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, foreign key to clinics)
      - `name` (text, template name)
      - `template_type` (text, template type)
      - `structure` (jsonb, template structure)
      - `description` (text, template description)
      - `is_active` (boolean, active status)
      - `created_at`, `updated_at` (timestamps)
      - `created_by`, `updated_by` (uuid, foreign keys to users)

  2. Security
    - Enable RLS on both tables
    - Add policies for clinic-based access control

  3. Default Data
    - 8 default note categories with colors and icons
    - 3 default note templates (SOAP, Follow-up, Initial Consultation)
*/

-- Create note_categories table
CREATE TABLE IF NOT EXISTS note_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  description text,
  color text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Enable RLS on note_categories
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_categories
CREATE POLICY "Note categories: clinic access"
  ON note_categories
  FOR ALL
  TO authenticated
  USING (clinic_id IN (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ))
  WITH CHECK (clinic_id IN (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

-- Create note_templates table
CREATE TABLE IF NOT EXISTS note_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  template_type text NOT NULL,
  structure jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Enable RLS on note_templates
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_templates
CREATE POLICY "Note templates: clinic access"
  ON note_templates
  FOR ALL
  TO authenticated
  USING (clinic_id IN (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ))
  WITH CHECK (clinic_id IN (
    SELECT users.clinic_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_categories_clinic_id ON note_categories(clinic_id);
CREATE INDEX IF NOT EXISTS idx_note_categories_active ON note_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_note_templates_clinic_id ON note_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_note_templates_active ON note_templates(is_active);

-- Insert default categories for all existing clinics
DO $$
DECLARE
  clinic_record RECORD;
  admin_user_id uuid;
BEGIN
  -- Loop through all clinics and add default categories
  FOR clinic_record IN SELECT id FROM clinics LOOP
    -- Try to find an admin user for this clinic
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE clinic_id = clinic_record.id 
    LIMIT 1;
    
    -- Insert default categories for this clinic
    INSERT INTO note_categories (clinic_id, name, description, color, icon, sort_order, created_by) VALUES
    (clinic_record.id, 'Administrative', 'Administrative notes and documentation', '#3B82F6', 'Settings', 1, admin_user_id),
    (clinic_record.id, 'Patient Communication', 'Patient interactions and communications', '#10B981', 'MessageCircle', 2, admin_user_id),
    (clinic_record.id, 'Clinical Observation', 'Clinical observations and findings', '#8B5CF6', 'Eye', 3, admin_user_id),
    (clinic_record.id, 'Follow-up Required', 'Items requiring follow-up action', '#F59E0B', 'Clock', 4, admin_user_id),
    (clinic_record.id, 'Insurance & Billing', 'Insurance and billing related notes', '#EF4444', 'CreditCard', 5, admin_user_id),
    (clinic_record.id, 'Lab Results', 'Laboratory results and interpretations', '#06B6D4', 'FlaskConical', 6, admin_user_id),
    (clinic_record.id, 'Referral', 'Referrals to other providers', '#84CC16', 'UserCheck', 7, admin_user_id),
    (clinic_record.id, 'Other', 'General notes and miscellaneous items', '#6B7280', 'FileText', 8, admin_user_id);
  END LOOP;
END $$;

-- Insert default templates for all existing clinics
DO $$
DECLARE
  clinic_record RECORD;
  admin_user_id uuid;
BEGIN
  -- Loop through all clinics and add default templates
  FOR clinic_record IN SELECT id FROM clinics LOOP
    -- Try to find an admin user for this clinic
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE clinic_id = clinic_record.id 
    LIMIT 1;
    
    -- Insert default templates for this clinic
    INSERT INTO note_templates (clinic_id, name, template_type, structure, description, created_by) VALUES
    (clinic_record.id, 'SOAP Note', 'soap', '{
      "sections": [
        {
          "id": "subjective",
          "name": "Subjective",
          "description": "Patient reported symptoms and history",
          "required": true,
          "type": "textarea",
          "placeholder": "Patient complaints, symptoms, medical history..."
        },
        {
          "id": "objective",
          "name": "Objective", 
          "description": "Observable findings and test results",
          "required": true,
          "type": "textarea",
          "placeholder": "Physical exam findings, vital signs, lab results..."
        },
        {
          "id": "assessment",
          "name": "Assessment",
          "description": "Clinical judgment and diagnosis", 
          "required": true,
          "type": "textarea",
          "placeholder": "Clinical impression, diagnosis, problem list..."
        },
        {
          "id": "plan",
          "name": "Plan",
          "description": "Treatment plan and next steps",
          "required": true,
          "type": "textarea", 
          "placeholder": "Treatment plan, medications, follow-up..."
        }
      ]
    }', 'Standard SOAP format for clinical documentation', admin_user_id),
    
    (clinic_record.id, 'Follow-up Visit', 'follow_up', '{
      "sections": [
        {
          "id": "progress_since_last_visit",
          "name": "Progress Since Last Visit",
          "description": "Changes in symptoms, adherence to plan",
          "required": true,
          "type": "textarea",
          "placeholder": "Patient update, new symptoms, response to treatment..."
        },
        {
          "id": "physical_exam_findings",
          "name": "Physical Exam Findings",
          "description": "Relevant physical exam findings",
          "required": false,
          "type": "textarea",
          "placeholder": "Focused exam findings..."
        },
        {
          "id": "assessment_and_plan_update",
          "name": "Assessment and Plan Update", 
          "description": "Updated assessment and modifications to plan",
          "required": true,
          "type": "textarea",
          "placeholder": "Revised diagnosis, new interventions, referrals..."
        },
        {
          "id": "patient_education_and_counseling",
          "name": "Patient Education and Counseling",
          "description": "Information provided to patient, next steps",
          "required": false,
          "type": "textarea",
          "placeholder": "Instructions, resources, follow-up schedule..."
        }
      ]
    }', 'Template for documenting follow-up appointments', admin_user_id),
    
    (clinic_record.id, 'Initial Consultation', 'initial_visit', '{
      "sections": [
        {
          "id": "reason_for_consultation",
          "name": "Reason for Consultation",
          "description": "Primary concerns and goals",
          "required": true,
          "type": "textarea",
          "placeholder": "Patient''s main reason for seeking care..."
        },
        {
          "id": "past_medical_history",
          "name": "Past Medical History",
          "description": "Relevant medical history, surgeries, hospitalizations",
          "required": true,
          "type": "textarea",
          "placeholder": "Chronic conditions, past surgeries, allergies, medications..."
        },
        {
          "id": "family_social_history",
          "name": "Family & Social History",
          "description": "Family medical history, social determinants of health",
          "required": false,
          "type": "textarea",
          "placeholder": "Family illnesses, living situation, occupation, habits..."
        },
        {
          "id": "review_of_systems_comprehensive",
          "name": "Review of Systems (Comprehensive)",
          "description": "Detailed review of all body systems",
          "required": true,
          "type": "textarea",
          "placeholder": "Systematic inquiry about symptoms across all systems..."
        },
        {
          "id": "physical_exam_comprehensive",
          "name": "Physical Exam (Comprehensive)",
          "description": "Full physical examination findings",
          "required": true,
          "type": "textarea",
          "placeholder": "Head-to-toe examination findings..."
        },
        {
          "id": "initial_assessment_plan",
          "name": "Initial Assessment & Plan",
          "description": "Provisional diagnosis, initial treatment strategy, investigations",
          "required": true,
          "type": "textarea",
          "placeholder": "Working diagnosis, labs ordered, referrals, initial recommendations..."
        }
      ]
    }', 'Comprehensive template for new patient consultations', admin_user_id);
  END LOOP;
END $$;