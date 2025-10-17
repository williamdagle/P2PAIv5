/*
  # Add Medication Event Type to Timeline Events

  1. Changes
    - Drop existing event_type check constraint
    - Add new check constraint that includes 'Medication'
  
  2. Security
    - No RLS changes needed
    - Maintains existing validation, just adds one more allowed value
*/

-- Drop the existing check constraint
ALTER TABLE timeline_events 
DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;

-- Add new check constraint with Medication included
ALTER TABLE timeline_events 
ADD CONSTRAINT timeline_events_event_type_check 
CHECK (event_type = ANY (ARRAY[
  'Symptom'::text,
  'Treatment'::text,
  'Lab Work'::text,
  'Appointment'::text,
  'Lifestyle Change'::text,
  'Supplement'::text,
  'Medication'::text,
  'Other'::text
]));
