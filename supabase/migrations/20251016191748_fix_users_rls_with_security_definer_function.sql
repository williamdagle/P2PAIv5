/*
  # Fix Users RLS Policy with Security Definer Function
  
  ## Problem
  The previous policies caused infinite recursion because they queried the users table
  within the policy definition, which triggered the same policy again.
  
  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS to get the current user's clinic_id,
  then use that in the policy without recursive queries.
  
  ## Changes
  1. Create a helper function to get current user's clinic_id (SECURITY DEFINER bypasses RLS)
  2. Use this function in the RLS policy to avoid recursion
  3. Allow users to view other users in their clinic for provider lookups
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view colleagues in same clinic" ON users;
DROP POLICY IF EXISTS "Users can view own full profile" ON users;

-- Create a helper function that gets the current user's clinic_id
-- SECURITY DEFINER allows this function to bypass RLS
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_clinic_id UUID;
BEGIN
  SELECT clinic_id INTO user_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_clinic_id;
END;
$$;

-- Create a policy that allows users to view their own profile
CREATE POLICY "Users can view own full profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Create a policy that allows users to view colleagues in same clinic
-- Uses the security definer function to avoid recursion
CREATE POLICY "Users can view colleagues in same clinic"
  ON users FOR SELECT
  TO authenticated
  USING (clinic_id = get_current_user_clinic_id());
