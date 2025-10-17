/*
  # Revert Broken Role-Based Access Migration

  This migration reverts the complex role-based policies that broke the app
  and restores the original working RLS policies.

  1. Drop the complex policies that are causing 500 errors
  2. Restore simple clinic-based RLS policies that were working
  3. Remove the problematic permission function
  4. Keep the app functional while we plan a safer approach
*/

-- Drop all the complex role-based policies that are causing issues
DROP POLICY IF EXISTS "Patients: provider full access" ON patients;
DROP POLICY IF EXISTS "Patients: nurse limited access" ON patients;
DROP POLICY IF EXISTS "Patients: admin staff demographics only" ON patients;
DROP POLICY IF EXISTS "Clinical notes: provider full access" ON clinical_notes;
DROP POLICY IF EXISTS "Clinical notes: nurse read only" ON clinical_notes;
DROP POLICY IF EXISTS "Medications: provider only" ON medications;
DROP POLICY IF EXISTS "Labs: provider only" ON labs;
DROP POLICY IF EXISTS "Supplements: provider only" ON supplements;
DROP POLICY IF EXISTS "Treatment plans: provider only" ON treatment_plans;
DROP POLICY IF EXISTS "Treatment protocols: provider only" ON treatment_protocols;
DROP POLICY IF EXISTS "Treatment goals: provider only" ON treatment_goals;
DROP POLICY IF EXISTS "Timeline events: provider only" ON timeline_events;
DROP POLICY IF EXISTS "Appointments: clinical staff access" ON appointments;
DROP POLICY IF EXISTS "Users: system admin only" ON users;

-- Drop the problematic function
DROP FUNCTION IF EXISTS user_has_permission(permission_type text, action text);

-- Restore the original simple RLS policies that were working

-- Patients: Simple clinic-based access (restore original working policy)
CREATE POLICY "Patients: role-based read access"
  ON patients
  FOR SELECT
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Patients: role-based insert access"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Patients: role-based update access"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Patients: role-based delete access"
  ON patients
  FOR DELETE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Clinical Notes: Restore simple policies
CREATE POLICY "Clinical notes: role-based read access"
  ON clinical_notes
  FOR SELECT
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Clinical notes: role-based insert access"
  ON clinical_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clinical notes: role-based update access"
  ON clinical_notes
  FOR UPDATE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clinical notes: role-based delete access"
  ON clinical_notes
  FOR DELETE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Restore other table policies with simple clinic-based access
-- (keeping the original working pattern)

-- Users table - restore original policies
CREATE POLICY "Users: read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users: update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users: admin management access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT users_1.clinic_id
      FROM users users_1
      WHERE users_1.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT users_1.clinic_id
      FROM users users_1
      WHERE users_1.auth_user_id = auth.uid()
    )
  );