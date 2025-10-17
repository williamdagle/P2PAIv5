/*
  # Patient Charting Phase 3 - Assessment, Orders & Clinical Documentation

  ## Overview
  Implements the clinical decision-making and documentation components:
  - Clinical Assessments (differential diagnosis, problem lists, clinical reasoning)
  - Lab/Imaging Orders (ordering, tracking, results management)
  - Progress Notes (visit documentation, follow-up notes)
  - SOAP/APSO Notes (structured clinical documentation)

  ## New Tables

  ### 1. clinical_assessments
  Clinical assessment and differential diagnosis for each visit
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `visit_date` (date)
  - `chief_complaint_id` (uuid, foreign key to chief_complaints) - optional link
  - `primary_diagnosis` (text) - main diagnosis
  - `primary_diagnosis_icd10` (text) - ICD-10 code
  - `differential_diagnoses` (jsonb) - array of possible diagnoses with ICD-10 codes
  - `clinical_impression` (text) - provider's clinical reasoning
  - `assessment_summary` (text) - overall assessment
  - `risk_stratification` (text) - low, moderate, high
  - `prognosis` (text) - expected outcome
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. problem_list
  Active and resolved problem list for longitudinal tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `problem` (text) - problem description
  - `icd10_code` (text)
  - `snomed_code` (text) - optional SNOMED CT code
  - `onset_date` (date)
  - `resolution_date` (date)
  - `status` (text) - active, chronic, resolved, inactive
  - `severity` (text) - mild, moderate, severe
  - `priority` (integer) - 1 (highest) to 5 (lowest)
  - `notes` (text)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. treatment_plan_items
  Detailed treatment plan items linked to assessments
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `assessment_id` (uuid, foreign key to clinical_assessments)
  - `problem_id` (uuid, foreign key to problem_list) - optional
  - `intervention_type` (text) - medication, therapy, lifestyle, referral, monitoring, procedure
  - `intervention` (text) - detailed description
  - `rationale` (text) - clinical reasoning
  - `start_date` (date)
  - `end_date` (date)
  - `frequency` (text)
  - `status` (text) - planned, active, completed, discontinued
  - `outcome` (text)
  - `notes` (text)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. lab_orders
  Laboratory test orders and tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `ordered_by` (uuid, foreign key to users)
  - `order_date` (date)
  - `test_name` (text) - name of test
  - `test_code` (text) - CPT or LOINC code
  - `test_category` (text) - chemistry, hematology, microbiology, pathology, etc.
  - `priority` (text) - routine, urgent, stat
  - `clinical_indication` (text) - reason for test
  - `icd10_codes` (text[]) - diagnosis codes for billing
  - `specimen_type` (text) - blood, urine, tissue, etc.
  - `collection_date` (timestamptz)
  - `order_status` (text) - ordered, collected, in_lab, resulted, reviewed
  - `lab_name` (text) - external lab name
  - `lab_order_number` (text) - external reference
  - `fasting_required` (boolean)
  - `special_instructions` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. lab_results
  Laboratory test results
  - `id` (uuid, primary key)
  - `lab_order_id` (uuid, foreign key to lab_orders)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `result_date` (timestamptz)
  - `test_component` (text) - specific test component name
  - `result_value` (text) - numeric or text result
  - `result_unit` (text) - mg/dL, mmol/L, etc.
  - `reference_range` (text) - normal range
  - `abnormal_flag` (text) - normal, low, high, critical_low, critical_high
  - `status` (text) - preliminary, final, corrected
  - `reviewed_by` (uuid, foreign key to users)
  - `reviewed_date` (timestamptz)
  - `review_notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. imaging_orders
  Imaging study orders (X-ray, MRI, CT, ultrasound, etc.)
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `ordered_by` (uuid, foreign key to users)
  - `order_date` (date)
  - `imaging_type` (text) - xray, ct, mri, ultrasound, pet, dexa, mammogram, other
  - `body_part` (text) - anatomical location
  - `laterality` (text) - left, right, bilateral, n/a
  - `procedure_code` (text) - CPT code
  - `clinical_indication` (text)
  - `icd10_codes` (text[])
  - `priority` (text) - routine, urgent, stat
  - `contrast_needed` (boolean)
  - `order_status` (text) - ordered, scheduled, completed, resulted, reviewed
  - `facility_name` (text)
  - `scheduled_date` (timestamptz)
  - `completed_date` (timestamptz)
  - `special_instructions` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. imaging_results
  Imaging study results and reports
  - `id` (uuid, primary key)
  - `imaging_order_id` (uuid, foreign key to imaging_orders)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `result_date` (timestamptz)
  - `radiologist_name` (text)
  - `findings` (text) - radiologist findings
  - `impression` (text) - clinical impression
  - `comparison_studies` (text) - compared to previous studies
  - `critical_finding` (boolean)
  - `status` (text) - preliminary, final, addendum
  - `reviewed_by` (uuid, foreign key to users)
  - `reviewed_date` (timestamptz)
  - `review_notes` (text)
  - `report_url` (text) - link to full report
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 8. progress_notes
  Clinical progress notes for visits and follow-ups
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `visit_date` (date)
  - `note_type` (text) - initial_visit, follow_up, phone_call, telehealth, hospital_visit, consultation
  - `visit_reason` (text)
  - `interval_history` (text) - changes since last visit
  - `response_to_treatment` (text)
  - `current_concerns` (text)
  - `provider_observations` (text)
  - `clinical_course` (text)
  - `follow_up_plan` (text)
  - `next_visit_interval` (text) - 1 week, 2 weeks, 1 month, etc.
  - `education_provided` (text)
  - `time_spent_minutes` (integer)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. soap_notes
  Structured SOAP format clinical notes
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `visit_date` (date)
  - `note_format` (text) - soap, apso
  - `chief_complaint_id` (uuid, foreign key to chief_complaints)
  - `assessment_id` (uuid, foreign key to clinical_assessments)
  
  -- SOAP Components
  - `subjective` (text) - patient's perspective, symptoms, HPI
  - `objective` (text) - vital signs, exam findings, test results
  - `assessment` (text) - diagnosis, clinical impression
  - `plan` (text) - treatment plan, orders, follow-up
  
  -- Additional metadata
  - `cpt_codes` (text[]) - billing codes
  - `visit_type` (text) - office, telehealth, hospital, home
  - `complexity_level` (text) - straightforward, low, moderate, high
  - `time_spent_minutes` (integer)
  - `counseling_minutes` (integer)
  - `is_signed` (boolean)
  - `signed_date` (timestamptz)
  - `addendum` (text) - late additions to note
  - `addendum_date` (timestamptz)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to users within the same clinic
  - All modifications tracked via created_by and timestamps
  - Critical results flagged for immediate review

  ## Indexes
  - Optimized for patient lookups and date-based queries
  - Status tracking for workflow management
  - Result review tracking for clinical safety
*/

