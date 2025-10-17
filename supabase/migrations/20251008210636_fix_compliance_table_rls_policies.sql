/*
  # Fix Compliance Table RLS Policies

  1. Updates
    - Drop existing incorrect policies on compliance tables
    - Create new policies that properly check auth_user_id instead of users.id
    - Use correct role name casing (System Admin, Admin)
    
  2. Security
    - Maintains admin-only access to compliance data
    - Properly maps auth.uid() to users.auth_user_id for role checking
*/

-- Drop existing policies for compliance_reports
DROP POLICY IF EXISTS "compliance_reports_select_admin" ON compliance_reports;
DROP POLICY IF EXISTS "compliance_reports_insert_admin" ON compliance_reports;
DROP POLICY IF EXISTS "compliance_reports_update_admin" ON compliance_reports;

-- Drop existing policies for compliance_monitoring
DROP POLICY IF EXISTS "compliance_monitoring_select_admin" ON compliance_monitoring;
DROP POLICY IF EXISTS "compliance_monitoring_insert_admin" ON compliance_monitoring;
DROP POLICY IF EXISTS "compliance_monitoring_update_admin" ON compliance_monitoring;

-- Drop existing policies for risk_assessments
DROP POLICY IF EXISTS "risk_assessments_select_admin" ON risk_assessments;
DROP POLICY IF EXISTS "risk_assessments_insert_admin" ON risk_assessments;
DROP POLICY IF EXISTS "risk_assessments_update_admin" ON risk_assessments;

-- Drop existing policies for vulnerability_scans
DROP POLICY IF EXISTS "vulnerability_scans_select_admin" ON vulnerability_scans;
DROP POLICY IF EXISTS "vulnerability_scans_insert_admin" ON vulnerability_scans;
DROP POLICY IF EXISTS "vulnerability_scans_update_admin" ON vulnerability_scans;

-- Drop existing policies for security_controls
DROP POLICY IF EXISTS "security_controls_select_authenticated" ON security_controls;
DROP POLICY IF EXISTS "security_controls_insert_admin" ON security_controls;
DROP POLICY IF EXISTS "security_controls_update_admin" ON security_controls;

-- Create new policies for compliance_reports
CREATE POLICY "Admins can view compliance reports"
  ON compliance_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can insert compliance reports"
  ON compliance_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can update compliance reports"
  ON compliance_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

-- Create new policies for compliance_monitoring
CREATE POLICY "Admins can view compliance monitoring"
  ON compliance_monitoring
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can insert compliance monitoring"
  ON compliance_monitoring
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can update compliance monitoring"
  ON compliance_monitoring
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

-- Create new policies for risk_assessments
CREATE POLICY "Admins can view risk assessments"
  ON risk_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can insert risk assessments"
  ON risk_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can update risk assessments"
  ON risk_assessments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

-- Create new policies for vulnerability_scans
CREATE POLICY "Admins can view vulnerability scans"
  ON vulnerability_scans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can insert vulnerability scans"
  ON vulnerability_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can update vulnerability scans"
  ON vulnerability_scans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

-- Create new policies for security_controls (all authenticated users can view, admins can modify)
CREATE POLICY "All authenticated users can view security controls"
  ON security_controls
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert security controls"
  ON security_controls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can update security controls"
  ON security_controls
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.auth_user_id = auth.uid()
      AND roles.name IN ('System Admin', 'Admin')
    )
  );