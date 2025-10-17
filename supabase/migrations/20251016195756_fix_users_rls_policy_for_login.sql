/*
  # Fix Users Table RLS Policy for Login
  
  ## Problem
  Users cannot login because the RLS policies on the users table are preventing
  the initial profile lookup during authentication. The policies rely on helper
  functions that may have issues with the auth context during login.
  
  ## Root Cause
  - The "Users can view own full profile" policy checks auth_user_id = auth.uid()
  - During login, the auth context may not be properly set yet
  - The SECURITY DEFINER function get_current_user_clinic_id() may fail during initial auth
  
  ## Solution
  Simplify the RLS policies to ensure they work during the login flow:
  1. Keep the simple auth_user_id = auth.uid() policy (this should work)
  2. Fix the clinic colleagues policy to not depend on the problematic function
  3. Ensure policies are ordered correctly
  
  ## Changes
  1. Drop and recreate all SELECT policies on users table
  2. Use a simpler approach that doesn't rely on complex helper functions
  3. Add explicit policy for service role access
*/

-- Drop all existing SELECT policies on users table
DROP POLICY IF EXISTS "Users can view own full profile" ON users;
DROP POLICY IF EXISTS "Users can view colleagues in same clinic" ON users;
DROP POLICY IF EXISTS "System Admins: view users in organization" ON users;

-- Policy 1: Users can always view their own profile (highest priority, simplest check)
CREATE POLICY "Users: view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Users can view other users in their clinic
-- This uses a subquery but NOT a function call, which should work better
CREATE POLICY "Users: view clinic colleagues"
  ON users FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- Policy 3: System Admins can view users in their organization
CREATE POLICY "System Admins: view organization users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN clinics c1 ON c1.id = u.clinic_id
      JOIN clinics c2 ON c2.organization_id = c1.organization_id
      WHERE u.auth_user_id = auth.uid()
        AND r.name = 'System Admin'
        AND c2.id = users.clinic_id
    )
  );

-- Grant explicit permissions to service_role for data seeding and migrations
GRANT SELECT ON users TO service_role;
