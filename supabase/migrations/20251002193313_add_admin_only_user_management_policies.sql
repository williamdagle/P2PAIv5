/*
  # Add Admin-Only User Management Policies

  1. Changes
    - Add RLS policies to restrict INSERT, UPDATE, and DELETE operations on users table to Admin role only
    - Maintains existing SELECT policies for all authenticated users
    
  2. Security
    - Only users with 'Admin' role can create new users
    - Only users with 'Admin' role can update existing users
    - Only users with 'Admin' role can delete users
    - All authenticated users can still view users in their clinic (existing SELECT policy)
*/

-- Drop existing policies if they exist for user management operations
DO $$
BEGIN
    -- Drop INSERT policy if exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Only admins can insert users'
    ) THEN
        DROP POLICY "Only admins can insert users" ON users;
    END IF;

    -- Drop UPDATE policy if exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Only admins can update users'
    ) THEN
        DROP POLICY "Only admins can update users" ON users;
    END IF;

    -- Drop DELETE policy if exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Only admins can delete users'
    ) THEN
        DROP POLICY "Only admins can delete users" ON users;
    END IF;
END $$;

-- Create policy to restrict INSERT to admins only
CREATE POLICY "Only admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'Admin'
  )
);

-- Create policy to restrict UPDATE to admins only
CREATE POLICY "Only admins can update users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'Admin'
  )
);

-- Create policy to restrict DELETE to admins only
CREATE POLICY "Only admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'Admin'
  )
);
