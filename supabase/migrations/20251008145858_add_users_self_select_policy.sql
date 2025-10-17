/*
  # Add User Self-Select Policy

  ## Changes
  1. Adds policy allowing users to read their own user record
     - Needed for login flow and profile lookups
     - Users can select their own record by auth_user_id
  
  2. Adds policy for INSERT/UPDATE/DELETE operations for regular users
     - Users in same clinic can manage each other (for admin operations within clinic)

  ## Security
  - Users can always read their own profile (required for login)
  - System Admins can see users in their organization (existing policy)
  - Regular users can see users in their clinic (existing policy)
  - Users can manage other users in their clinic (for clinic admin operations)
*/

-- Allow users to read their own profile
CREATE POLICY "Users: view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Allow users to manage users in their clinic (for clinic admins)
CREATE POLICY "Users: manage users in own clinic"
  ON users
  FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );
