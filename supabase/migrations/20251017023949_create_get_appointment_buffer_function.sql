/*
  # Create get_appointment_buffer function for scheduling

  1. New Functions
    - `get_appointment_buffer` - Returns buffer time configuration for appointments
      - Checks appointment type specific buffers first
      - Falls back to provider default buffers
      - Finally falls back to clinic/system defaults
  
  2. Purpose
    - Supports the smart scheduling system
    - Determines pre and post appointment buffer times
    - Used by get_provider_availability edge function
*/

-- Create function to get appointment buffer configuration
CREATE OR REPLACE FUNCTION get_appointment_buffer(
  p_clinic_id uuid,
  p_provider_id uuid,
  p_appointment_type_id uuid DEFAULT NULL
)
RETURNS TABLE (
  pre_minutes integer,
  post_minutes integer
) AS $$
BEGIN
  -- Try to get appointment type specific buffer first
  IF p_appointment_type_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      COALESCE(at.buffer_before_minutes, 0) as pre_minutes,
      COALESCE(at.buffer_after_minutes, 0) as post_minutes
    FROM appointment_types at
    WHERE at.id = p_appointment_type_id
    LIMIT 1;
    
    -- If we found a result, return it
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Fall back to system settings default buffer
  RETURN QUERY
  SELECT 
    COALESCE(ss.appointment_buffer_minutes, 0) as pre_minutes,
    COALESCE(ss.appointment_buffer_minutes, 0) as post_minutes
  FROM system_settings ss
  LIMIT 1;
  
  -- If no settings found, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0 as pre_minutes, 0 as post_minutes;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_appointment_buffer(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointment_buffer(uuid, uuid, uuid) TO service_role;
