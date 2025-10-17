/*
  # Fix System Admin Organization Scoping
  
  1. Changes
    - Update organizations policy: System Admins see only their own organization
    - Update clinics policy: System Admins see all clinics in their organization
    - Update users policy: System Admins see all users in clinics within their organization
    
  2. Security
    - System Admins are scoped to their organization
    - They can manage all clinics and users within their org
    - They cannot see data from other organizations
*/

-- Drop the overly permissive policy we just created
DROP POLICY IF EXISTS "System Admins can view all organizations" ON organizations;

-- System Admins can only view their own organization
CREATE POLICY "System Admins can view own organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT c.organization_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- Drop existing clinic policies for System Admins if they exist
DROP POLICY IF EXISTS "System Admins can view all clinics in their organization" ON clinics;
DROP POLICY IF EXISTS "System Admins can manage clinics in their organization" ON clinics;

-- System Admins can view all clinics in their organization
CREATE POLICY "System Admins can view all clinics in their organization"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT c.organization_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- System Admins can insert clinics in their organization
CREATE POLICY "System Admins can create clinics in their organization"
  ON clinics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT c.organization_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- System Admins can update clinics in their organization
CREATE POLICY "System Admins can update clinics in their organization"
  ON clinics
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT c.organization_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT c.organization_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- System Admins can delete clinics in their organization
CREATE POLICY "System Admins can delete clinics in their organization"
  ON clinics
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT c.organization_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
    )
  );

-- Drop existing user policies for System Admins if they exist
DROP POLICY IF EXISTS "System Admins can view all users in their organization" ON users;

-- System Admins can view all users in their organization
CREATE POLICY "System Admins can view all users in their organization"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT c.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c ON c.id = u.clinic_id
      JOIN clinics user_clinic ON user_clinic.organization_id = c.organization_id
      WHERE u.auth_user_id = auth.uid()
      AND r.name = 'System Admin'
      AND user_clinic.id = users.clinic_id
    )
  );