-- =====================================================
-- 1. Clinical Assessments
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint_id uuid REFERENCES chief_complaints(id) ON DELETE SET NULL,
  primary_diagnosis text NOT NULL,
  primary_diagnosis_icd10 text,
  differential_diagnoses jsonb DEFAULT '[]'::jsonb,
  clinical_impression text,
  assessment_summary text,
  risk_stratification text CHECK (risk_stratification IN ('low', 'moderate', 'high')),
  prognosis text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_clinical_assessments_patient ON clinical_assessments(patient_id);
CREATE INDEX idx_clinical_assessments_clinic ON clinical_assessments(clinic_id);
CREATE INDEX idx_clinical_assessments_visit_date ON clinical_assessments(visit_date);
CREATE INDEX idx_clinical_assessments_chief_complaint ON clinical_assessments(chief_complaint_id);

-- =====================================================
-- 2. Problem List
-- =====================================================

CREATE TABLE IF NOT EXISTS problem_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  problem text NOT NULL,
  icd10_code text,
  snomed_code text,
  onset_date date,
  resolution_date date,
  status text NOT NULL CHECK (status IN ('active', 'chronic', 'resolved', 'inactive')) DEFAULT 'active',
  severity text CHECK (severity IN ('mild', 'moderate', 'severe')),
  priority integer CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_problem_list_patient ON problem_list(patient_id);
