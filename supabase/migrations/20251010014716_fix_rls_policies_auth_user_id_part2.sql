/*
  # Fix RLS Policies Part 2 - More Patient Data Tables

  Continue fixing policies to use auth_user_id instead of id
*/

-- ====================
-- PROBLEM LIST
-- ====================
DROP POLICY IF EXISTS "Users can create problem list items in their clinic" ON problem_list;
DROP POLICY IF EXISTS "Users can view problem list in their clinic" ON problem_list;
DROP POLICY IF EXISTS "Users can update problem list in their clinic" ON problem_list;
DROP POLICY IF EXISTS "Users can delete problem list in their clinic" ON problem_list;

CREATE POLICY "Users can create problem list items in their clinic"
  ON problem_list FOR INSERT
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

CREATE POLICY "Users can view problem list in their clinic"
  ON problem_list FOR SELECT
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

CREATE POLICY "Users can update problem list in their clinic"
  ON problem_list FOR UPDATE
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

CREATE POLICY "Users can delete problem list in their clinic"
  ON problem_list FOR DELETE
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
-- TREATMENT PLAN ITEMS
-- ====================
DROP POLICY IF EXISTS "Users can create treatment plan items in their clinic" ON treatment_plan_items;
DROP POLICY IF EXISTS "Users can view treatment plan items in their clinic" ON treatment_plan_items;
DROP POLICY IF EXISTS "Users can update treatment plan items in their clinic" ON treatment_plan_items;
DROP POLICY IF EXISTS "Users can delete treatment plan items in their clinic" ON treatment_plan_items;

CREATE POLICY "Users can create treatment plan items in their clinic"
  ON treatment_plan_items FOR INSERT
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

CREATE POLICY "Users can view treatment plan items in their clinic"
  ON treatment_plan_items FOR SELECT
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

CREATE POLICY "Users can update treatment plan items in their clinic"
  ON treatment_plan_items FOR UPDATE
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

CREATE POLICY "Users can delete treatment plan items in their clinic"
  ON treatment_plan_items FOR DELETE
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
-- IFM MATRIX ASSESSMENTS
-- ====================
DROP POLICY IF EXISTS "Users can create IFM matrix assessments for patients in their c" ON ifm_matrix_assessments;
DROP POLICY IF EXISTS "Users can view IFM matrix assessments for patients in their cli" ON ifm_matrix_assessments;
DROP POLICY IF EXISTS "Users can update IFM matrix assessments in their clinic" ON ifm_matrix_assessments;
DROP POLICY IF EXISTS "Users can delete IFM matrix assessments in their clinic" ON ifm_matrix_assessments;

CREATE POLICY "Users can create IFM matrix assessments for patients in their c"
  ON ifm_matrix_assessments FOR INSERT
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

CREATE POLICY "Users can view IFM matrix assessments for patients in their cli"
  ON ifm_matrix_assessments FOR SELECT
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

CREATE POLICY "Users can update IFM matrix assessments in their clinic"
  ON ifm_matrix_assessments FOR UPDATE
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

CREATE POLICY "Users can delete IFM matrix assessments in their clinic"
  ON ifm_matrix_assessments FOR DELETE
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
-- LIFESTYLE ASSESSMENTS
-- ====================
DROP POLICY IF EXISTS "Users can create lifestyle assessments for patients in their cl" ON lifestyle_assessments;
DROP POLICY IF EXISTS "Users can view lifestyle assessments for patients in their clin" ON lifestyle_assessments;
DROP POLICY IF EXISTS "Users can update lifestyle assessments in their clinic" ON lifestyle_assessments;
DROP POLICY IF EXISTS "Users can delete lifestyle assessments in their clinic" ON lifestyle_assessments;

CREATE POLICY "Users can create lifestyle assessments for patients in their cl"
  ON lifestyle_assessments FOR INSERT
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

CREATE POLICY "Users can view lifestyle assessments for patients in their clin"
  ON lifestyle_assessments FOR SELECT
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

CREATE POLICY "Users can update lifestyle assessments in their clinic"
  ON lifestyle_assessments FOR UPDATE
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

CREATE POLICY "Users can delete lifestyle assessments in their clinic"
  ON lifestyle_assessments FOR DELETE
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
-- HEALTH GOALS
-- ====================
DROP POLICY IF EXISTS "Users can create health goals for patients in their clinic" ON health_goals;
DROP POLICY IF EXISTS "Users can view health goals for patients in their clinic" ON health_goals;
DROP POLICY IF EXISTS "Users can update health goals in their clinic" ON health_goals;
DROP POLICY IF EXISTS "Users can delete health goals in their clinic" ON health_goals;

CREATE POLICY "Users can create health goals for patients in their clinic"
  ON health_goals FOR INSERT
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

CREATE POLICY "Users can view health goals for patients in their clinic"
  ON health_goals FOR SELECT
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

CREATE POLICY "Users can update health goals in their clinic"
  ON health_goals FOR UPDATE
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

CREATE POLICY "Users can delete health goals in their clinic"
  ON health_goals FOR DELETE
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
-- FOOD SENSITIVITIES
-- ====================
DROP POLICY IF EXISTS "Users can create food sensitivities for patients in their clini" ON food_sensitivities;
DROP POLICY IF EXISTS "Users can view food sensitivities for patients in their clinic" ON food_sensitivities;
DROP POLICY IF EXISTS "Users can update food sensitivities in their clinic" ON food_sensitivities;
DROP POLICY IF EXISTS "Users can delete food sensitivities in their clinic" ON food_sensitivities;

CREATE POLICY "Users can create food sensitivities for patients in their clini"
  ON food_sensitivities FOR INSERT
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

CREATE POLICY "Users can view food sensitivities for patients in their clinic"
  ON food_sensitivities FOR SELECT
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

CREATE POLICY "Users can update food sensitivities in their clinic"
  ON food_sensitivities FOR UPDATE
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

CREATE POLICY "Users can delete food sensitivities in their clinic"
  ON food_sensitivities FOR DELETE
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
