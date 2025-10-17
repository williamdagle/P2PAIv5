/*
  # Patient Charting Phase 1.3 & 1.4 - Chief Complaint, HPI, and ROS

  ## Overview
  Creates tables for structured clinical documentation:
  - Chief Complaints (reason for visit capture)
  - History of Present Illness (detailed symptom narrative)
  - Review of Systems (comprehensive body systems checklist)

  ## New Tables

  ### 1. chief_complaints
  Captures the primary reason(s) for patient visit
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `visit_date` (date) - date of visit
  - `complaint` (text) - primary complaint description
  - `duration` (text) - how long symptom has been present
  - `severity` (text) - mild, moderate, severe
  - `associated_symptoms` (text[]) - array of related symptoms
  - `notes` (text)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. history_present_illness
  Detailed narrative of the presenting illness
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `visit_date` (date)
  - `chief_complaint_id` (uuid, foreign key to chief_complaints) - optional link
  - `onset` (text) - when symptoms started
  - `location` (text) - anatomical location
  - `duration` (text) - how long symptoms last
  - `character` (text) - quality/description of symptom
  - `aggravating_factors` (text) - what makes it worse
  - `relieving_factors` (text) - what makes it better
  - `timing` (text) - when it occurs (constant, intermittent)
  - `severity_scale` (integer) - 1-10 pain/symptom scale
  - `context` (text) - circumstances surrounding onset
  - `associated_signs_symptoms` (text) - related findings
  - `narrative` (text) - free-text HPI narrative
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. review_of_systems
  Comprehensive review of body systems
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `visit_date` (date)
  - `created_by` (uuid, foreign key to users)
  
  -- Constitutional
  - `constitutional_fever` (boolean)
  - `constitutional_chills` (boolean)
  - `constitutional_weight_loss` (boolean)
  - `constitutional_weight_gain` (boolean)
  - `constitutional_fatigue` (boolean)
  - `constitutional_notes` (text)
  
  -- Eyes
  - `eyes_vision_changes` (boolean)
  - `eyes_pain` (boolean)
  - `eyes_redness` (boolean)
  - `eyes_discharge` (boolean)
  - `eyes_notes` (text)
  
  -- ENT (Ears, Nose, Throat)
  - `ent_hearing_loss` (boolean)
  - `ent_ear_pain` (boolean)
  - `ent_nasal_congestion` (boolean)
  - `ent_sore_throat` (boolean)
  - `ent_sinus_pain` (boolean)
  - `ent_notes` (text)
  
  -- Cardiovascular
  - `cardiovascular_chest_pain` (boolean)
  - `cardiovascular_palpitations` (boolean)
  - `cardiovascular_edema` (boolean)
  - `cardiovascular_orthopnea` (boolean)
  - `cardiovascular_notes` (text)
  
  -- Respiratory
  - `respiratory_shortness_of_breath` (boolean)
  - `respiratory_cough` (boolean)
  - `respiratory_wheezing` (boolean)
  - `respiratory_sputum` (boolean)
  - `respiratory_notes` (text)
  
  -- Gastrointestinal
  - `gi_nausea` (boolean)
  - `gi_vomiting` (boolean)
  - `gi_diarrhea` (boolean)
  - `gi_constipation` (boolean)
  - `gi_abdominal_pain` (boolean)
  - `gi_blood_in_stool` (boolean)
  - `gi_notes` (text)
  
  -- Genitourinary
  - `gu_dysuria` (boolean)
  - `gu_frequency` (boolean)
  - `gu_urgency` (boolean)
  - `gu_hematuria` (boolean)
  - `gu_incontinence` (boolean)
  - `gu_notes` (text)
  
  -- Musculoskeletal
  - `musculoskeletal_joint_pain` (boolean)
  - `musculoskeletal_muscle_pain` (boolean)
  - `musculoskeletal_stiffness` (boolean)
  - `musculoskeletal_swelling` (boolean)
  - `musculoskeletal_notes` (text)
  
  -- Skin
  - `skin_rash` (boolean)
  - `skin_itching` (boolean)
  - `skin_lesions` (boolean)
  - `skin_bruising` (boolean)
  - `skin_notes` (text)
  
  -- Neurological
  - `neurological_headache` (boolean)
  - `neurological_dizziness` (boolean)
  - `neurological_numbness` (boolean)
  - `neurological_weakness` (boolean)
  - `neurological_seizures` (boolean)
  - `neurological_notes` (text)
  
  -- Psychiatric
  - `psychiatric_depression` (boolean)
  - `psychiatric_anxiety` (boolean)
  - `psychiatric_sleep_disturbance` (boolean)
  - `psychiatric_mood_changes` (boolean)
  - `psychiatric_notes` (text)
  
  -- Endocrine
  - `endocrine_heat_intolerance` (boolean)
  - `endocrine_cold_intolerance` (boolean)
  - `endocrine_excessive_thirst` (boolean)
  - `endocrine_excessive_urination` (boolean)
  - `endocrine_notes` (text)
  
  -- Hematologic/Lymphatic
  - `hematologic_easy_bruising` (boolean)
  - `hematologic_easy_bleeding` (boolean)
  - `hematologic_lymph_node_swelling` (boolean)
  - `hematologic_notes` (text)
  
  -- Allergic/Immunologic
  - `allergic_seasonal_allergies` (boolean)
  - `allergic_frequent_infections` (boolean)
  - `allergic_notes` (text)
  
  - `all_systems_negative` (boolean) - quick mark all as negative
  - `general_notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies restrict access to users within the same clinic
  - All modifications tracked via created_by and timestamps
*/

