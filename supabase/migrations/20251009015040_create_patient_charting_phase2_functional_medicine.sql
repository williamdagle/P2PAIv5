/*
  # Patient Charting Phase 2 - Functional Medicine Features

  ## Overview
  Implements functional medicine-specific features for root cause analysis and holistic care:
  - Functional Medicine Timeline (life events, triggers, symptom onset)
  - IFM Matrix Model (7 functional body systems)
  - Lifestyle & Modifiable Factors (sleep, exercise, nutrition, stress, environment)
  - Health Goals & Patient Priorities (SMART goals, wellness plans)
  - Enhanced Food Sensitivities & Elimination Protocols

  ## New Tables

  ### 1. fm_timeline_events
  Chronological life story capturing events that may contribute to current health status
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `event_date` (date) - when the event occurred
  - `event_age` (numeric) - patient's age at event (calculated or entered)
  - `event_type` (text) - trauma, illness, exposure, stress, life_event, symptom_onset, treatment, other
  - `category` (text) - physical, emotional, environmental, genetic, lifestyle
  - `title` (text) - brief event description
  - `description` (text) - detailed narrative
  - `severity` (text) - mild, moderate, severe, life_threatening
  - `impact_on_health` (text) - how this event affected patient's health
  - `related_symptoms` (text[]) - symptoms that appeared after this event
  - `triggers_identified` (text[]) - identified triggers or contributing factors
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. ifm_matrix_assessments
  IFM Matrix system assessments - one record per patient per assessment date
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `assessment_date` (date)
  - `assessment_name` (text) - e.g., "Initial Assessment", "3-Month Follow-up"
  
  -- Assimilation System (digestion, absorption, microbiome)
  - `assimilation_status` (text) - optimal, suboptimal, impaired
  - `assimilation_findings` (text)
  - `assimilation_interventions` (text)
  
  -- Defense & Repair System (immune)
  - `defense_repair_status` (text)
  - `defense_repair_findings` (text)
  - `defense_repair_interventions` (text)
  
  -- Energy System (mitochondrial, thyroid, adrenal)
  - `energy_status` (text)
  - `energy_findings` (text)
  - `energy_interventions` (text)
  
  -- Biotransformation & Elimination System (detox)
  - `biotransformation_status` (text)
  - `biotransformation_findings` (text)
  - `biotransformation_interventions` (text)
  
  -- Transport System (cardiovascular, lymphatic)
  - `transport_status` (text)
  - `transport_findings` (text)
  - `transport_interventions` (text)
  
  -- Communication System (hormonal, neurotransmitter)
  - `communication_status` (text)
  - `communication_findings` (text)
  - `communication_interventions` (text)
  
  -- Structural Integrity System (musculoskeletal, cellular)
  - `structural_status` (text)
  - `structural_findings` (text)
  - `structural_interventions` (text)
  
  - `overall_summary` (text)
  - `priority_systems` (text[]) - which systems need immediate attention
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. lifestyle_assessments
  Comprehensive lifestyle and modifiable factors tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `assessment_date` (date)
  
  -- Sleep & Relaxation
  - `sleep_hours_average` (numeric)
  - `sleep_quality` (text) - poor, fair, good, excellent
  - `sleep_issues` (text[]) - insomnia, apnea, restless, etc.
  - `relaxation_practices` (text[]) - meditation, yoga, etc.
  - `relaxation_frequency` (text)
  - `sleep_notes` (text)
  
  -- Exercise & Movement
  - `exercise_frequency` (text) - daily, 3-5x/week, 1-2x/week, rarely, never
  - `exercise_types` (text[]) - cardio, strength, yoga, walking, etc.
  - `exercise_duration_minutes` (integer)
  - `movement_throughout_day` (text) - sedentary, light, moderate, active
  - `exercise_barriers` (text[])
  - `exercise_notes` (text)
  
  -- Nutrition & Hydration
  - `diet_type` (text) - standard, mediterranean, paleo, keto, vegan, vegetarian, other
  - `meals_per_day` (integer)
  - `water_intake_oz` (integer)
  - `caffeine_intake` (text)
  - `alcohol_frequency` (text)
  - `processed_food_frequency` (text)
  - `organic_food_percentage` (integer)
  - `nutrition_notes` (text)
  
  -- Stress & Resilience
  - `stress_level` (text) - low, mild, moderate, high, severe
  - `stress_sources` (text[]) - work, family, financial, health, etc.
  - `coping_mechanisms` (text[])
  - `resilience_score` (integer) - 1-10 scale
  - `mindfulness_practice` (boolean)
  - `stress_notes` (text)
  
  -- Relationships & Community
  - `social_support_level` (text) - strong, moderate, limited, isolated
  - `relationship_satisfaction` (text)
  - `community_involvement` (text)
  - `social_activities_frequency` (text)
  - `relationships_notes` (text)
  
  -- Environmental Factors
  - `home_environment_quality` (text)
  - `work_environment_quality` (text)
  - `mold_exposure` (boolean)
  - `toxin_exposure` (text[]) - chemicals, pesticides, heavy metals, etc.
  - `emf_exposure_level` (text)
  - `air_quality` (text)
  - `water_quality` (text)
  - `environmental_notes` (text)
  
  - `overall_notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. health_goals
  Patient health goals and SMART goal tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `goal_type` (text) - symptom_reduction, lifestyle_change, lab_improvement, wellness, functional_capacity
  - `priority` (text) - high, medium, low
  - `status` (text) - active, achieved, in_progress, paused, discontinued
  
  -- SMART Goal Components
  - `specific_goal` (text) - specific description
  - `measurable_criteria` (text) - how to measure success
  - `achievable_plan` (text) - action steps
  - `relevant_reason` (text) - why this matters to patient
  - `time_bound_deadline` (date) - target date
  
  - `baseline_value` (text) - starting point measurement
  - `target_value` (text) - desired outcome
  - `current_value` (text) - current measurement
  - `progress_percentage` (integer) - 0-100
  
  - `barriers` (text[]) - obstacles to achieving goal
  - `support_needed` (text[]) - resources or help needed
  - `milestones` (jsonb) - intermediate checkpoints
  - `achieved_date` (date)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. food_sensitivities
  Detailed food sensitivity and elimination protocol tracking
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `food_item` (text)
  - `sensitivity_type` (text) - allergy, intolerance, sensitivity, suspected
  - `reaction_symptoms` (text[])
  - `reaction_severity` (text) - mild, moderate, severe
  - `reaction_onset_time` (text) - immediate, 30min, hours, days
  - `testing_method` (text) - IgE, IgG, elimination_diet, clinical_observation
  - `test_date` (date)
  - `status` (text) - active, resolved, monitoring, eliminated
  - `elimination_start_date` (date)
  - `reintroduction_date` (date)
  - `reintroduction_outcome` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. elimination_protocols
  Structured elimination and reintroduction protocols
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `clinic_id` (uuid, foreign key to clinics)
  - `created_by` (uuid, foreign key to users)
  - `protocol_name` (text) - e.g., "Standard Elimination Diet", "AIP Protocol"
  - `start_date` (date)
  - `planned_duration_days` (integer)
  - `end_date` (date)
  - `status` (text) - planned, active, reintroduction_phase, completed, discontinued
  - `foods_eliminated` (text[])
  - `baseline_symptoms` (jsonb) - symptoms before starting
  - `symptom_improvements` (jsonb) - improvements noted during elimination
  - `reintroduction_schedule` (jsonb) - planned reintroduction order
  - `reintroduction_results` (jsonb) - outcomes of each reintroduction
  - `outcomes_summary` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies restrict access to users within the same clinic
  - Comprehensive audit trail with created_by and timestamps
*/