CREATE INDEX idx_problem_list_clinic ON problem_list(clinic_id);
CREATE INDEX idx_problem_list_status ON problem_list(status);
CREATE INDEX idx_problem_list_priority ON problem_list(priority);
CREATE INDEX idx_problem_list_active ON problem_list(patient_id, status) WHERE status IN ('active', 'chronic');

-- =====================================================
-- 3. Treatment Plan Items
-- =====================================================

CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES clinical_assessments(id) ON DELETE SET NULL,
  problem_id uuid REFERENCES problem_list(id) ON DELETE SET NULL,
  intervention_type text NOT NULL CHECK (intervention_type IN ('medication', 'therapy', 'lifestyle', 'referral', 'monitoring', 'procedure')),
  intervention text NOT NULL,
  rationale text,
  start_date date,
  end_date date,
  frequency text,
  status text NOT NULL CHECK (status IN ('planned', 'active', 'completed', 'discontinued')) DEFAULT 'planned',
  outcome text,
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_treatment_plan_items_patient ON treatment_plan_items(patient_id);
CREATE INDEX idx_treatment_plan_items_clinic ON treatment_plan_items(clinic_id);
CREATE INDEX idx_treatment_plan_items_assessment ON treatment_plan_items(assessment_id);
CREATE INDEX idx_treatment_plan_items_problem ON treatment_plan_items(problem_id);
CREATE INDEX idx_treatment_plan_items_status ON treatment_plan_items(status);

-- =====================================================
-- 4. Lab Orders
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  ordered_by uuid NOT NULL REFERENCES users(id),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  test_name text NOT NULL,
  test_code text,
  test_category text CHECK (test_category IN ('chemistry', 'hematology', 'microbiology', 'pathology', 'immunology', 'molecular', 'other')),
  priority text NOT NULL CHECK (priority IN ('routine', 'urgent', 'stat')) DEFAULT 'routine',
  clinical_indication text NOT NULL,
  icd10_codes text[] DEFAULT ARRAY[]::text[],
  specimen_type text,
  collection_date timestamptz,
  order_status text NOT NULL CHECK (order_status IN ('ordered', 'collected', 'in_lab', 'resulted', 'reviewed')) DEFAULT 'ordered',
  lab_name text,
  lab_order_number text,
  fasting_required boolean DEFAULT false,
  special_instructions text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_clinic ON lab_orders(clinic_id);
CREATE INDEX idx_lab_orders_ordered_by ON lab_orders(ordered_by);
CREATE INDEX idx_lab_orders_order_date ON lab_orders(order_date);
CREATE INDEX idx_lab_orders_status ON lab_orders(order_status);
CREATE INDEX idx_lab_orders_pending ON lab_orders(patient_id, order_status) WHERE order_status IN ('ordered', 'collected', 'in_lab');

-- =====================================================
-- 5. Lab Results
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  result_date timestamptz NOT NULL,
  test_component text NOT NULL,
  result_value text NOT NULL,
  result_unit text,
  reference_range text,
  abnormal_flag text CHECK (abnormal_flag IN ('normal', 'low', 'high', 'critical_low', 'critical_high')),
  status text NOT NULL CHECK (status IN ('preliminary', 'final', 'corrected')) DEFAULT 'final',
  reviewed_by uuid REFERENCES users(id),
  reviewed_date timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lab_results_order ON lab_results(lab_order_id);
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_lab_results_clinic ON lab_results(clinic_id);
CREATE INDEX idx_lab_results_result_date ON lab_results(result_date);
CREATE INDEX idx_lab_results_abnormal ON lab_results(abnormal_flag) WHERE abnormal_flag IN ('critical_low', 'critical_high');
CREATE INDEX idx_lab_results_unreviewed ON lab_results(reviewed_by) WHERE reviewed_by IS NULL;

-- =====================================================
-- 6. Imaging Orders
-- =====================================================

