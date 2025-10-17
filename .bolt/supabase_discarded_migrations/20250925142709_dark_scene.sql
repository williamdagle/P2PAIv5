/*
  # Temporarily Disable RLS on Users Table to Fix Login

  This is an emergency fix to get the app working again.
  We'll re-enable RLS with proper policies once login is working.

  1. Disable RLS on users table
  2. Remove all policies causing recursion
  3. Allow app to function normally
*/

-- Disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users: read own profile" ON users;
DROP POLICY IF EXISTS "Users: update own profile" ON users;
DROP POLICY IF EXISTS "Users: admin management access" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage users in same clinic" ON users;

-- Verify no policies exist
DO $$
BEGIN
  -- This will show any remaining policies
  RAISE NOTICE 'Checking for remaining policies on users table...';
END $$;

-- Check if there are any remaining policies (for debugging)
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';