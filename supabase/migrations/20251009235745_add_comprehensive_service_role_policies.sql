/*
  # Add Comprehensive Service Role Policies for Data Seeding

  1. Purpose
    - Allow service role to insert/update test data into all patient-related tables
    - These policies enable data seeding scripts to work properly
    
  2. Tables Affected
    - All patient charting and clinical data tables
    
  3. Security Notes
    - Service role key should only be used in trusted server-side scripts
    - These policies only apply to service_role, not to regular authenticated users
*/

-- Drop existing service role policies
DROP POLICY IF EXISTS "Service role full access vital signs" ON vital_signs;
DROP POLICY IF EXISTS "Service role full access allergies" ON patient_allergies;
DROP POLICY IF EXISTS "Service role full access immunizations" ON patient_immunizations;
DROP POLICY IF EXISTS "Service role full access clinical assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Service role full access problem list" ON problem_list;
DROP POLICY IF EXISTS "Service role full access treatment plans" ON treatment_plan_items;
DROP POLICY IF EXISTS "Service role full access ifm assessments" ON ifm_matrix_assessments;
DROP POLICY IF EXISTS "Service role full access lifestyle assessments" ON lifestyle_assessments;
DROP POLICY IF EXISTS "Service role full access labs" ON labs;
DROP POLICY IF EXISTS "Service role full access supplements" ON supplements;
DROP POLICY IF EXISTS "Service role full access medications" ON medications;
DROP POLICY IF EXISTS "Service role full access health goals" ON health_goals;
DROP POLICY IF EXISTS "Service role full access food sensitivities" ON food_sensitivities;
DROP POLICY IF EXISTS "Service role full access timeline events" ON timeline_events;

-- Vital Signs
CREATE POLICY "Service role full access vital signs"
  ON vital_signs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patient Allergies
CREATE POLICY "Service role full access allergies"
  ON patient_allergies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patient Immunizations
CREATE POLICY "Service role full access immunizations"
  ON patient_immunizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clinical Assessments
CREATE POLICY "Service role full access clinical assessments"
  ON clinical_assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Problem List
CREATE POLICY "Service role full access problem list"
  ON problem_list FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Treatment Plan Items
CREATE POLICY "Service role full access treatment plans"
  ON treatment_plan_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- IFM Matrix Assessments
CREATE POLICY "Service role full access ifm assessments"
  ON ifm_matrix_assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Lifestyle Assessments
CREATE POLICY "Service role full access lifestyle assessments"
  ON lifestyle_assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Labs
CREATE POLICY "Service role full access labs"
  ON labs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Supplements
CREATE POLICY "Service role full access supplements"
  ON supplements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Medications
CREATE POLICY "Service role full access medications"
  ON medications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Health Goals
CREATE POLICY "Service role full access health goals"
  ON health_goals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Food Sensitivities
CREATE POLICY "Service role full access food sensitivities"
  ON food_sensitivities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Timeline Events
CREATE POLICY "Service role full access timeline events"
  ON timeline_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