CREATE TABLE IF NOT EXISTS imaging_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  ordered_by uuid NOT NULL REFERENCES users(id),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  imaging_type text NOT NULL CHECK (imaging_type IN ('xray', 'ct', 'mri', 'ultrasound', 'pet', 'dexa', 'mammogram', 'other')),
  body_part text NOT NULL,
  laterality text CHECK (laterality IN ('left', 'right', 'bilateral', 'n/a')),
  procedure_code text,
  clinical_indication text NOT NULL,
  icd10_codes text[] DEFAULT ARRAY[]::text[],
  priority text NOT NULL CHECK (priority IN ('routine', 'urgent', 'stat')) DEFAULT 'routine',
  contrast_needed boolean DEFAULT false,
  order_status text NOT NULL CHECK (order_status IN ('ordered', 'scheduled', 'completed', 'resulted', 'reviewed')) DEFAULT 'ordered',
  facility_name text,
  scheduled_date timestamptz,
  completed_date timestamptz,
  special_instructions text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_imaging_orders_patient ON imaging_orders(patient_id);
CREATE INDEX idx_imaging_orders_clinic ON imaging_orders(clinic_id);
CREATE INDEX idx_imaging_orders_ordered_by ON imaging_orders(ordered_by);
CREATE INDEX idx_imaging_orders_order_date ON imaging_orders(order_date);
CREATE INDEX idx_imaging_orders_status ON imaging_orders(order_status);
CREATE INDEX idx_imaging_orders_scheduled ON imaging_orders(scheduled_date) WHERE order_status = 'scheduled';

-- =====================================================
-- 7. Imaging Results
-- =====================================================