-- Create fm_timeline_events table
CREATE TABLE IF NOT EXISTS fm_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  event_date date NOT NULL,
  event_age numeric,
  event_type text NOT NULL CHECK (event_type IN ('trauma', 'illness', 'exposure', 'stress', 'life_event', 'symptom_onset', 'treatment', 'other')),
  category text CHECK (category IN ('physical', 'emotional', 'environmental', 'genetic', 'lifestyle')),
  title text NOT NULL,
  description text,
  severity text CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  impact_on_health text,
  related_symptoms text[] DEFAULT ARRAY[]::text[],
  triggers_identified text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ifm_matrix_assessments table
CREATE TABLE IF NOT EXISTS ifm_matrix_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  assessment_name text,
  
  assimilation_status text CHECK (assimilation_status IN ('optimal', 'suboptimal', 'impaired')),
  assimilation_findings text,
  assimilation_interventions text,
  
  defense_repair_status text CHECK (defense_repair_status IN ('optimal', 'suboptimal', 'impaired')),
  defense_repair_findings text,
  defense_repair_interventions text,
  
  energy_status text CHECK (energy_status IN ('optimal', 'suboptimal', 'impaired')),
  energy_findings text,
  energy_interventions text,
  
  biotransformation_status text CHECK (biotransformation_status IN ('optimal', 'suboptimal', 'impaired')),
  biotransformation_findings text,
  biotransformation_interventions text,
  
  transport_status text CHECK (transport_status IN ('optimal', 'suboptimal', 'impaired')),
  transport_findings text,
  transport_interventions text,
  
  communication_status text CHECK (communication_status IN ('optimal', 'suboptimal', 'impaired')),
  communication_findings text,
  communication_interventions text,
  
  structural_status text CHECK (structural_status IN ('optimal', 'suboptimal', 'impaired')),
  structural_findings text,
  structural_interventions text,
  
  overall_summary text,
  priority_systems text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lifestyle_assessments table
