/*
  # Create Note Templates and Categories System

  1. New Tables
    - `note_categories` - Stores clinic-specific note categories with icons and colors
    - `note_templates` - Stores clinic-specific note templates with structured content

  2. Security
    - Enable RLS on both tables
    - Add clinic-based access policies for all CRUD operations
    - Users can only access their own clinic's templates and categories

  3. Default Data
    - Seeds 8 default categories for each existing clinic
    - Seeds 3 default templates for each existing clinic
    - Includes proper icons, colors, and structured content

  4. Performance
    - Adds indexes on clinic_id and is_active columns
*/

-- Create note_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.note_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    name text NOT NULL,
    description text,
    color text,
    icon text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES public.users(id)
);

-- Enable RLS on note_categories if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'note_categories' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.note_categories ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for note_categories if they don't exist
DO $$
BEGIN
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_categories' 
        AND policyname = 'Note categories: clinic read access'
    ) THEN
        CREATE POLICY "Note categories: clinic read access"
        ON public.note_categories FOR SELECT
        TO authenticated
        USING (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;

    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_categories' 
        AND policyname = 'Note categories: clinic insert access'
    ) THEN
        CREATE POLICY "Note categories: clinic insert access"
        ON public.note_categories FOR INSERT
        TO authenticated
        WITH CHECK (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;

    -- Check and create UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_categories' 
        AND policyname = 'Note categories: clinic update access'
    ) THEN
        CREATE POLICY "Note categories: clinic update access"
        ON public.note_categories FOR UPDATE
        TO authenticated
        USING (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1))
        WITH CHECK (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;

    -- Check and create DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_categories' 
        AND policyname = 'Note categories: clinic delete access'
    ) THEN
        CREATE POLICY "Note categories: clinic delete access"
        ON public.note_categories FOR DELETE
        TO authenticated
        USING (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;
END $$;

-- Create note_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.note_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    name text NOT NULL,
    template_type text NOT NULL,
    structure jsonb NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES public.users(id)
);

-- Enable RLS on note_templates if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'note_templates' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.note_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for note_templates if they don't exist
DO $$
BEGIN
    -- Check and create SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_templates' 
        AND policyname = 'Note templates: clinic read access'
    ) THEN
        CREATE POLICY "Note templates: clinic read access"
        ON public.note_templates FOR SELECT
        TO authenticated
        USING (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;

    -- Check and create INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_templates' 
        AND policyname = 'Note templates: clinic insert access'
    ) THEN
        CREATE POLICY "Note templates: clinic insert access"
        ON public.note_templates FOR INSERT
        TO authenticated
        WITH CHECK (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;

    -- Check and create UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_templates' 
        AND policyname = 'Note templates: clinic update access'
    ) THEN
        CREATE POLICY "Note templates: clinic update access"
        ON public.note_templates FOR UPDATE
        TO authenticated
        USING (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1))
        WITH CHECK (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;

    -- Check and create DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'note_templates' 
        AND policyname = 'Note templates: clinic delete access'
    ) THEN
        CREATE POLICY "Note templates: clinic delete access"
        ON public.note_templates FOR DELETE
        TO authenticated
        USING (clinic_id IN ( SELECT users.clinic_id FROM users WHERE (users.auth_user_id = auth.uid()) LIMIT 1));
    END IF;
END $$;

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_note_categories_clinic_id ON public.note_categories(clinic_id);
CREATE INDEX IF NOT EXISTS idx_note_categories_is_active ON public.note_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_note_templates_clinic_id ON public.note_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_note_templates_is_active ON public.note_templates(is_active);

-- Insert default categories for all existing clinics
DO $$
DECLARE
    clinic_record RECORD;
    admin_user_id uuid;
