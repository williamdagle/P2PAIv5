/*
  # Enhance Labs Table for Functional Medicine

  ## Overview
  Adds functional medicine tracking capabilities to existing labs table:
  - Add numerical result value field
  - Add unit field
  - Add conventional and functional reference ranges
  - Add computed zone field
  - Add note field for clinician annotations
  - Maintain backward compatibility with existing data

  ## Changes
  - Add new columns to labs table
  - Add trigger for automatic zone calculation
  - Keep existing FM Timeline integration

  ## Security
  - No RLS changes needed (already secured by clinic_id)
*/

-- Add new columns to existing labs table
ALTER TABLE labs ADD COLUMN IF NOT EXISTS result_value decimal;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS conventional_range_low decimal;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS conventional_range_high decimal;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS functional_range_low decimal;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS functional_range_high decimal;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS zone text CHECK (zone IN ('optimal', 'functional_deviation', 'abnormal'));
ALTER TABLE labs ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS source text DEFAULT 'Manual Entry';

-- Create index for lab trends queries
CREATE INDEX IF NOT EXISTS idx_labs_patient_name_date 
  ON labs(patient_id, lab_name, result_date DESC) 
  WHERE is_deleted = false;

-- Update trigger to auto-compute zone on insert/update
CREATE OR REPLACE FUNCTION set_lab_zone()
RETURNS TRIGGER AS $$
BEGIN
  -- Only compute zone if we have all the necessary values
  IF NEW.result_value IS NOT NULL
     AND NEW.conventional_range_low IS NOT NULL 
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_lab_zone ON labs;
CREATE TRIGGER trigger_set_lab_zone
  BEFORE INSERT OR UPDATE ON labs
  FOR EACH ROW
  EXECUTE FUNCTION set_lab_zone();

-- Migrate existing result text to result_value where possible
UPDATE labs 
SET result_value = CASE 
  WHEN result ~ '^[0-9]+\.?[0-9]*$' THEN result::decimal 
  ELSE NULL 
END
WHERE result_value IS NULL 
  AND result IS NOT NULL 
  AND result != '';
