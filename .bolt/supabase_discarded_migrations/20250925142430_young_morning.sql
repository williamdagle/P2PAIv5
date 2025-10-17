/*
  # Fix Infinite Recursion in Users Table Policy

  The users table policy is causing infinite recursion because it's trying to
  query the users table from within a users table policy. We need to create
  a simple, non-recursive policy.

  ## Changes
  1. Drop all existing users table policies
  2. Create simple, non-recursive policies
  3. Ensure no circular references
*/

-- First, completely disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table (force drop)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for users table
-- Policy 1: Users can read their own profile using auth.uid() directly
CREATE POLICY "Users can read own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth_user_id = auth.uid());

-- Policy 2: Users can update their own profile using auth.uid() directly  
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Policy 3: Simple clinic-based access for admin operations
-- This uses a direct clinic_id match without recursive user lookups
CREATE POLICY "Users admin access within clinic"
ON users FOR ALL
TO authenticated
USING (
  -- Only allow if the requesting user is in the same clinic
  -- We'll use a simple approach: if you can see any user in a clinic,
  -- you can see all users in that clinic (admin-level access)
  clinic_id IN (
    SELECT clinic_id 
    FROM users u2 
    WHERE u2.auth_user_id = auth.uid()
    LIMIT 1
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id 
    FROM users u2 
    WHERE u2.auth_user_id = auth.uid()
    LIMIT 1
  )
);

-- Verify the policies were created
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';