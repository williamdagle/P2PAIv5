/*
  # Lab Trends System for Functional Medicine

  ## Overview
  Creates a comprehensive lab trends tracking system with:
  - Time-series lab data tracking per patient
  - Dual reference ranges (conventional + functional medicine)
  - Color-coded zones (green/yellow/red)
  - Lab categories and marker metadata
  - PDF uploads for external lab results
  - Clinician notes and annotations

  ## New Tables

  ### `lab_categories`
  Organizes lab markers into clinical categories (e.g., Lipids, Thyroid, Inflammation)
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `description` (text) - Category description
  - `display_order` (integer) - Sort order for UI display
  - `created_at` (timestamptz)

  ### `lab_marker_metadata`
  Stores reference ranges and metadata for each lab marker type
  - `id` (uuid, primary key)
  - `category_id` (uuid) - Links to lab_categories
  - `marker_name` (text) - Lab marker name (e.g., "Vitamin D", "TSH")
  - `unit` (text) - Standard unit of measurement
  - `conventional_range_low` (decimal)
  - `conventional_range_high` (decimal)
  - `functional_range_low` (decimal)
  - `functional_range_high` (decimal)
  - `description` (text) - Clinical description
  - `display_order` (integer) - Sort order within category
  - `created_at` (timestamptz)

  ### `lab_trend_results`
  Stores individual lab result values over time for trend analysis
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - Links to patients
  - `clinic_id` (uuid) - Multi-tenant support
  - `lab_marker` (text) - Lab marker name
  - `result_value` (decimal) - Measured value
  - `unit` (text) - Unit of measurement
  - `result_date` (date) - When test was performed
  - `source` (text) - Source of result (LabCorp, Quest, Manual Entry, etc.)
  - `conventional_range_low` (decimal)
  - `conventional_range_high` (decimal)
  - `functional_range_low` (decimal)
  - `functional_range_high` (decimal)
  - `zone` (text) - Computed zone: optimal, functional_deviation, abnormal
  - `note` (text) - Clinician notes
  - `document_id` (uuid) - Links to patient_documents for PDF uploads
  - `encounter_id` (uuid) - Optional link to visit/encounter
  - `created_by` (uuid) - User who entered the result
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access data from their clinic

  ## Indexes
  - Performance indexes for common queries
*/

-- Create lab_categories table
CREATE TABLE IF NOT EXISTS lab_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create lab_marker_metadata table
CREATE TABLE IF NOT EXISTS lab_marker_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES lab_categories(id) ON DELETE SET NULL,
  marker_name text NOT NULL UNIQUE,
  unit text NOT NULL,
  conventional_range_low decimal,
  conventional_range_high decimal,
  functional_range_low decimal,
  functional_range_high decimal,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create lab_trend_results table
