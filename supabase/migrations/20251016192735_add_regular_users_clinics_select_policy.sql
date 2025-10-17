/*
  # Add Regular Users SELECT Policy for Clinics Table

  ## Problem
  Regular users (non-System-Admins) cannot read from the clinics table during login.
  The login query includes: `clinics(aesthetics_module_enabled)` as a join.
  Only System Admin policies exist on the clinics table, causing 500 errors for regular users.

  ## Solution
  Add a SELECT policy that allows authenticated users to read their own clinic's data.
  Uses the existing `get_current_user_clinic_id()` helper function to avoid infinite recursion.

  ## Changes
  1. Add SELECT policy on clinics table for regular users
     - Allows users to read only the clinic they belong to
     - Uses security definer function to prevent recursion
     - Required for login flow and profile loading

  ## Security
  - Users can only read their own clinic (via clinic_id match)
  - System Admin policies remain unchanged
  - No write access granted, only SELECT
*/

-- Create policy that allows authenticated users to read their own clinic
CREATE POLICY "Users can view own clinic"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (id = get_current_user_clinic_id());
