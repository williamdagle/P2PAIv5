/*
  # Update Admin Policies to System Admin

  1. Changes
    - Update RLS policies to use 'System Admin' role instead of 'Admin'
    - Drop existing policies and recreate with correct role name
    
  2. Security
    - Maintains same security level, just uses correct role name
*/

-- Drop existing admin policies
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Only admins can insert users'
    ) THEN
        DROP POLICY "Only admins can insert users" ON users;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Only admins can update users'
    ) THEN
        DROP POLICY "Only admins can update users" ON users;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Only admins can delete users'
    ) THEN
        DROP POLICY "Only admins can delete users" ON users;
    END IF;
END $$;

-- Create policy to restrict INSERT to System Admin only
CREATE POLICY "Only admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'System Admin'
  )
);

-- Create policy to restrict UPDATE to System Admin only
CREATE POLICY "Only admins can update users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'System Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'System Admin'
  )
);

-- Create policy to restrict DELETE to System Admin only
CREATE POLICY "Only admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'System Admin'
  )
);
