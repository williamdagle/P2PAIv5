/*
  # Add System Admin SELECT Policy for Users Table
  
  ## Problem
  System Admins don't have a SELECT policy to view users in their organization.
  This prevents them from managing users properly.
  
  ## Solution
  Add a SELECT policy for System Admins that allows them to view all users
  within their organization (across all clinics in the organization).
  
  ## Changes
  1. Add System Admin SELECT policy for users table
*/

-- Create a policy that allows System Admins to view all users in their organization
CREATE POLICY "System Admins: view users in organization"
  ON users FOR SELECT
  TO authenticated
  USING (
    is_system_admin() 
    AND clinic_id IN (
      SELECT id 
      FROM clinics 
      WHERE organization_id = get_user_organization_id()
    )
  );
