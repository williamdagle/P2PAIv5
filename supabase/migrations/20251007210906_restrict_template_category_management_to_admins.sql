/*
  # Restrict Template and Category Management to System Admins

  1. Security Changes - note_templates
    - Drop existing clinic template policies
    - Create new policies:
      - SELECT: All users can read clinic templates, personal templates restricted to owner
      - INSERT: System admins can create clinic templates, all users can create personal templates
      - UPDATE: System admins can update clinic templates, users can update their own personal templates
      - DELETE: System admins can delete clinic templates, users can delete their own personal templates
  
  2. Security Changes - note_categories
    - Drop existing policies
    - Create new policies:
      - SELECT: All users can read categories
      - INSERT/UPDATE/DELETE: Only system admins can manage categories
  
  3. Important Notes
    - System admins are identified by role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'
    - Personal templates (is_personal = true) can be managed by their owner regardless of role
    - Clinic templates (is_personal = false) require system admin role
    - All categories are clinic-wide and require system admin role to manage
*/

-- ============================================
-- NOTE TEMPLATES POLICIES
-- ============================================

-- Drop existing note_templates policies
DROP POLICY IF EXISTS "Templates: read clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: read personal templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: insert clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: insert personal templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: update clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: update personal templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: delete clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: delete personal templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: system admins insert clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: users insert personal templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: system admins update clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: users update personal templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: system admins delete clinic templates" ON note_templates;
DROP POLICY IF EXISTS "Templates: users delete personal templates" ON note_templates;

-- SELECT: Users can see clinic templates from their clinic OR their own personal templates
CREATE POLICY "Templates: read clinic templates"
  ON note_templates FOR SELECT
  TO authenticated
  USING (
    is_personal = false 
    AND clinic_id IN (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Templates: read personal templates"
  ON note_templates FOR SELECT
  TO authenticated
  USING (
    is_personal = true 
    AND owner_user_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- INSERT: System admins can create clinic templates, all users can create personal templates
CREATE POLICY "Templates: system admins insert clinic templates"
  ON note_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    is_personal = false
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_templates.clinic_id
      LIMIT 1
    )
  );

CREATE POLICY "Templates: users insert personal templates"
  ON note_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    is_personal = true
    AND owner_user_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
    AND clinic_id IN (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- UPDATE: System admins can update clinic templates, users can update their own personal templates
CREATE POLICY "Templates: system admins update clinic templates"
  ON note_templates FOR UPDATE
  TO authenticated
  USING (
    is_personal = false
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_templates.clinic_id
      LIMIT 1
    )
  )
  WITH CHECK (
    is_personal = false
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_templates.clinic_id
      LIMIT 1
    )
  );

CREATE POLICY "Templates: users update personal templates"
  ON note_templates FOR UPDATE
  TO authenticated
  USING (
    is_personal = true
    AND owner_user_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    is_personal = true
    AND owner_user_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- DELETE: System admins can delete clinic templates, users can delete their own personal templates
CREATE POLICY "Templates: system admins delete clinic templates"
  ON note_templates FOR DELETE
  TO authenticated
  USING (
    is_personal = false
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_templates.clinic_id
      LIMIT 1
    )
  );

CREATE POLICY "Templates: users delete personal templates"
  ON note_templates FOR DELETE
  TO authenticated
  USING (
    is_personal = true
    AND owner_user_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- ============================================
-- NOTE CATEGORIES POLICIES
-- ============================================

-- Drop existing note_categories policies
DROP POLICY IF EXISTS "Note categories: clinic read access" ON note_categories;
DROP POLICY IF EXISTS "Note categories: clinic insert access" ON note_categories;
DROP POLICY IF EXISTS "Note categories: clinic update access" ON note_categories;
DROP POLICY IF EXISTS "Note categories: clinic delete access" ON note_categories;
DROP POLICY IF EXISTS "Categories can be read by clinic users" ON note_categories;
DROP POLICY IF EXISTS "Categories can be managed by clinic users" ON note_categories;
DROP POLICY IF EXISTS "Categories: read by clinic users" ON note_categories;
DROP POLICY IF EXISTS "Categories: system admins insert" ON note_categories;
DROP POLICY IF EXISTS "Categories: system admins update" ON note_categories;
DROP POLICY IF EXISTS "Categories: system admins delete" ON note_categories;

-- SELECT: All authenticated users can read categories from their clinic
CREATE POLICY "Categories: read by clinic users"
  ON note_categories FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- INSERT: Only system admins can create categories
CREATE POLICY "Categories: system admins insert"
  ON note_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_categories.clinic_id
      LIMIT 1
    )
  );

-- UPDATE: Only system admins can update categories
CREATE POLICY "Categories: system admins update"
  ON note_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_categories.clinic_id
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_categories.clinic_id
      LIMIT 1
    )
  );

-- DELETE: Only system admins can delete categories
CREATE POLICY "Categories: system admins delete"
  ON note_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role_id = 'd526ce28-e47a-4967-ae60-ed48be31f25e'::uuid
      AND users.clinic_id = note_categories.clinic_id
      LIMIT 1
    )
  );