-- Create chief_complaints table
CREATE TABLE IF NOT EXISTS chief_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  complaint text NOT NULL,
  duration text,
  severity text CHECK (severity IN ('mild', 'moderate', 'severe')),
  associated_symptoms text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create history_present_illness table
CREATE TABLE IF NOT EXISTS history_present_illness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint_id uuid REFERENCES chief_complaints(id) ON DELETE SET NULL,
  onset text,
  location text,
  duration text,
  character text,
  aggravating_factors text,
  relieving_factors text,
  timing text,
  severity_scale integer CHECK (severity_scale BETWEEN 1 AND 10),
  context text,
  associated_signs_symptoms text,
  narrative text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create review_of_systems table
CREATE TABLE IF NOT EXISTS review_of_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL REFERENCES users(id),
  
  -- Constitutional
  constitutional_fever boolean DEFAULT false,
  constitutional_chills boolean DEFAULT false,
  constitutional_weight_loss boolean DEFAULT false,
  constitutional_weight_gain boolean DEFAULT false,
  constitutional_fatigue boolean DEFAULT false,
  constitutional_notes text,
  
  -- Eyes
  eyes_vision_changes boolean DEFAULT false,
  eyes_pain boolean DEFAULT false,
  eyes_redness boolean DEFAULT false,
  eyes_discharge boolean DEFAULT false,
  eyes_notes text,
  
  -- ENT
  ent_hearing_loss boolean DEFAULT false,
  ent_ear_pain boolean DEFAULT false,
  ent_nasal_congestion boolean DEFAULT false,
  ent_sore_throat boolean DEFAULT false,
  ent_sinus_pain boolean DEFAULT false,
  ent_notes text,
  
  -- Cardiovascular
  cardiovascular_chest_pain boolean DEFAULT false,
  cardiovascular_palpitations boolean DEFAULT false,
  cardiovascular_edema boolean DEFAULT false,
  cardiovascular_orthopnea boolean DEFAULT false,
  cardiovascular_notes text,
  
  -- Respiratory
  respiratory_shortness_of_breath boolean DEFAULT false,
  respiratory_cough boolean DEFAULT false,
  respiratory_wheezing boolean DEFAULT false,
  respiratory_sputum boolean DEFAULT false,
  respiratory_notes text,
  
  -- Gastrointestinal
  gi_nausea boolean DEFAULT false,
  gi_vomiting boolean DEFAULT false,
  gi_diarrhea boolean DEFAULT false,
  gi_constipation boolean DEFAULT false,
  gi_abdominal_pain boolean DEFAULT false,
  gi_blood_in_stool boolean DEFAULT false,
  gi_notes text,
  
  -- Genitourinary
  gu_dysuria boolean DEFAULT false,
  gu_frequency boolean DEFAULT false,
  gu_urgency boolean DEFAULT false,
  gu_hematuria boolean DEFAULT false,
  gu_incontinence boolean DEFAULT false,
  gu_notes text,
  
  -- Musculoskeletal
  musculoskeletal_joint_pain boolean DEFAULT false,
  musculoskeletal_muscle_pain boolean DEFAULT false,
  musculoskeletal_stiffness boolean DEFAULT false,
  musculoskeletal_swelling boolean DEFAULT false,
  musculoskeletal_notes text,
  
  -- Skin
  skin_rash boolean DEFAULT false,
  skin_itching boolean DEFAULT false,
  skin_lesions boolean DEFAULT false,
  skin_bruising boolean DEFAULT false,
  skin_notes text,
  
  -- Neurological
  neurological_headache boolean DEFAULT false,
  neurological_dizziness boolean DEFAULT false,
  neurological_numbness boolean DEFAULT false,
  neurological_weakness boolean DEFAULT false,
  neurological_seizures boolean DEFAULT false,
  neurological_notes text,
  
  -- Psychiatric
  psychiatric_depression boolean DEFAULT false,
  psychiatric_anxiety boolean DEFAULT false,
  psychiatric_sleep_disturbance boolean DEFAULT false,
  psychiatric_mood_changes boolean DEFAULT false,
  psychiatric_notes text,
  
  -- Endocrine
  endocrine_heat_intolerance boolean DEFAULT false,
  endocrine_cold_intolerance boolean DEFAULT false,
  endocrine_excessive_thirst boolean DEFAULT false,
  endocrine_excessive_urination boolean DEFAULT false,
  endocrine_notes text,
  
  -- Hematologic/Lymphatic
  hematologic_easy_bruising boolean DEFAULT false,
  hematologic_easy_bleeding boolean DEFAULT false,
  hematologic_lymph_node_swelling boolean DEFAULT false,
  hematologic_notes text,
  
  -- Allergic/Immunologic
  allergic_seasonal_allergies boolean DEFAULT false,
  allergic_frequent_infections boolean DEFAULT false,
  allergic_notes text,
  
  -- General
  all_systems_negative boolean DEFAULT false,
  general_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chief_complaints_patient ON chief_complaints(patient_id);