BEGIN
    -- Loop through all existing clinics
    FOR clinic_record IN SELECT id FROM public.clinics LOOP
        -- Get the first admin user for this clinic (or any user if no admin)
        SELECT id INTO admin_user_id 
        FROM public.users 
        WHERE clinic_id = clinic_record.id 
        LIMIT 1;
        
        -- Skip if no users found for this clinic
        IF admin_user_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Insert default categories if they don't exist for this clinic
        INSERT INTO public.note_categories (clinic_id, name, description, color, icon, sort_order, created_by)
        SELECT 
            clinic_record.id,
            category_data.name,
            category_data.description,
            category_data.color,
            category_data.icon,
            category_data.sort_order,
            admin_user_id
        FROM (VALUES
            ('Administrative', 'Administrative notes and documentation', '#3B82F6', 'Settings', 1),
            ('Patient Communication', 'Patient interactions and communications', '#10B981', 'MessageCircle', 2),
            ('Clinical Observation', 'Clinical observations and findings', '#8B5CF6', 'Eye', 3),
            ('Follow-up Required', 'Items requiring follow-up action', '#F59E0B', 'Clock', 4),
            ('Insurance & Billing', 'Insurance and billing related notes', '#EF4444', 'CreditCard', 5),
            ('Lab Results', 'Laboratory results and interpretations', '#06B6D4', 'FlaskConical', 6),
            ('Referral', 'Referrals to other providers', '#84CC16', 'UserCheck', 7),
            ('Other', 'General notes and miscellaneous items', '#6B7280', 'FileText', 8)
        ) AS category_data(name, description, color, icon, sort_order)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.note_categories 
            WHERE clinic_id = clinic_record.id 
            AND name = category_data.name
        );
        
        -- Insert default templates if they don't exist for this clinic
        INSERT INTO public.note_templates (clinic_id, name, template_type, structure, description, created_by)
        SELECT 
            clinic_record.id,
            template_data.name,
            template_data.template_type,
            template_data.structure::jsonb,
            template_data.description,
            admin_user_id
        FROM (VALUES
            (
                'SOAP Note',
                'soap',
                '{"sections": [
                    {"id": "subjective", "name": "Subjective", "description": "Patient reported symptoms and history", "required": true, "type": "textarea", "placeholder": "Patient complaints, symptoms, medical history..."},
                    {"id": "objective", "name": "Objective", "description": "Observable findings and test results", "required": true, "type": "textarea", "placeholder": "Physical exam findings, vital signs, lab results..."},
                    {"id": "assessment", "name": "Assessment", "description": "Clinical judgment and diagnosis", "required": true, "type": "textarea", "placeholder": "Clinical impression, diagnosis, problem list..."},
                    {"id": "plan", "name": "Plan", "description": "Treatment plan and next steps", "required": true, "type": "textarea", "placeholder": "Treatment plan, medications, follow-up..."}
                ]}',
                'Standard SOAP format for clinical documentation'
            ),
            (
                'Follow-up Visit',
                'follow_up',
                '{"sections": [
                    {"id": "progress_since_last_visit", "name": "Progress Since Last Visit", "description": "Changes in symptoms, adherence to plan", "required": true, "type": "textarea", "placeholder": "Patient update, new symptoms, response to treatment..."},
                    {"id": "physical_exam_findings", "name": "Physical Exam Findings", "description": "Relevant physical exam findings", "required": false, "type": "textarea", "placeholder": "Focused exam findings..."},
                    {"id": "assessment_and_plan_update", "name": "Assessment and Plan Update", "description": "Updated assessment and modifications to plan", "required": true, "type": "textarea", "placeholder": "Revised diagnosis, new interventions, referrals..."},
                    {"id": "patient_education_and_counseling", "name": "Patient Education and Counseling", "description": "Information provided to patient, next steps", "required": false, "type": "textarea", "placeholder": "Instructions, resources, follow-up schedule..."}
                ]}',
                'Template for documenting follow-up appointments'
            ),
            (
                'Initial Consultation',
                'initial_visit',
                '{"sections": [
                    {"id": "reason_for_consultation", "name": "Reason for Consultation", "description": "Primary concerns and goals", "required": true, "type": "textarea", "placeholder": "Patient''s main reason for seeking care..."},
                    {"id": "past_medical_history", "name": "Past Medical History", "description": "Relevant medical history, surgeries, hospitalizations", "required": true, "type": "textarea", "placeholder": "Chronic conditions, past surgeries, allergies, medications..."},
                    {"id": "family_social_history", "name": "Family & Social History", "description": "Family medical history, social determinants of health", "required": false, "type": "textarea", "placeholder": "Family illnesses, living situation, occupation, habits..."},
                    {"id": "review_of_systems_comprehensive", "name": "Review of Systems (Comprehensive)", "description": "Detailed review of all body systems", "required": true, "type": "textarea", "placeholder": "Systematic inquiry about symptoms across all systems..."},
                    {"id": "physical_exam_comprehensive", "name": "Physical Exam (Comprehensive)", "description": "Full physical examination findings", "required": true, "type": "textarea", "placeholder": "Head-to-toe examination findings..."},
                    {"id": "initial_assessment_plan", "name": "Initial Assessment & Plan", "description": "Provisional diagnosis, initial treatment strategy, investigations", "required": true, "type": "textarea", "placeholder": "Working diagnosis, labs ordered, referrals, initial recommendations..."}
                ]}',
                'Comprehensive template for new patient consultations'
            )
        ) AS template_data(name, template_type, structure, description)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.note_templates 
            WHERE clinic_id = clinic_record.id 
            AND name = template_data.name
        );
        
    END LOOP;
END $$;