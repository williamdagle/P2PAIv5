/*
  # Sync Feature Flags with Aesthetics Module Column

  ## Summary
  This migration creates bidirectional synchronization between the feature_flags JSONB column 
  and the legacy aesthetics_module_enabled boolean column to ensure data consistency.

  ## Changes

  1. **Database Trigger Function**
     - Creates a trigger function that automatically syncs feature_flags.aesthetics with aesthetics_module_enabled
     - Ensures both columns stay in sync whenever either is updated
     - Works bidirectionally: updates to either column propagate to the other

  2. **Trigger Setup**
     - Adds BEFORE UPDATE trigger on clinics table
     - Fires on any update to feature_flags or aesthetics_module_enabled
     - Prevents data inconsistency between the two representations

  3. **Data Consistency**
     - Performs initial sync of existing data
     - Ensures all existing records have matching values

  ## Security
  - Function runs with SECURITY DEFINER to ensure proper permissions
  - Only affects the clinics table which already has RLS policies in place
*/

-- =====================================================
-- 1. CREATE TRIGGER FUNCTION FOR BIDIRECTIONAL SYNC
-- =====================================================

CREATE OR REPLACE FUNCTION sync_feature_flags_aesthetics()
RETURNS TRIGGER AS $$
BEGIN
    -- If feature_flags.aesthetics changed, sync to aesthetics_module_enabled
    IF (NEW.feature_flags IS DISTINCT FROM OLD.feature_flags) THEN
        IF (NEW.feature_flags ? 'aesthetics') THEN
            NEW.aesthetics_module_enabled := (NEW.feature_flags->>'aesthetics')::boolean;
        END IF;
    END IF;

    -- If aesthetics_module_enabled changed, sync to feature_flags.aesthetics
    IF (NEW.aesthetics_module_enabled IS DISTINCT FROM OLD.aesthetics_module_enabled) THEN
        NEW.feature_flags := jsonb_set(
            COALESCE(NEW.feature_flags, '{}'::jsonb),
            '{aesthetics}',
            to_jsonb(COALESCE(NEW.aesthetics_module_enabled, false))
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER ON CLINICS TABLE
-- =====================================================

DROP TRIGGER IF EXISTS sync_feature_flags_aesthetics_trigger ON clinics;

CREATE TRIGGER sync_feature_flags_aesthetics_trigger
    BEFORE UPDATE ON clinics
    FOR EACH ROW
    WHEN (
        (NEW.feature_flags IS DISTINCT FROM OLD.feature_flags) OR
        (NEW.aesthetics_module_enabled IS DISTINCT FROM OLD.aesthetics_module_enabled)
    )
    EXECUTE FUNCTION sync_feature_flags_aesthetics();

-- =====================================================
-- 3. SYNC EXISTING DATA
-- =====================================================

-- Ensure all existing records have synchronized values
UPDATE clinics
SET feature_flags = jsonb_set(
    COALESCE(feature_flags, '{}'::jsonb),
    '{aesthetics}',
    to_jsonb(COALESCE(aesthetics_module_enabled, false))
)
WHERE (feature_flags->>'aesthetics')::boolean IS DISTINCT FROM aesthetics_module_enabled
   OR (feature_flags IS NULL)
   OR (NOT feature_flags ? 'aesthetics');

-- Also sync the other direction for safety
UPDATE clinics
SET aesthetics_module_enabled = (feature_flags->>'aesthetics')::boolean
WHERE feature_flags ? 'aesthetics'
  AND aesthetics_module_enabled IS DISTINCT FROM (feature_flags->>'aesthetics')::boolean;
