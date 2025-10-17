/*
  # Grant Service Role Permissions on All Tables

  1. Purpose
    - Grant INSERT, SELECT, UPDATE, DELETE permissions to service_role on all patient data tables
    - This is required for data seeding scripts to work
    
  2. Security
    - Service role key should only be used in trusted server-side scripts
    - These permissions allow service role to bypass RLS when needed
*/

-- Grant all permissions to service_role on patient data tables
GRANT ALL ON vital_signs TO service_role;
GRANT ALL ON patient_allergies TO service_role;
GRANT ALL ON patient_immunizations TO service_role;
GRANT ALL ON clinical_assessments TO service_role;
GRANT ALL ON problem_list TO service_role;
GRANT ALL ON treatment_plan_items TO service_role;
GRANT ALL ON ifm_matrix_assessments TO service_role;
GRANT ALL ON lifestyle_assessments TO service_role;
GRANT ALL ON labs TO service_role;
GRANT ALL ON supplements TO service_role;
GRANT ALL ON medications TO service_role;
GRANT ALL ON health_goals TO service_role;
GRANT ALL ON food_sensitivities TO service_role;
GRANT ALL ON timeline_events TO service_role;
GRANT ALL ON patients TO service_role;
GRANT ALL ON clinics TO service_role;
GRANT ALL ON users TO service_role;
