/*
  # Add Foreign Key Relationship for Appointment Types

  ## Overview
  This migration adds the missing foreign key constraint between the appointments table 
  and appointment_types table to enable proper joins in Supabase queries.

  ## Changes
    - Add foreign key constraint on appointments.appointment_type_id referencing appointment_types.id
    - This allows Supabase to automatically resolve the relationship in select queries

  ## Notes
    - Uses ON DELETE SET NULL to prevent orphaned appointments if an appointment type is deleted
    - The constraint is added only if it doesn't already exist
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_appointment_type_id_fkey'
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_appointment_type_id_fkey
    FOREIGN KEY (appointment_type_id)
    REFERENCES appointment_types(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint appointments_appointment_type_id_fkey created successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint appointments_appointment_type_id_fkey already exists';
  END IF;
END $$;

-- Create index on appointment_type_id for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_type_id 
ON appointments(appointment_type_id);