CREATE INDEX IF NOT EXISTS idx_chief_complaints_clinic ON chief_complaints(clinic_id);
CREATE INDEX IF NOT EXISTS idx_chief_complaints_visit_date ON chief_complaints(visit_date);

CREATE INDEX IF NOT EXISTS idx_hpi_patient ON history_present_illness(patient_id);
CREATE INDEX IF NOT EXISTS idx_hpi_clinic ON history_present_illness(clinic_id);
CREATE INDEX IF NOT EXISTS idx_hpi_visit_date ON history_present_illness(visit_date);
CREATE INDEX IF NOT EXISTS idx_hpi_chief_complaint ON history_present_illness(chief_complaint_id);

CREATE INDEX IF NOT EXISTS idx_ros_patient ON review_of_systems(patient_id);
CREATE INDEX IF NOT EXISTS idx_ros_clinic ON review_of_systems(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ros_visit_date ON review_of_systems(visit_date);

-- Enable Row Level Security
ALTER TABLE chief_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_present_illness ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_of_systems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chief_complaints
CREATE POLICY "Users can view chief complaints for patients in their clinic"
  ON chief_complaints FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create chief complaints for patients in their clinic"
  ON chief_complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update chief complaints in their clinic"
  ON chief_complaints FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete chief complaints in their clinic"
  ON chief_complaints FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for history_present_illness
CREATE POLICY "Users can view HPI for patients in their clinic"
  ON history_present_illness FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create HPI for patients in their clinic"
  ON history_present_illness FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update HPI in their clinic"
  ON history_present_illness FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete HPI in their clinic"
  ON history_present_illness FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for review_of_systems
CREATE POLICY "Users can view ROS for patients in their clinic"
  ON review_of_systems FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create ROS for patients in their clinic"
  ON review_of_systems FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update ROS in their clinic"
  ON review_of_systems FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete ROS in their clinic"
  ON review_of_systems FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_chief_complaints_updated_at ON chief_complaints;
CREATE TRIGGER update_chief_complaints_updated_at
  BEFORE UPDATE ON chief_complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hpi_updated_at ON history_present_illness;
CREATE TRIGGER update_hpi_updated_at
  BEFORE UPDATE ON history_present_illness
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ros_updated_at ON review_of_systems;
CREATE TRIGGER update_ros_updated_at
  BEFORE UPDATE ON review_of_systems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
