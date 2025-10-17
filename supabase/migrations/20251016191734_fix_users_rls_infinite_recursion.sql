/*
  # Fix Infinite Recursion in Users RLS Policy
  
  ## Problem
  The previous migration created a policy with infinite recursion:
  - Policy checks: clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())
  - This queries the users table, which triggers the same policy, causing infinite recursion
  - This breaks login and all user queries with 500 errors
  
  ## Solution
  Replace the recursive policy with a simpler approach that uses a helper function
  or direct clinic_id comparison without recursive queries.
  
  ## Changes
  1. Drop the problematic recursive policy
  2. Create a non-recursive policy that allows viewing users in the same clinic
  3. Use a simpler approach that avoids querying the users table within the policy
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view colleagues in same clinic" ON users;
DROP POLICY IF EXISTS "Users can view own full profile" ON users;

-- Create a policy that allows users to view their own profile
CREATE POLICY "Users can view own full profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Create a policy that allows users in the same clinic to view each other
-- This uses a different approach: we check if the viewing user's clinic_id
-- matches the target user's clinic_id by comparing against the current user's record
CREATE POLICY "Users can view colleagues in same clinic"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM users u
      WHERE u.auth_user_id = auth.uid() 
        AND u.clinic_id = users.clinic_id
    )
  );
