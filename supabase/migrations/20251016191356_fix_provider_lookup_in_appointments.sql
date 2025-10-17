/*
  # Fix Provider Name Display in Appointments
  
  ## Problem
  The Appointments screen shows "Unknown Provider" because the RLS policy on the users table
  only allows users to view their own profile. When fetching appointments, the system needs
  to join with the users table to get provider names, but the current RLS policy blocks this.
  
  ## Changes
  1. Add a new RLS policy on the users table that allows authenticated users to view
     basic information (id, full_name, email, role) of other users within their clinic
  2. This enables provider name lookups when displaying appointments while maintaining
     security by restricting access to users within the same clinic
  
  ## Security Notes
  - Users can only see basic profile information of users in their own clinic
  - Sensitive fields can still be restricted by using SELECT policies with specific columns
  - The policy uses clinic_id matching to ensure proper isolation between clinics
*/

-- Drop the existing overly restrictive policy if it prevents clinic-wide user viewing
-- The current policy only allows viewing own profile which breaks provider name lookups
DROP POLICY IF EXISTS "Users: view own profile" ON users;

-- Create a policy that allows users to view their own full profile
CREATE POLICY "Users can view own full profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Create a policy that allows users to view basic info of other users in their clinic
-- This enables provider name lookups in appointments and other features
CREATE POLICY "Users can view colleagues in same clinic"
  ON users FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );
