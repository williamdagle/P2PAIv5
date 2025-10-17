/*
  # Fix Users Table Infinite Recursion

  ## Problem
  The RLS policies on the users table were causing infinite recursion because:
  - The helper functions (is_system_admin, get_user_organization_id) query the users table
  - The policies on users table call these helper functions
  - This creates a circular dependency

  ## Solution
  1. Drop all policies that cause recursion
  2. Keep only the "view own profile" policy (no recursion)
  3. For other access patterns, use edge functions which bypass RLS with proper auth checks

  ## Changes
  - Drop "System Admins: view users in organization" policy
  - Drop "Users: view users in own clinic" policy  
  - Drop "Users: manage users in own clinic" policy
  - Keep "Users: view own profile" policy (required for login)
  - Keep System Admin policies for INSERT/UPDATE/DELETE (used by edge functions with service role)

  ## Security
  - Users can read their own profile (required for login)
  - All other user access goes through edge functions which:
    - Use service role to bypass RLS
    - Implement proper authorization checks
    - Are already deployed and working
*/

-- Drop policies that cause recursion on SELECT
DROP POLICY IF EXISTS "System Admins: view users in organization" ON users;
DROP POLICY IF EXISTS "Users: view users in own clinic" ON users;

-- Drop the ALL policy that causes recursion
DROP POLICY IF EXISTS "Users: manage users in own clinic" ON users;

-- The "Users: view own profile" policy remains and doesn't cause recursion
-- because it only checks auth.uid() without querying users table

-- Note: System Admin INSERT/UPDATE/DELETE policies remain for edge functions
-- Edge functions use service role which bypasses RLS, so no recursion occurs
