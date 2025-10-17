/*
  # Add System Admin Policy for Organizations
  
  1. Changes
    - Add SELECT policy for System Admins to view all organizations
    - Allows System Admins to manage data sharing settings for all orgs
  
  2. Security
    - Only users with 'System Admin' role can see all organizations
    - Regular users continue to see only their own organization
*/

-- Add policy for System Admins to view all organizations
CREATE POLICY "System Admins can view all organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );
