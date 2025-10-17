/*
  # Patient Charting Phase 1.1 & 1.2 - Core Patient Chart Foundation

  ## Overview
  Creates comprehensive patient charting infrastructure for functional medicine EMR:
  - Patient Intake System (medical, family, social history)
  - Allergy Management (structured tracking)
  - Immunization Records
  - Vital Signs (time-series data)
  - Physical Examinations

  ## New Tables

  ### 1. patient_intake
  Comprehensive initial patient intake data
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `intake_date` (date)
  - `chief_complaint` (text)
  - `reason_for_visit` (text)
  - `current_medications` (jsonb) - structured list
  - `current_supplements` (jsonb) - structured list
  - `past_surgeries` (jsonb) - structured list
  - `hospitalizations` (jsonb) - structured list
  - `insurance_info` (jsonb)
  - `emergency_contact` (jsonb)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. patient_medical_history
  Past medical history tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `condition` (text) - diagnosis/condition name
  - `icd10_code` (text) - optional ICD-10 code
  - `onset_date` (date) - when condition started
  - `resolution_date` (date) - when resolved (if applicable)
  - `status` (text) - active, resolved, chronic
  - `severity` (text) - mild, moderate, severe
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. patient_family_history
  Family medical history with relationships
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `relationship` (text) - mother, father, sibling, grandparent, etc.
  - `condition` (text)
  - `age_of_onset` (integer)
  - `current_status` (text) - living, deceased
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. patient_social_history
  Social determinants and lifestyle factors
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `effective_date` (date) - when this history was captured
  - `occupation` (text)
  - `education_level` (text)
  - `marital_status` (text)
  - `living_situation` (text)
  - `smoking_status` (text) - never, former, current
  - `smoking_pack_years` (numeric)
  - `alcohol_use` (text) - none, occasional, moderate, heavy
  - `alcohol_drinks_per_week` (integer)
  - `recreational_drugs` (text)
  - `exercise_frequency` (text)
  - `exercise_type` (text)
  - `diet_type` (text) - standard, vegetarian, vegan, paleo, etc.
  - `sleep_hours` (numeric)
  - `stress_level` (text) - low, moderate, high
  - `sexual_activity` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. patient_allergies
  Structured allergy tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `allergen` (text) - substance name
  - `allergen_type` (text) - medication, food, environmental, other
  - `reaction` (text) - description of reaction
  - `severity` (text) - mild, moderate, severe, life-threatening
  - `onset_date` (date)
  - `status` (text) - active, inactive, resolved
  - `verified` (boolean) - whether allergy has been verified
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. patient_immunizations
  Immunization records
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `administered_by` (uuid, foreign key to users)
  - `vaccine_name` (text)
  - `vaccine_code` (text) - CVX code
  - `dose_number` (integer)
  - `administration_date` (date)
  - `administration_site` (text) - left arm, right arm, etc.
  - `lot_number` (text)
  - `manufacturer` (text)
  - `expiration_date` (date)
  - `route` (text) - IM, oral, nasal, etc.
  - `dose_amount` (text)
  - `reaction` (text) - any adverse reaction
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. vital_signs
  Time-series vital signs data
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `recorded_by` (uuid, foreign key to users)
  - `recorded_at` (timestamptz) - when vitals were taken
  - `height_cm` (numeric)
  - `weight_kg` (numeric)
  - `bmi` (numeric) - calculated
  - `temperature_c` (numeric)
  - `heart_rate_bpm` (integer)
  - `blood_pressure_systolic` (integer)
  - `blood_pressure_diastolic` (integer)
  - `respiratory_rate` (integer)
  - `oxygen_saturation` (integer)
  - `pain_scale` (integer) - 0-10 scale
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 8. physical_exams
  Physical examination findings
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `performed_by` (uuid, foreign key to users)
  - `exam_date` (date)
  - `general_appearance` (text)
  - `head_eyes_ears_nose_throat` (text) - HEENT
  - `cardiovascular` (text)
  - `respiratory` (text)
  - `gastrointestinal` (text)
  - `musculoskeletal` (text)
  - `neurological` (text)
  - `skin` (text)
  - `psychiatric` (text)
  - `other_systems` (jsonb) - flexible for additional systems
  - `summary` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies restrict access to users within the same clinic
  - Audit logging for all modifications
  - Created_by/recorded_by tracks who entered the data
*/

-- Create patient_intake table
CREATE TABLE IF NOT EXISTS patient_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  intake_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint text,
  reason_for_visit text,
  current_medications jsonb DEFAULT '[]'::jsonb,
  current_supplements jsonb DEFAULT '[]'::jsonb,
  past_surgeries jsonb DEFAULT '[]'::jsonb,
  hospitalizations jsonb DEFAULT '[]'::jsonb,
  insurance_info jsonb,
  emergency_contact jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_medical_history table
CREATE TABLE IF NOT EXISTS patient_medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  condition text NOT NULL,
  icd10_code text,
  onset_date date,
  resolution_date date,
  status text DEFAULT 'active',
  severity text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_family_history table
CREATE TABLE IF NOT EXISTS patient_family_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  relationship text NOT NULL,
  condition text NOT NULL,
  age_of_onset integer,
  current_status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_social_history table
CREATE TABLE IF NOT EXISTS patient_social_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  occupation text,
  education_level text,
  marital_status text,
  living_situation text,
  smoking_status text,
  smoking_pack_years numeric,
  alcohol_use text,
  alcohol_drinks_per_week integer,
  recreational_drugs text,
  exercise_frequency text,
  exercise_type text,
  diet_type text,
  sleep_hours numeric,
  stress_level text,
  sexual_activity text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_allergies table