CREATE TABLE IF NOT EXISTS lab_trend_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  lab_marker text NOT NULL,
  result_value decimal NOT NULL,
  unit text NOT NULL,
  result_date date NOT NULL,
  source text DEFAULT 'Manual Entry',
  conventional_range_low decimal,
  conventional_range_high decimal,
  functional_range_low decimal,
  functional_range_high decimal,
  zone text CHECK (zone IN ('optimal', 'functional_deviation', 'abnormal')),
  note text,
  document_id uuid REFERENCES patient_documents(id) ON DELETE SET NULL,
  encounter_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_trend_results_patient_marker 
  ON lab_trend_results(patient_id, lab_marker, result_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_trend_results_clinic 
  ON lab_trend_results(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_trend_results_date 
  ON lab_trend_results(result_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_marker_metadata_category 
  ON lab_marker_metadata(category_id);

-- Enable RLS
ALTER TABLE lab_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_marker_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_trend_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_categories
CREATE POLICY "All authenticated users can view lab categories"
  ON lab_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage lab categories"
  ON lab_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- RLS Policies for lab_marker_metadata
CREATE POLICY "All authenticated users can view lab marker metadata"
  ON lab_marker_metadata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage lab marker metadata"
  ON lab_marker_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- RLS Policies for lab_trend_results
CREATE POLICY "Users can view lab trend results from their clinic"
  ON lab_trend_results FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create lab trend results for their clinic"
  ON lab_trend_results FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update lab trend results from their clinic"
  ON lab_trend_results FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lab trend results from their clinic"
  ON lab_trend_results FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

-- Function to compute zone based on result value and ranges
CREATE OR REPLACE FUNCTION compute_lab_result_zone(
  value decimal,
  conv_low decimal,
  conv_high decimal,
  func_low decimal,
  func_high decimal
) RETURNS text AS $$
BEGIN
  -- Abnormal: outside conventional range
  IF value < conv_low OR value > conv_high THEN
    RETURN 'abnormal';
  END IF;
  
  -- Optimal: within functional range
  IF value >= func_low AND value <= func_high THEN
    RETURN 'optimal';
  END IF;
  
  -- Functional deviation: between functional and conventional
  RETURN 'functional_deviation';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-compute zone on insert/update
CREATE OR REPLACE FUNCTION set_lab_trend_result_zone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conventional_range_low IS NOT NULL 
     AND NEW.conventional_range_high IS NOT NULL
     AND NEW.functional_range_low IS NOT NULL
     AND NEW.functional_range_high IS NOT NULL THEN
    NEW.zone := compute_lab_result_zone(
      NEW.result_value,
      NEW.conventional_range_low,
      NEW.conventional_range_high,
      NEW.functional_range_low,
      NEW.functional_range_high
    );
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_lab_trend_result_zone
  BEFORE INSERT OR UPDATE ON lab_trend_results
  FOR EACH ROW
  EXECUTE FUNCTION set_lab_trend_result_zone();

-- Insert default lab categories
INSERT INTO lab_categories (name, description, display_order) VALUES
  ('Lipids', 'Cholesterol and lipid panel markers', 1),
  ('Thyroid', 'Thyroid function markers', 2),
  ('Inflammation', 'Inflammatory markers and acute phase reactants', 3),
  ('Metabolic', 'Blood sugar, insulin, and metabolic markers', 4),
  ('Vitamins', 'Vitamin levels and nutritional markers', 5),
  ('Minerals', 'Mineral levels and electrolytes', 6),
  ('Hormones', 'Hormone levels', 7),
  ('Complete Blood Count', 'CBC markers', 8),
  ('Liver Function', 'Hepatic function markers', 9),
  ('Kidney Function', 'Renal function markers', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert common lab markers with reference ranges
INSERT INTO lab_marker_metadata (category_id, marker_name, unit, conventional_range_low, conventional_range_high, functional_range_low, functional_range_high, description, display_order) VALUES
  -- Lipids
  ((SELECT id FROM lab_categories WHERE name = 'Lipids'), 'Total Cholesterol', 'mg/dL', 125, 200, 160, 180, 'Total cholesterol level', 1),
  ((SELECT id FROM lab_categories WHERE name = 'Lipids'), 'LDL Cholesterol', 'mg/dL', 0, 100, 50, 80, 'Low-density lipoprotein cholesterol', 2),
  ((SELECT id FROM lab_categories WHERE name = 'Lipids'), 'HDL Cholesterol', 'mg/dL', 40, 200, 55, 100, 'High-density lipoprotein cholesterol', 3),
  ((SELECT id FROM lab_categories WHERE name = 'Lipids'), 'Triglycerides', 'mg/dL', 0, 150, 50, 100, 'Triglyceride level', 4),
  
  -- Thyroid
  ((SELECT id FROM lab_categories WHERE name = 'Thyroid'), 'TSH', 'mIU/L', 0.4, 4.5, 1.0, 2.5, 'Thyroid stimulating hormone', 1),
  ((SELECT id FROM lab_categories WHERE name = 'Thyroid'), 'Free T4', 'ng/dL', 0.8, 1.8, 1.0, 1.5, 'Free thyroxine', 2),
  ((SELECT id FROM lab_categories WHERE name = 'Thyroid'), 'Free T3', 'pg/mL', 2.3, 4.2, 3.0, 3.5, 'Free triiodothyronine', 3),
  
  -- Inflammation
  ((SELECT id FROM lab_categories WHERE name = 'Inflammation'), 'CRP', 'mg/L', 0, 3.0, 0, 1.0, 'C-reactive protein', 1),
  ((SELECT id FROM lab_categories WHERE name = 'Inflammation'), 'ESR', 'mm/hr', 0, 20, 0, 10, 'Erythrocyte sedimentation rate', 2),
  
  -- Metabolic
  ((SELECT id FROM lab_categories WHERE name = 'Metabolic'), 'Fasting Glucose', 'mg/dL', 70, 100, 75, 85, 'Fasting blood glucose', 1),
  ((SELECT id FROM lab_categories WHERE name = 'Metabolic'), 'HbA1c', '%', 4.0, 5.7, 4.5, 5.3, 'Hemoglobin A1c', 2),
  ((SELECT id FROM lab_categories WHERE name = 'Metabolic'), 'Insulin', 'uIU/mL', 2, 25, 2, 10, 'Fasting insulin', 3),
  
  -- Vitamins
  ((SELECT id FROM lab_categories WHERE name = 'Vitamins'), 'Vitamin D', 'ng/mL', 30, 100, 50, 80, '25-Hydroxyvitamin D', 1),
  ((SELECT id FROM lab_categories WHERE name = 'Vitamins'), 'Vitamin B12', 'pg/mL', 200, 1100, 500, 900, 'Cobalamin', 2),
  ((SELECT id FROM lab_categories WHERE name = 'Vitamins'), 'Folate', 'ng/mL', 3, 20, 8, 18, 'Serum folate', 3),
  
  -- Minerals
  ((SELECT id FROM lab_categories WHERE name = 'Minerals'), 'Magnesium', 'mg/dL', 1.7, 2.3, 2.0, 2.2, 'Serum magnesium', 1),
  ((SELECT id FROM lab_categories WHERE name = 'Minerals'), 'Iron', 'mcg/dL', 50, 170, 85, 130, 'Serum iron', 2),
  ((SELECT id FROM lab_categories WHERE name = 'Minerals'), 'Ferritin', 'ng/mL', 15, 200, 50, 150, 'Ferritin (iron storage)', 3)
ON CONFLICT (marker_name) DO NOTHING;