CREATE TABLE IF NOT EXISTS lifestyle_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  
  sleep_hours_average numeric,
  sleep_quality text CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  sleep_issues text[] DEFAULT ARRAY[]::text[],
  relaxation_practices text[] DEFAULT ARRAY[]::text[],
  relaxation_frequency text,
  sleep_notes text,
  
  exercise_frequency text,
  exercise_types text[] DEFAULT ARRAY[]::text[],
  exercise_duration_minutes integer,
  movement_throughout_day text CHECK (movement_throughout_day IN ('sedentary', 'light', 'moderate', 'active')),
  exercise_barriers text[] DEFAULT ARRAY[]::text[],
  exercise_notes text,
  
  diet_type text,
  meals_per_day integer,
  water_intake_oz integer,
  caffeine_intake text,
  alcohol_frequency text,
  processed_food_frequency text,
  organic_food_percentage integer CHECK (organic_food_percentage BETWEEN 0 AND 100),
  nutrition_notes text,
  
  stress_level text CHECK (stress_level IN ('low', 'mild', 'moderate', 'high', 'severe')),
  stress_sources text[] DEFAULT ARRAY[]::text[],
  coping_mechanisms text[] DEFAULT ARRAY[]::text[],
  resilience_score integer CHECK (resilience_score BETWEEN 1 AND 10),
  mindfulness_practice boolean DEFAULT false,
  stress_notes text,
  
  social_support_level text CHECK (social_support_level IN ('strong', 'moderate', 'limited', 'isolated')),
  relationship_satisfaction text,
  community_involvement text,
  social_activities_frequency text,
  relationships_notes text,
  
  home_environment_quality text,
  work_environment_quality text,
  mold_exposure boolean DEFAULT false,
  toxin_exposure text[] DEFAULT ARRAY[]::text[],
  emf_exposure_level text,
  air_quality text,
  water_quality text,
  environmental_notes text,
  
  overall_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create health_goals table
CREATE TABLE IF NOT EXISTS health_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  goal_type text CHECK (goal_type IN ('symptom_reduction', 'lifestyle_change', 'lab_improvement', 'wellness', 'functional_capacity')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'in_progress', 'paused', 'discontinued')),
  
  specific_goal text NOT NULL,
  measurable_criteria text,
  achievable_plan text,
  relevant_reason text,
  time_bound_deadline date,
  
  baseline_value text,
  target_value text,
  current_value text,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  barriers text[] DEFAULT ARRAY[]::text[],
  support_needed text[] DEFAULT ARRAY[]::text[],
  milestones jsonb DEFAULT '[]'::jsonb,
  achieved_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_sensitivities table
CREATE TABLE IF NOT EXISTS food_sensitivities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  food_item text NOT NULL,
  sensitivity_type text CHECK (sensitivity_type IN ('allergy', 'intolerance', 'sensitivity', 'suspected')),
  reaction_symptoms text[] DEFAULT ARRAY[]::text[],
  reaction_severity text CHECK (reaction_severity IN ('mild', 'moderate', 'severe')),
  reaction_onset_time text,
  testing_method text,
  test_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring', 'eliminated')),
  elimination_start_date date,
  reintroduction_date date,
  reintroduction_outcome text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create elimination_protocols table
CREATE TABLE IF NOT EXISTS elimination_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  protocol_name text NOT NULL,
  start_date date NOT NULL,
  planned_duration_days integer,
  end_date date,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'reintroduction_phase', 'completed', 'discontinued')),
  foods_eliminated text[] DEFAULT ARRAY[]::text[],
  baseline_symptoms jsonb DEFAULT '{}'::jsonb,
  symptom_improvements jsonb DEFAULT '{}'::jsonb,
  reintroduction_schedule jsonb DEFAULT '[]'::jsonb,
  reintroduction_results jsonb DEFAULT '[]'::jsonb,
  outcomes_summary text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_events_patient ON fm_timeline_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_clinic ON fm_timeline_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON fm_timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON fm_timeline_events(event_type);

