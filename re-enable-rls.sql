/*
  # Re-enable RLS After Data Seeding

  IMPORTANT: Run this immediately after data seeding completes!

  This re-enables Row Level Security on all tables that were temporarily
  disabled for bulk data insertion.
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

-- Clear the comment
COMMENT ON TABLE vital_signs IS NULL;

SELECT 'RLS has been re-enabled on all patient data tables' AS status;