CREATE TABLE IF NOT EXISTS patient_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  allergen text NOT NULL,
  allergen_type text NOT NULL,
  reaction text NOT NULL,
  severity text NOT NULL,
  onset_date date,
  status text DEFAULT 'active',
  verified boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_immunizations table
CREATE TABLE IF NOT EXISTS patient_immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  administered_by uuid NOT NULL REFERENCES users(id),
  vaccine_name text NOT NULL,
  vaccine_code text,
  dose_number integer,
  administration_date date NOT NULL,
  administration_site text,
  lot_number text,
  manufacturer text,
  expiration_date date,
  route text,
  dose_amount text,
  reaction text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  recorded_by uuid NOT NULL REFERENCES users(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  height_cm numeric,
  weight_kg numeric,
  bmi numeric,
  temperature_c numeric,
  heart_rate_bpm integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  respiratory_rate integer,
  oxygen_saturation integer,
  pain_scale integer CHECK (pain_scale BETWEEN 0 AND 10),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create physical_exams table
CREATE TABLE IF NOT EXISTS physical_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  performed_by uuid NOT NULL REFERENCES users(id),
  exam_date date NOT NULL DEFAULT CURRENT_DATE,
  general_appearance text,
  head_eyes_ears_nose_throat text,
  cardiovascular text,
  respiratory text,
  gastrointestinal text,
  musculoskeletal text,
  neurological text,
  skin text,
  psychiatric text,
  other_systems jsonb DEFAULT '{}'::jsonb,
  summary text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_intake_patient ON patient_intake(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_intake_clinic ON patient_intake(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON patient_medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_clinic ON patient_medical_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_family_history_patient ON patient_family_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_history_clinic ON patient_family_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_social_history_patient ON patient_social_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_social_history_clinic ON patient_social_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_clinic ON patient_allergies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_patient ON patient_immunizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_clinic ON patient_immunizations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_clinic ON vital_signs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_physical_exams_patient ON physical_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_physical_exams_clinic ON physical_exams(clinic_id);

-- Enable Row Level Security
ALTER TABLE patient_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_social_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_intake
CREATE POLICY "Users can view intake data for patients in their clinic"
  ON patient_intake FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create intake data for patients in their clinic"
  ON patient_intake FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update intake data in their clinic"
  ON patient_intake FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete intake data in their clinic"
  ON patient_intake FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for patient_medical_history
CREATE POLICY "Users can view medical history for patients in their clinic"
  ON patient_medical_history FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create medical history for patients in their clinic"
  ON patient_medical_history FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update medical history in their clinic"
  ON patient_medical_history FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete medical history in their clinic"
  ON patient_medical_history FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for patient_family_history
CREATE POLICY "Users can view family history for patients in their clinic"
  ON patient_family_history FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create family history for patients in their clinic"
  ON patient_family_history FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update family history in their clinic"
  ON patient_family_history FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete family history in their clinic"
  ON patient_family_history FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for patient_social_history
CREATE POLICY "Users can view social history for patients in their clinic"
  ON patient_social_history FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create social history for patients in their clinic"
  ON patient_social_history FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update social history in their clinic"
  ON patient_social_history FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete social history in their clinic"
  ON patient_social_history FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for patient_allergies
CREATE POLICY "Users can view allergies for patients in their clinic"
  ON patient_allergies FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create allergies for patients in their clinic"
  ON patient_allergies FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update allergies in their clinic"
  ON patient_allergies FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete allergies in their clinic"
  ON patient_allergies FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for patient_immunizations
CREATE POLICY "Users can view immunizations for patients in their clinic"
  ON patient_immunizations FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create immunizations for patients in their clinic"
  ON patient_immunizations FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update immunizations in their clinic"
  ON patient_immunizations FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete immunizations in their clinic"
  ON patient_immunizations FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for vital_signs
CREATE POLICY "Users can view vital signs for patients in their clinic"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create vital signs for patients in their clinic"
  ON vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update vital signs in their clinic"
  ON vital_signs FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete vital signs in their clinic"
  ON vital_signs FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for physical_exams
CREATE POLICY "Users can view physical exams for patients in their clinic"
  ON physical_exams FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create physical exams for patients in their clinic"
  ON physical_exams FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update physical exams in their clinic"
  ON physical_exams FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete physical exams in their clinic"
  ON physical_exams FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- Create function to automatically calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.height_cm > 0 AND NEW.weight_kg > 0 THEN
    NEW.bmi := ROUND((NEW.weight_kg / ((NEW.height_cm / 100.0) * (NEW.height_cm / 100.0)))::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate BMI on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_bmi ON vital_signs;
CREATE TRIGGER trigger_calculate_bmi
  BEFORE INSERT OR UPDATE ON vital_signs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bmi();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_patient_intake_updated_at ON patient_intake;
CREATE TRIGGER update_patient_intake_updated_at
  BEFORE UPDATE ON patient_intake
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_history_updated_at ON patient_medical_history;
CREATE TRIGGER update_medical_history_updated_at
  BEFORE UPDATE ON patient_medical_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_history_updated_at ON patient_family_history;
CREATE TRIGGER update_family_history_updated_at
  BEFORE UPDATE ON patient_family_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_history_updated_at ON patient_social_history;
CREATE TRIGGER update_social_history_updated_at
  BEFORE UPDATE ON patient_social_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_allergies_updated_at ON patient_allergies;
CREATE TRIGGER update_allergies_updated_at
  BEFORE UPDATE ON patient_allergies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_immunizations_updated_at ON patient_immunizations;
CREATE TRIGGER update_immunizations_updated_at
  BEFORE UPDATE ON patient_immunizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_physical_exams_updated_at ON physical_exams;
CREATE TRIGGER update_physical_exams_updated_at
  BEFORE UPDATE ON physical_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
