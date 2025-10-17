/*
  # Fix Infinite Recursion in RLS Policies
  
  1. Problem
    - Circular dependency between clinics and organizations policies
    - Both were trying to join the clinics table, creating infinite recursion
  
  2. Solution
    - Simplify policies to avoid circular references
    - Use direct lookups instead of nested joins
    - Create helper function to get user's organization
  
  3. Changes
    - Drop problematic System Admin policies
    - Create simpler, non-recursive policies
*/

-- Create a helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT c.organization_id
  FROM users u
  JOIN clinics c ON c.id = u.clinic_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Create a helper function to check if user is System Admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'System Admin'
  );
$$;

-- Drop the problematic System Admin policies
DROP POLICY IF EXISTS "System Admins can view own organization" ON organizations;
DROP POLICY IF EXISTS "System Admins can view all clinics in their organization" ON clinics;
DROP POLICY IF EXISTS "System Admins can create clinics in their organization" ON clinics;
DROP POLICY IF EXISTS "System Admins can update clinics in their organization" ON clinics;
DROP POLICY IF EXISTS "System Admins can delete clinics in their organization" ON clinics;

-- Organizations: System Admins can view their organization
CREATE POLICY "System Admins: view own organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    is_system_admin()
    AND id = get_user_organization_id()
  );

-- Clinics: System Admins can view all clinics in their organization
CREATE POLICY "System Admins: view clinics in organization"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (
    is_system_admin()
    AND organization_id = get_user_organization_id()
  );

-- Clinics: System Admins can create clinics in their organization
CREATE POLICY "System Admins: create clinics in organization"
  ON clinics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_system_admin()
    AND organization_id = get_user_organization_id()
  );

-- Clinics: System Admins can update clinics in their organization
CREATE POLICY "System Admins: update clinics in organization"
  ON clinics
  FOR UPDATE
  TO authenticated
  USING (
    is_system_admin()
    AND organization_id = get_user_organization_id()
  )
  WITH CHECK (
    is_system_admin()
    AND organization_id = get_user_organization_id()
  );

-- Clinics: System Admins can delete clinics in their organization
CREATE POLICY "System Admins: delete clinics in organization"
  ON clinics
  FOR DELETE
  TO authenticated
  USING (
    is_system_admin()
    AND organization_id = get_user_organization_id()
  );
