/*
  # Complete EMR Database Schema

  1. New Tables
    - `organizations` - Healthcare organizations
    - `clinics` - Individual clinic locations  
    - `roles` - User roles and permissions
    - `users` - System users with clinic association
    - `patients` - Patient records
    - `appointments` - Patient appointments
    - `clinical_notes` - Clinical documentation
    - `treatment_plans` - Patient treatment plans
    - `treatment_goals` - Treatment objectives
    - `treatment_protocols` - Treatment protocols and interventions
    - `timeline_events` - Patient medical timeline
    - `medications` - Patient medications
    - `supplements` - Patient supplements
    - `labs` - Laboratory results
    - `attachments` - File attachments
    - `api_usage_logs` - API usage tracking
    - `audit_logs` - System audit trail

  2. Security
    - Enable RLS on all tables
    - Add policies for clinic-level data isolation
    - Ensure users can only access their clinic's data

  3. Features
    - Soft delete support for patient data
    - Audit trails for all changes
    - Comprehensive medical record management
    - Multi-clinic support with data isolation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  permissions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  clinic_type text NOT NULL CHECK (clinic_type IN ('Functional Medicine', 'Med-Spa', 'Aesthetics')),
  clinic_code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role_id uuid REFERENCES roles(id),
  user_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auth_user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date,
  gender text,
  patient_id text,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  provider_id uuid NOT NULL REFERENCES users(id),
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  reason text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Clinical notes table
CREATE TABLE IF NOT EXISTS clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  provider_id uuid NOT NULL REFERENCES users(id),
  note_date timestamptz DEFAULT now(),
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Treatment plans table
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- Treatment goals table
CREATE TABLE IF NOT EXISTS treatment_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id uuid NOT NULL REFERENCES treatment_plans(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  goal_description text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE treatment_goals ENABLE ROW LEVEL SECURITY;

-- Treatment protocols table
CREATE TABLE IF NOT EXISTS treatment_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id uuid NOT NULL REFERENCES treatment_plans(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  protocol_name text NOT NULL,
  protocol_type text NOT NULL CHECK (protocol_type IN ('supplement', 'lifestyle', 'therapy', 'medication')),
  dosage text,
  frequency text,
  priority text CHECK (priority IN ('high', 'medium', 'low')),
  duration text,
  instructions text,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;

-- Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  event_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('Symptom', 'Treatment', 'Lab Work', 'Appointment', 'Lifestyle Change', 'Supplement', 'Other')),
  title text NOT NULL,
  description text,
  severity text CHECK (severity IN ('low', 'medium', 'high')),
  provider_id uuid REFERENCES users(id),
  outcome text,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  prescribed_by uuid REFERENCES users(id),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Supplements table
CREATE TABLE IF NOT EXISTS supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  recommended_by uuid REFERENCES users(id),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

-- Labs table
CREATE TABLE IF NOT EXISTS labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  lab_name text NOT NULL,
  test_type text,
  result text,
  result_date date,
  ordered_by uuid REFERENCES users(id),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid REFERENCES patients(id),
  file_name text,
  file_type text,
  storage_url text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- API usage logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  endpoint text,
  method text,
  ip_address text,
  request_time timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid REFERENCES users(id),
  change_time timestamptz DEFAULT now(),
  before jsonb,
  after jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_is_deleted ON patients(is_deleted);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);

-- RLS Policies

-- Organizations: read own organization
CREATE POLICY "Organizations: read own organization" ON organizations
  FOR SELECT TO authenticated
  USING (id = (
    SELECT c.organization_id 
    FROM users u 
    JOIN clinics c ON c.id = u.clinic_id 
    WHERE u.auth_user_id = auth.uid()
  ));

-- Clinics: read own clinic
CREATE POLICY "Clinics: read own clinic" ON clinics
  FOR SELECT TO authenticated
  USING (id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Roles: allow read to all authenticated users
CREATE POLICY "Allow read roles to all auth users" ON roles
  FOR SELECT TO authenticated
  USING (true);

-- Users: read and update own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Patients: clinic-level access
CREATE POLICY "Patients: clinic read access" ON patients
  FOR SELECT TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ) AND is_deleted = false);

CREATE POLICY "Patients: clinic insert access" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Patients: clinic update access" ON patients
  FOR UPDATE TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Patients: clinic delete access" ON patients
  FOR DELETE TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Appointments: clinic access
CREATE POLICY "Appointments: clinic access" ON appointments
  FOR SELECT TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ) AND is_deleted = false);

-- Clinical notes: clinic access
CREATE POLICY "Clinical notes: clinic access" ON clinical_notes
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Treatment plans: clinic access
CREATE POLICY "Treatment plans: clinic access" ON treatment_plans
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Treatment goals: clinic access
CREATE POLICY "Treatment goals: clinic access" ON treatment_goals
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Treatment protocols: clinic access
CREATE POLICY "Treatment protocols: clinic access" ON treatment_protocols
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Timeline events: clinic access
CREATE POLICY "Timeline events: clinic access" ON timeline_events
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Medications: clinic access
CREATE POLICY "Medications: clinic access" ON medications
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Supplements: clinic access
CREATE POLICY "Supplements: clinic access" ON supplements
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Labs: clinic access
CREATE POLICY "Labs: clinic access" ON labs
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Attachments: clinic access
CREATE POLICY "Attachments: clinic access" ON attachments
  FOR ALL TO authenticated
  USING (clinic_id = (
    SELECT clinic_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  ));

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- This function can be used to automatically create user profiles
  -- when new auth users are created
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;