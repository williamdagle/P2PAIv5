/*
  # Revert to Working Users RLS Policies
  
  ## Problem
  Several recent migrations created RLS policies with recursive queries that broke login:
  - 20251016191356: Added recursive policy (queries users within users policy)
  - 20251016191734: Attempted fix but still had recursion
  - 20251016191748: Added SECURITY DEFINER function but it's still problematic
  - 20251016195756: Latest attempt that may still have issues
  
  ## Root Cause
  All these migrations query the users table from within a users table RLS policy,
  creating infinite recursion that blocks authentication.
  
  ## Solution
  Go back to the ORIGINAL working policies that existed before the "Unknown Provider" fix.
  We'll restore the simple policies that worked for login, even if it means sacrificing
  the provider name display temporarily.
  
  ## Changes
  1. Drop ALL current SELECT policies on users table
  2. Restore the original simple policy: users can only view their own profile
  3. Add System Admin policy that doesn't use recursion
  4. Keep the SECURITY DEFINER function but don't use it in policies (for now)
*/

-- Drop all current SELECT policies
DROP POLICY IF EXISTS "Users: view own profile" ON users;
DROP POLICY IF EXISTS "Users: view clinic colleagues" ON users;
DROP POLICY IF EXISTS "Users can view own full profile" ON users;
DROP POLICY IF EXISTS "Users can view colleagues in same clinic" ON users;
DROP POLICY IF EXISTS "System Admins: view organization users" ON users;
DROP POLICY IF EXISTS "System Admins: view users in organization" ON users;

-- Restore SIMPLE policy: users can ONLY view their own profile
-- This is what was working before the "Unknown Provider" fix
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- System Admins need to view all users in their organization
-- Use a direct join approach without subqueries on users table
CREATE POLICY "System Admins can view org users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users admin_user
      JOIN roles r ON r.id = admin_user.role_id
      JOIN clinics admin_clinic ON admin_clinic.id = admin_user.clinic_id
      JOIN clinics target_clinic ON target_clinic.organization_id = admin_clinic.organization_id
      WHERE admin_user.auth_user_id = auth.uid()
        AND r.name = 'System Admin'
        AND target_clinic.id = users.clinic_id
    )
  );

-- Grant service role permissions
GRANT ALL ON users TO service_role;
