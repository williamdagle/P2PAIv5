/*
  # Re-enable RLS After Data Seeding

  IMPORTANT: This re-enables Row Level Security on all tables that were temporarily
  disabled for bulk data insertion.

  1. Security
    - Re-enables RLS on all patient data tables
    - All existing RLS policies remain in place and are now enforced
    - This is critical for HIPAA compliance and data security
*/

-- Re-enable RLS on all tables
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ifm_matrix_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_sensitivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Clear the temporary comment
COMMENT ON TABLE vital_signs IS NULL;