CREATE TABLE IF NOT EXISTS imaging_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imaging_order_id uuid NOT NULL REFERENCES imaging_orders(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  result_date timestamptz NOT NULL,
  radiologist_name text,
  findings text NOT NULL,
  impression text NOT NULL,
  comparison_studies text,
  critical_finding boolean DEFAULT false,
  status text NOT NULL CHECK (status IN ('preliminary', 'final', 'addendum')) DEFAULT 'final',
  reviewed_by uuid REFERENCES users(id),
  reviewed_date timestamptz,
  review_notes text,
  report_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_imaging_results_order ON imaging_results(imaging_order_id);
CREATE INDEX idx_imaging_results_patient ON imaging_results(patient_id);
CREATE INDEX idx_imaging_results_clinic ON imaging_results(clinic_id);
CREATE INDEX idx_imaging_results_result_date ON imaging_results(result_date);
CREATE INDEX idx_imaging_results_critical ON imaging_results(critical_finding) WHERE critical_finding = true;
CREATE INDEX idx_imaging_results_unreviewed ON imaging_results(reviewed_by) WHERE reviewed_by IS NULL;

-- =====================================================
-- 8. Progress Notes
-- =====================================================

CREATE TABLE IF NOT EXISTS progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  note_type text NOT NULL CHECK (note_type IN ('initial_visit', 'follow_up', 'phone_call', 'telehealth', 'hospital_visit', 'consultation')),
  visit_reason text,
  interval_history text,
  response_to_treatment text,
  current_concerns text,
  provider_observations text,
  clinical_course text,
  follow_up_plan text,
  next_visit_interval text,
  education_provided text,
  time_spent_minutes integer,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_progress_notes_patient ON progress_notes(patient_id);
CREATE INDEX idx_progress_notes_clinic ON progress_notes(clinic_id);
CREATE INDEX idx_progress_notes_visit_date ON progress_notes(visit_date);
CREATE INDEX idx_progress_notes_type ON progress_notes(note_type);

-- =====================================================
-- 9. SOAP Notes
-- =====================================================

CREATE TABLE IF NOT EXISTS soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  note_format text NOT NULL CHECK (note_format IN ('soap', 'apso')) DEFAULT 'soap',
  chief_complaint_id uuid REFERENCES chief_complaints(id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES clinical_assessments(id) ON DELETE SET NULL,
  subjective text,
  objective text,
  assessment text,
  plan text,
  cpt_codes text[] DEFAULT ARRAY[]::text[],
  visit_type text CHECK (visit_type IN ('office', 'telehealth', 'hospital', 'home')),
  complexity_level text CHECK (complexity_level IN ('straightforward', 'low', 'moderate', 'high')),
  time_spent_minutes integer,
  counseling_minutes integer,
  is_signed boolean DEFAULT false,
  signed_date timestamptz,
  addendum text,
  addendum_date timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_soap_notes_patient ON soap_notes(patient_id);
CREATE INDEX idx_soap_notes_clinic ON soap_notes(clinic_id);
CREATE INDEX idx_soap_notes_visit_date ON soap_notes(visit_date);
CREATE INDEX idx_soap_notes_signed ON soap_notes(is_signed);
CREATE INDEX idx_soap_notes_unsigned ON soap_notes(created_by, is_signed) WHERE is_signed = false;

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Clinical Assessments
-- =====================================================

CREATE POLICY "Users can view clinical assessments in their clinic"
  ON clinical_assessments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create clinical assessments in their clinic"
  ON clinical_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update clinical assessments in their clinic"
  ON clinical_assessments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete clinical assessments in their clinic"
  ON clinical_assessments FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Problem List
-- =====================================================

CREATE POLICY "Users can view problem list in their clinic"
  ON problem_list FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create problem list items in their clinic"
  ON problem_list FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update problem list in their clinic"
  ON problem_list FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete problem list in their clinic"
  ON problem_list FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Treatment Plan Items
-- =====================================================

CREATE POLICY "Users can view treatment plan items in their clinic"
  ON treatment_plan_items FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create treatment plan items in their clinic"
  ON treatment_plan_items FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update treatment plan items in their clinic"
  ON treatment_plan_items FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete treatment plan items in their clinic"
  ON treatment_plan_items FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Lab Orders
-- =====================================================

CREATE POLICY "Users can view lab orders in their clinic"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create lab orders in their clinic"
  ON lab_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update lab orders in their clinic"
  ON lab_orders FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete lab orders in their clinic"
  ON lab_orders FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Lab Results
-- =====================================================

CREATE POLICY "Users can view lab results in their clinic"
  ON lab_results FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create lab results in their clinic"
  ON lab_results FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update lab results in their clinic"
  ON lab_results FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Imaging Orders
-- =====================================================

CREATE POLICY "Users can view imaging orders in their clinic"
  ON imaging_orders FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create imaging orders in their clinic"
  ON imaging_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update imaging orders in their clinic"
  ON imaging_orders FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete imaging orders in their clinic"
  ON imaging_orders FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Imaging Results
-- =====================================================

CREATE POLICY "Users can view imaging results in their clinic"
  ON imaging_results FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create imaging results in their clinic"
  ON imaging_results FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update imaging results in their clinic"
  ON imaging_results FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - Progress Notes
-- =====================================================

CREATE POLICY "Users can view progress notes in their clinic"
  ON progress_notes FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create progress notes in their clinic"
  ON progress_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update progress notes in their clinic"
  ON progress_notes FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete progress notes in their clinic"
  ON progress_notes FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- RLS Policies - SOAP Notes
-- =====================================================

CREATE POLICY "Users can view SOAP notes in their clinic"
  ON soap_notes FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create SOAP notes in their clinic"
  ON soap_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update SOAP notes in their clinic"
  ON soap_notes FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete SOAP notes in their clinic"
  ON soap_notes FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- =====================================================
-- Create triggers for updated_at
-- =====================================================

CREATE TRIGGER update_clinical_assessments_updated_at
  BEFORE UPDATE ON clinical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_list_updated_at
  BEFORE UPDATE ON problem_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plan_items_updated_at
  BEFORE UPDATE ON treatment_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_orders_updated_at
  BEFORE UPDATE ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at
  BEFORE UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imaging_orders_updated_at
  BEFORE UPDATE ON imaging_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imaging_results_updated_at
  BEFORE UPDATE ON imaging_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_notes_updated_at
  BEFORE UPDATE ON progress_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soap_notes_updated_at
  BEFORE UPDATE ON soap_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();