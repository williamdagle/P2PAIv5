/*
  # Add Personal Templates Support

  1. Schema Changes
    - Add `is_personal` column to `note_templates` (default: false)
    - Add `owner_user_id` column to `note_templates` (nullable, references users.id)
  
  2. Security Updates
    - Drop existing RLS policies for note_templates
    - Create new policies that handle both clinic-wide and personal templates
    - Personal templates: Only visible to owner
    - Clinic templates: Visible to all users in the clinic
  
  3. Notes
    - Existing templates will be marked as clinic templates (is_personal = false, owner_user_id = null)
    - New personal templates will have is_personal = true and owner_user_id set
*/

-- Add columns to note_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'note_templates' AND column_name = 'is_personal'
  ) THEN
    ALTER TABLE note_templates ADD COLUMN is_personal boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'note_templates' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE note_templates ADD COLUMN owner_user_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_note_templates_owner_user_id ON note_templates(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_note_templates_is_personal ON note_templates(is_personal);

-- Drop existing policies
DROP POLICY IF EXISTS "Note templates: clinic access" ON note_templates;
DROP POLICY IF EXISTS "Note templates: clinic read access" ON note_templates;
DROP POLICY IF EXISTS "Note templates: clinic insert access" ON note_templates;
DROP POLICY IF EXISTS "Note templates: clinic update access" ON note_templates;
DROP POLICY IF EXISTS "Note templates: clinic delete access" ON note_templates;

-- Create new comprehensive policies

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

-- INSERT: Users can create clinic templates for their clinic OR personal templates for themselves
CREATE POLICY "Templates: insert clinic templates"
  ON note_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    is_personal = false
    AND clinic_id IN (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Templates: insert personal templates"
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
  );

-- UPDATE: Users can update clinic templates from their clinic OR their own personal templates
CREATE POLICY "Templates: update clinic templates"
  ON note_templates FOR UPDATE
  TO authenticated
  USING (
    is_personal = false
    AND clinic_id IN (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    is_personal = false
    AND clinic_id IN (
      SELECT users.clinic_id
      FROM users
      WHERE users.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Templates: update personal templates"
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

-- DELETE: Users can delete clinic templates from their clinic OR their own personal templates
CREATE POLICY "Templates: delete clinic templates"
  ON note_templates FOR DELETE
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

CREATE POLICY "Templates: delete personal templates"
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
