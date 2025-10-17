/*
  # Consolidate Timeline Events - Unified Timeline System

  ## Overview
  This migration consolidates the `timeline_events` and `fm_timeline_events` tables into a single
  unified timeline system. The `timeline_events` table will be extended with functional medicine
  fields while preserving all existing data.

  ## Changes
  
  1. Add FM-specific fields to timeline_events:
     - `event_age` (numeric) - patient's age at event
     - `category` (text) - physical, emotional, environmental, genetic, lifestyle
     - `impact_on_health` (text) - health impact description
     - `related_symptoms` (text[]) - symptoms associated with event
     - `triggers_identified` (text[]) - identified triggers
     - `source_table` (text) - tracks origin of data
  
  2. Update event_type constraint to support both simple and FM-specific types:
     - Simple types: Symptom, Treatment, Lab Work, Appointment, Lifestyle Change, Supplement, Medication, Other
     - FM types: trauma, illness, exposure, stress, life_event, symptom_onset, treatment, other
  
  3. Drop fm_timeline_events table (no data to migrate from it)
  
  4. Update indexes and triggers
  
  ## Data Preservation
  - All 21 existing records in timeline_events remain intact
  - New fields are nullable with sensible defaults
  - Existing event types continue to work
  
  ## Security
  - Maintains existing RLS policies
  - No changes to access controls
*/

-- Add FM-specific fields to timeline_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'event_age'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN event_age numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'category'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN category text 
      CHECK (category IN ('physical', 'emotional', 'environmental', 'genetic', 'lifestyle'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'impact_on_health'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN impact_on_health text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'related_symptoms'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN related_symptoms text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'triggers_identified'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN triggers_identified text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timeline_events' AND column_name = 'source_table'
  ) THEN
    ALTER TABLE timeline_events ADD COLUMN source_table text DEFAULT 'timeline_events';
  END IF;
END $$;

-- Update the event_type constraint to support both simple and FM-specific event types
ALTER TABLE timeline_events 
DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;

ALTER TABLE timeline_events 
ADD CONSTRAINT timeline_events_event_type_check 
CHECK (event_type IN (
  -- Simple event types (existing)
  'Symptom', 'Treatment', 'Lab Work', 'Appointment', 'Lifestyle Change', 
  'Supplement', 'Medication', 'Other',
  -- FM-specific event types (new)
  'trauma', 'illness', 'exposure', 'stress', 'life_event', 'symptom_onset', 
  'treatment', 'other'
));

-- Update severity constraint to include FM severity levels
ALTER TABLE timeline_events 
DROP CONSTRAINT IF EXISTS timeline_events_severity_check;

ALTER TABLE timeline_events 
ADD CONSTRAINT timeline_events_severity_check 
CHECK (severity IN ('low', 'medium', 'high', 'mild', 'moderate', 'severe', 'life_threatening'));

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_timeline_events_category ON timeline_events(category);
CREATE INDEX IF NOT EXISTS idx_timeline_events_source ON timeline_events(source_table);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_type ON timeline_events(event_type);

-- Drop the fm_timeline_events table and related objects (no data to preserve)
DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON fm_timeline_events;
DROP INDEX IF EXISTS idx_timeline_events_patient;
DROP INDEX IF EXISTS idx_timeline_events_clinic;
DROP INDEX IF EXISTS idx_timeline_events_date;
DROP INDEX IF EXISTS idx_timeline_events_type;
DROP TABLE IF EXISTS fm_timeline_events CASCADE;

-- Add comment to document the unified table
COMMENT ON TABLE timeline_events IS 'Unified timeline events table supporting both simple and functional medicine event tracking';
COMMENT ON COLUMN timeline_events.event_age IS 'Patient age at time of event (for FM timeline)';
COMMENT ON COLUMN timeline_events.category IS 'FM event category: physical, emotional, environmental, genetic, lifestyle';
COMMENT ON COLUMN timeline_events.impact_on_health IS 'Description of how this event impacted patient health (FM)';
COMMENT ON COLUMN timeline_events.related_symptoms IS 'Array of symptoms related to this event (FM)';
COMMENT ON COLUMN timeline_events.triggers_identified IS 'Array of identified triggers (FM)';
COMMENT ON COLUMN timeline_events.source_table IS 'Tracks data origin for migration purposes';
