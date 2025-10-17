/*
  # Minimal Users RLS Policy - Login Only
  
  ## Problem
  Login still fails because even the "revert" migration had a recursive System Admin policy.
  The login flow requires a user to query their own profile after authentication, and that's it.
  
  ## Solution
  Create the ABSOLUTE MINIMUM RLS policy needed for login:
  - ONE policy: users can view their own profile only (auth_user_id = auth.uid())
  - NO other policies (not even System Admin - we'll add that later if needed)
  - NO recursive queries, NO joins, NO subqueries on users table
  
  ## Changes
  1. Drop EVERY policy on users table
  2. Create ONE simple policy for own profile
  3. That's it - nothing else
*/

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "System Admins can view org users" ON users;
DROP POLICY IF EXISTS "Users: view own profile" ON users;
DROP POLICY IF EXISTS "Users: view clinic colleagues" ON users;
DROP POLICY IF EXISTS "Users can view own full profile" ON users;
DROP POLICY IF EXISTS "Users can view colleagues in same clinic" ON users;
DROP POLICY IF EXISTS "System Admins: view organization users" ON users;
DROP POLICY IF EXISTS "System Admins: view users in organization" ON users;
DROP POLICY IF EXISTS "System Admin: view organization users" ON users;
DROP POLICY IF EXISTS "System Admin can view org users" ON users;

-- ONE POLICY ONLY: Users can view their own profile
-- This is ALL that's needed for login to work
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Grant service role full access (for admin operations and seeding)
GRANT ALL ON users TO service_role;

-- Note: This means System Admins cannot view other users yet
-- We will add that back later with a NON-RECURSIVE approach