CREATE INDEX IF NOT EXISTS idx_ifm_matrix_patient ON ifm_matrix_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_ifm_matrix_clinic ON ifm_matrix_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ifm_matrix_date ON ifm_matrix_assessments(assessment_date);

CREATE INDEX IF NOT EXISTS idx_lifestyle_patient ON lifestyle_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_clinic ON lifestyle_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_date ON lifestyle_assessments(assessment_date);

CREATE INDEX IF NOT EXISTS idx_health_goals_patient ON health_goals(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_goals_clinic ON health_goals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_health_goals_status ON health_goals(status);
CREATE INDEX IF NOT EXISTS idx_health_goals_priority ON health_goals(priority);

CREATE INDEX IF NOT EXISTS idx_food_sensitivities_patient ON food_sensitivities(patient_id);
CREATE INDEX IF NOT EXISTS idx_food_sensitivities_clinic ON food_sensitivities(clinic_id);
CREATE INDEX IF NOT EXISTS idx_food_sensitivities_status ON food_sensitivities(status);

CREATE INDEX IF NOT EXISTS idx_elimination_protocols_patient ON elimination_protocols(patient_id);
CREATE INDEX IF NOT EXISTS idx_elimination_protocols_clinic ON elimination_protocols(clinic_id);
CREATE INDEX IF NOT EXISTS idx_elimination_protocols_status ON elimination_protocols(status);

-- Enable Row Level Security
ALTER TABLE fm_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ifm_matrix_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_sensitivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE elimination_protocols ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fm_timeline_events
CREATE POLICY "Users can view timeline events for patients in their clinic"
  ON fm_timeline_events FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create timeline events for patients in their clinic"
  ON fm_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update timeline events in their clinic"
  ON fm_timeline_events FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete timeline events in their clinic"
  ON fm_timeline_events FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for ifm_matrix_assessments
CREATE POLICY "Users can view IFM matrix assessments for patients in their clinic"
  ON ifm_matrix_assessments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create IFM matrix assessments for patients in their clinic"
  ON ifm_matrix_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update IFM matrix assessments in their clinic"
  ON ifm_matrix_assessments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete IFM matrix assessments in their clinic"
  ON ifm_matrix_assessments FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for lifestyle_assessments
CREATE POLICY "Users can view lifestyle assessments for patients in their clinic"
  ON lifestyle_assessments FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create lifestyle assessments for patients in their clinic"
  ON lifestyle_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update lifestyle assessments in their clinic"
  ON lifestyle_assessments FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete lifestyle assessments in their clinic"
  ON lifestyle_assessments FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for health_goals
CREATE POLICY "Users can view health goals for patients in their clinic"
  ON health_goals FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create health goals for patients in their clinic"
  ON health_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update health goals in their clinic"
  ON health_goals FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete health goals in their clinic"
  ON health_goals FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for food_sensitivities
CREATE POLICY "Users can view food sensitivities for patients in their clinic"
  ON food_sensitivities FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create food sensitivities for patients in their clinic"
  ON food_sensitivities FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update food sensitivities in their clinic"
  ON food_sensitivities FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete food sensitivities in their clinic"
  ON food_sensitivities FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- RLS Policies for elimination_protocols
CREATE POLICY "Users can view elimination protocols for patients in their clinic"
  ON elimination_protocols FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create elimination protocols for patients in their clinic"
  ON elimination_protocols FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update elimination protocols in their clinic"
  ON elimination_protocols FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete elimination protocols in their clinic"
  ON elimination_protocols FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (SELECT id FROM clinics WHERE id = (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    ))
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON fm_timeline_events;
CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON fm_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ifm_matrix_updated_at ON ifm_matrix_assessments;
CREATE TRIGGER update_ifm_matrix_updated_at
  BEFORE UPDATE ON ifm_matrix_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lifestyle_updated_at ON lifestyle_assessments;
CREATE TRIGGER update_lifestyle_updated_at
  BEFORE UPDATE ON lifestyle_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_goals_updated_at ON health_goals;
CREATE TRIGGER update_health_goals_updated_at
  BEFORE UPDATE ON health_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_sensitivities_updated_at ON food_sensitivities;
CREATE TRIGGER update_food_sensitivities_updated_at
  BEFORE UPDATE ON food_sensitivities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_elimination_protocols_updated_at ON elimination_protocols;
CREATE TRIGGER update_elimination_protocols_updated_at
  BEFORE UPDATE ON elimination_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
