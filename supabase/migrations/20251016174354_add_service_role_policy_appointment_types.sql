/*
  # Add Service Role Policy for Appointment Types

  ## Overview
  Adds a service role policy to the appointment_types table to allow Edge Functions
  to access the table using the service_role_key without being blocked by RLS.

  ## Changes
  1. Create service role policy for full access to appointment_types
  2. Grant table permissions to service_role
  3. Add missing max_free_sessions column if it doesn't exist

  ## Security
  - Service role policies only apply when using the service_role_key
  - Edge Functions need this access to query appointment types on behalf of users
*/

-- =====================================================
-- ADD SERVICE ROLE POLICY
-- =====================================================

CREATE POLICY "Service role full access appointment types"
  ON appointment_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- GRANT SERVICE ROLE PERMISSIONS
-- =====================================================

GRANT ALL ON appointment_types TO service_role;

-- =====================================================
-- ADD MISSING COLUMNS IF THEY DON'T EXIST
-- =====================================================

-- Add max_free_sessions column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointment_types' AND column_name = 'max_free_sessions'
  ) THEN
    ALTER TABLE appointment_types 
    ADD COLUMN max_free_sessions integer NOT NULL DEFAULT 0 
    CHECK (max_free_sessions >= 0 AND max_free_sessions <= 100);
  END IF;
END $$;
