/*
  # Add Provider Name to Appointments Table

  ## Problem
  The Appointments screen shows "Unknown Provider" because it relies on joining with
  the users table, which is blocked by RLS policies that only allow users to view
  their own profile.

  ## Solution
  Store the provider's name directly in the appointments table to eliminate the need
  for joins and maintain security boundaries.

  ## Changes
  1. Add provider_name column to appointments table
  2. Add index on provider_name for better query performance
  3. Backfill existing appointments with provider names using service role
  4. Handle cases where provider_id is null or provider no longer exists

  ## Benefits
  - Maintains all existing RLS policies without modification
  - Better performance (no joins required)
  - Historical accuracy (preserves provider name at time of appointment)
  - Works regardless of clinic boundaries

  ## Notes
  - The backfill operation uses the service role which has full database access
  - Null provider_ids will result in 'Not Assigned' as the provider_name
  - If a provider is deleted, their name is preserved in historical appointments
*/

-- Add provider_name column to appointments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'appointments'
    AND column_name = 'provider_name'
  ) THEN
    ALTER TABLE appointments ADD COLUMN provider_name text;
  END IF;
END $$;

-- Add index on provider_name for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_provider_name ON appointments(provider_name);

-- Backfill existing appointments with provider names
-- This uses a direct SQL query to bypass RLS policies safely
DO $$
DECLARE
  updated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Get total count of appointments to update
  SELECT COUNT(*) INTO total_count
  FROM appointments
  WHERE provider_name IS NULL;

  RAISE NOTICE 'Starting backfill for % appointments...', total_count;

  -- Update appointments with provider names
  -- Join with users table to get full_name
  UPDATE appointments a
  SET provider_name = COALESCE(u.full_name, 'Not Assigned')
  FROM users u
  WHERE a.provider_id = u.id
  AND a.provider_name IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Updated % appointments with provider names from users table', updated_count;

  -- Update remaining appointments (where provider_id is NULL or provider deleted)
  UPDATE appointments
  SET provider_name = 'Not Assigned'
  WHERE provider_name IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Set % appointments without providers to "Not Assigned"', updated_count;

  RAISE NOTICE 'Backfill complete! Total appointments processed: %', total_count;
END $$;

-- Verify the migration
DO $$
DECLARE
  null_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO total_count FROM appointments;
  SELECT COUNT(*) INTO null_count FROM appointments WHERE provider_name IS NULL;
  
  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'Total appointments: %', total_count;
  RAISE NOTICE 'Appointments with NULL provider_name: %', null_count;
  RAISE NOTICE 'Appointments with provider_name populated: %', total_count - null_count;
  
  IF null_count > 0 THEN
    RAISE WARNING 'Some appointments still have NULL provider_name. This should not happen.';
  ELSE
    RAISE NOTICE 'SUCCESS: All appointments have provider_name populated!';
  END IF;
END $$;
