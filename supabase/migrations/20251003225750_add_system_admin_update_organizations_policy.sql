/*
  # Add System Admin UPDATE policy for organizations
  
  1. Changes
    - Add UPDATE policy for System Admins to manage data sharing in their organization
  
  2. Security
    - System Admins can only update their own organization
    - Uses helper function to prevent infinite recursion
*/

-- System Admins can update their organization (for data sharing management)
CREATE POLICY "System Admins: update own organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    is_system_admin()
    AND id = get_user_organization_id()
  )
  WITH CHECK (
    is_system_admin()
    AND id = get_user_organization_id()
  );
