/*
  # Fix RLS Policies Part 3 - Additional Tables

  Continue fixing policies to use auth_user_id instead of id for remaining tables
*/

-- ====================
-- LAB TREND RESULTS
-- ====================
DROP POLICY IF EXISTS "Users can create lab trend results for their clinic" ON lab_trend_results;
DROP POLICY IF EXISTS "Users can view lab trend results from their clinic" ON lab_trend_results;
DROP POLICY IF EXISTS "Users can update lab trend results from their clinic" ON lab_trend_results;
DROP POLICY IF EXISTS "Users can delete lab trend results from their clinic" ON lab_trend_results;

CREATE POLICY "Users can create lab trend results for their clinic"
  ON lab_trend_results FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT users.clinic_id FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view lab trend results from their clinic"
  ON lab_trend_results FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT users.clinic_id FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lab trend results from their clinic"
  ON lab_trend_results FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT users.clinic_id FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT users.clinic_id FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lab trend results from their clinic"
  ON lab_trend_results FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT users.clinic_id FROM users
      WHERE users.auth_user_id = auth.uid()
    )
  );

-- ====================
-- CHIEF COMPLAINTS
-- ====================
DROP POLICY IF EXISTS "Users can create chief complaints for patients in their clinic" ON chief_complaints;
DROP POLICY IF EXISTS "Users can view chief complaints for patients in their clinic" ON chief_complaints;
DROP POLICY IF EXISTS "Users can update chief complaints in their clinic" ON chief_complaints;
DROP POLICY IF EXISTS "Users can delete chief complaints in their clinic" ON chief_complaints;

CREATE POLICY "Users can create chief complaints for patients in their clinic"
  ON chief_complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view chief complaints for patients in their clinic"
  ON chief_complaints FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update chief complaints in their clinic"
  ON chief_complaints FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete chief complaints in their clinic"
  ON chief_complaints FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

-- ====================
-- HISTORY PRESENT ILLNESS
-- ====================
DROP POLICY IF EXISTS "Users can create HPI for patients in their clinic" ON history_present_illness;
DROP POLICY IF EXISTS "Users can view HPI for patients in their clinic" ON history_present_illness;
DROP POLICY IF EXISTS "Users can update HPI in their clinic" ON history_present_illness;
DROP POLICY IF EXISTS "Users can delete HPI in their clinic" ON history_present_illness;

CREATE POLICY "Users can create HPI for patients in their clinic"
  ON history_present_illness FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view HPI for patients in their clinic"
  ON history_present_illness FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update HPI in their clinic"
  ON history_present_illness FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete HPI in their clinic"
  ON history_present_illness FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

-- ====================
-- PHYSICAL EXAMS
-- ====================
DROP POLICY IF EXISTS "Users can create physical exams for patients in their clinic" ON physical_exams;
DROP POLICY IF EXISTS "Users can view physical exams for patients in their clinic" ON physical_exams;
DROP POLICY IF EXISTS "Users can update physical exams in their clinic" ON physical_exams;
DROP POLICY IF EXISTS "Users can delete physical exams in their clinic" ON physical_exams;

CREATE POLICY "Users can create physical exams for patients in their clinic"
  ON physical_exams FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view physical exams for patients in their clinic"
  ON physical_exams FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update physical exams in their clinic"
  ON physical_exams FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete physical exams in their clinic"
  ON physical_exams FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

-- ====================
-- REVIEW OF SYSTEMS
-- ====================
DROP POLICY IF EXISTS "Users can create ROS for patients in their clinic" ON review_of_systems;
DROP POLICY IF EXISTS "Users can view ROS for patients in their clinic" ON review_of_systems;
DROP POLICY IF EXISTS "Users can update ROS in their clinic" ON review_of_systems;
DROP POLICY IF EXISTS "Users can delete ROS in their clinic" ON review_of_systems;

CREATE POLICY "Users can create ROS for patients in their clinic"
  ON review_of_systems FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view ROS for patients in their clinic"
  ON review_of_systems FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update ROS in their clinic"
  ON review_of_systems FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete ROS in their clinic"
  ON review_of_systems FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

-- ====================
-- SOAP NOTES
-- ====================
DROP POLICY IF EXISTS "Users can create SOAP notes in their clinic" ON soap_notes;
DROP POLICY IF EXISTS "Users can view SOAP notes in their clinic" ON soap_notes;
DROP POLICY IF EXISTS "Users can update SOAP notes in their clinic" ON soap_notes;
DROP POLICY IF EXISTS "Users can delete SOAP notes in their clinic" ON soap_notes;

CREATE POLICY "Users can create SOAP notes in their clinic"
  ON soap_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view SOAP notes in their clinic"
  ON soap_notes FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update SOAP notes in their clinic"
  ON soap_notes FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete SOAP notes in their clinic"
  ON soap_notes FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

-- ====================
-- LAB ORDERS
-- ====================
DROP POLICY IF EXISTS "Users can create lab orders in their clinic" ON lab_orders;
DROP POLICY IF EXISTS "Users can view lab orders in their clinic" ON lab_orders;
DROP POLICY IF EXISTS "Users can update lab orders in their clinic" ON lab_orders;
DROP POLICY IF EXISTS "Users can delete lab orders in their clinic" ON lab_orders;

CREATE POLICY "Users can create lab orders in their clinic"
  ON lab_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view lab orders in their clinic"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update lab orders in their clinic"
  ON lab_orders FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete lab orders in their clinic"
  ON lab_orders FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

-- ====================
-- ELIMINATION PROTOCOLS
-- ====================
DROP POLICY IF EXISTS "Users can create elimination protocols for patients in their cl" ON elimination_protocols;
DROP POLICY IF EXISTS "Users can view elimination protocols for patients in their clin" ON elimination_protocols;
DROP POLICY IF EXISTS "Users can update elimination protocols in their clinic" ON elimination_protocols;
DROP POLICY IF EXISTS "Users can delete elimination protocols in their clinic" ON elimination_protocols;

CREATE POLICY "Users can create elimination protocols for patients in their cl"
  ON elimination_protocols FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view elimination protocols for patients in their clin"
  ON elimination_protocols FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update elimination protocols in their clinic"
  ON elimination_protocols FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete elimination protocols in their clinic"
  ON elimination_protocols FOR DELETE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinics.id FROM clinics
      WHERE clinics.id = (
        SELECT users.clinic_id FROM users
        WHERE users.auth_user_id = auth.uid()
      )
    )
  );
