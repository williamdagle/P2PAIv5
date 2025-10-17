/*
  # Fix System Admin Users Access

  ## Changes
  1. Drops the complex "System Admins can view all users in their organization" policy
  2. Creates a simpler policy that allows System Admins to view all users in clinics within their organization
  3. Updates insert/update/delete policies to ensure System Admins can only manage users within their organization

  ## Security
  - System Admins can only see users in clinics that belong to their organization
  - System Admins can only create/update/delete users in clinics within their organization
  - Non-admin users can still view users in their own clinic (via existing policy)
*/

-- Drop the existing complex System Admin view policy
DROP POLICY IF EXISTS "System Admins can view all users in their organization" ON users;

-- Create a simpler and more efficient policy for System Admins to view users in their organization
CREATE POLICY "System Admins: view users in organization"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    is_system_admin() AND 
    clinic_id IN (
      SELECT id 
      FROM clinics 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Update the insert policy to ensure System Admins can only create users in their organization
DROP POLICY IF EXISTS "Only admins can insert users" ON users;

CREATE POLICY "System Admins: create users in organization"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_system_admin() AND 
    clinic_id IN (
      SELECT id 
      FROM clinics 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Update the update policy to ensure System Admins can only update users in their organization
DROP POLICY IF EXISTS "Only admins can update users" ON users;

CREATE POLICY "System Admins: update users in organization"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    is_system_admin() AND 
    clinic_id IN (
      SELECT id 
      FROM clinics 
      WHERE organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    is_system_admin() AND 
    clinic_id IN (
      SELECT id 
      FROM clinics 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Update the delete policy to ensure System Admins can only delete users in their organization
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

CREATE POLICY "System Admins: delete users in organization"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    is_system_admin() AND 
    clinic_id IN (
      SELECT id 
      FROM clinics 
      WHERE organization_id = get_user_organization_id()
    )
  );
