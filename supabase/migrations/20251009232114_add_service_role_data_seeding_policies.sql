/*
  # Add Temporary Service Role Policies for Data Seeding

  1. Purpose
    - Allow service role to insert test data into all tables
    - These policies will allow data seeding scripts to work properly
    
  2. Tables Affected
    - vital_signs
    - patient_allergies  
    - patient_immunizations
    
  3. Security Notes
    - Service role key should only be used in trusted server-side scripts
    - These policies supplement existing user-facing policies
*/

-- Drop existing service role policies if they exist
DROP POLICY IF EXISTS "Service role can insert vital signs" ON vital_signs;
DROP POLICY IF EXISTS "Service role can insert allergies" ON patient_allergies;
DROP POLICY IF EXISTS "Service role can insert immunizations" ON patient_immunizations;

-- Vital Signs: Allow service role to insert
CREATE POLICY "Service role can insert vital signs"
  ON vital_signs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Patient Allergies: Allow service role to insert
CREATE POLICY "Service role can insert allergies"
  ON patient_allergies FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Patient Immunizations: Allow service role to insert
CREATE POLICY "Service role can insert immunizations"
  ON patient_immunizations FOR INSERT
  TO service_role
  WITH CHECK (true);
