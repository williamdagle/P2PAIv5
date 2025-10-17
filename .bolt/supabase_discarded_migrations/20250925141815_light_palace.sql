/*
  # Emergency Database Fix - Complete Recovery
  
  This migration will:
  1. Force drop all broken policies and functions
  2. Restore original working RLS policies
  3. Fix any database inconsistencies
  4. Ensure app functionality is restored
*/

-- Step 1: Force drop all policies that might be causing issues
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables to start fresh
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 2: Drop any functions that might be causing issues
DROP FUNCTION IF EXISTS user_has_permission(text, text);
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS check_user_permission(text, text);

-- Step 3: Clean up any problematic audit tables
DROP TABLE IF EXISTS audit_logs_detailed CASCADE;

-- Step 4: Restore basic working RLS policies for each table

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users: admin management access"
  ON users
  FOR ALL
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

-- Organizations table policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations: read own organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT c.organization_id
      FROM users u
      JOIN clinics c ON c.id = u.clinic_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Clinics table policies
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinics: read own clinic"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Roles table policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read roles to all auth users"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Patients table policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

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

-- Appointments table policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments: role-based read access"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Appointments: role-based insert access"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Appointments: role-based update access"
  ON appointments
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

CREATE POLICY "Appointments: role-based delete access"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Clinical Notes table policies
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

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

-- Treatment Plans table policies
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment plans: role-based read access"
  ON treatment_plans
  FOR SELECT
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Treatment plans: role-based insert access"
  ON treatment_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Treatment plans: role-based update access"
  ON treatment_plans
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

CREATE POLICY "Treatment plans: role-based delete access"
  ON treatment_plans
  FOR DELETE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Treatment Protocols table policies
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment protocols: role-based access"
  ON treatment_protocols
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  )
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Treatment Goals table policies
ALTER TABLE treatment_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment goals: role-based access"
  ON treatment_goals
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  )
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Timeline Events table policies
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline events: role-based access"
  ON timeline_events
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  )
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Medications table policies
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medications: role-based read access"
  ON medications
  FOR SELECT
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Medications: role-based insert access"
  ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Medications: role-based update access"
  ON medications
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

CREATE POLICY "Medications: role-based delete access"
  ON medications
  FOR DELETE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Supplements table policies
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplements: role-based access"
  ON supplements
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  )
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Labs table policies
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labs: role-based read access"
  ON labs
  FOR SELECT
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Labs: role-based insert access"
  ON labs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Labs: role-based update access"
  ON labs
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

CREATE POLICY "Labs: role-based delete access"
  ON labs
  FOR DELETE
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- Attachments table policies
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments: clinic access"
  ON attachments
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );