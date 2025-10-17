/*
  # Remove Overly Permissive Users Policy

  ## Changes
  1. Drops the "Users admin access within clinic" policy that uses cmd: ALL
     - This policy was allowing System Admins to see all users across all organizations
     - It was using OR logic with the organization-scoped policies
  
  2. Adds a replacement policy for regular (non-admin) users to view users in their clinic
     - This ensures non-admin users can still see users in their own clinic
     - But doesn't interfere with the System Admin organization-scoped policies

  ## Security
  - System Admins can only see users in their organization (via existing policies)
  - Regular users can only see users in their own clinic
  - All policies are properly scoped and don't conflict
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users admin access within clinic" ON users;

-- Add a specific policy for regular users to view users in their own clinic
CREATE POLICY "Users: view users in own clinic"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );
