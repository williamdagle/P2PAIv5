/*
  # Fix Missing role_id for Admin Users
  
  This migration fixes admin users created by the seed script that are missing role_id assignments.
  
  1. Changes
    - Updates users with NULL role_id who have admin email patterns
    - Assigns them to the System Admin role
    - Updates the updated_at timestamp
  
  2. Security
    - Uses direct UPDATE to bypass RLS (migration runs with elevated privileges)
    - Only affects users with NULL role_id to avoid overwriting existing assignments
    - Specifically targets admin email patterns for safety
*/

-- Update admin users with missing role_id
UPDATE users 
SET 
  role_id = (SELECT id FROM roles WHERE name = 'System Admin'),
  updated_at = now()
WHERE 
  role_id IS NULL
  AND email LIKE 'admin@%';

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.email LIKE 'admin@%'
  AND r.name = 'System Admin';
  
  RAISE NOTICE 'Updated % admin users with System Admin role', updated_count;
END $$;
