/*
  # Enable RLS on Users Table

  ## Changes
  1. Enables Row Level Security on the users table
     - RLS was disabled, causing all users to be visible regardless of organization
     - This fix ensures policies are actually enforced

  ## Security
  - System Admins can only see users in their organization
  - Regular users can only see users in their own clinic
  - All existing policies will now be enforced
*/

-- Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
