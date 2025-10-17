/*
  # Enhance Clinical Notes System

  1. Schema Updates
    - Add missing columns to `clinical_notes` table:
      - `note_type` (text) - 'provider_note' or 'quick_note'
      - `template_id` (text, nullable) - For provider notes
      - `category` (text, nullable) - For quick notes
      - `title` (text) - Note title
      - `raw_content` (text, nullable) - Plain text content
      - `structured_content` (jsonb, nullable) - Template-based content

  2. Security
    - Maintain existing RLS policies
    - Ensure all new columns are properly secured

  3. Data Integrity
    - Add constraints for note_type values
    - Set appropriate defaults
*/

-- Add missing columns to clinical_notes table
DO $$
BEGIN
  -- Add note_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_notes' AND column_name = 'note_type'
  ) THEN
    ALTER TABLE clinical_notes ADD COLUMN note_type TEXT DEFAULT 'provider_note';
  END IF;

  -- Add template_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_notes' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE clinical_notes ADD COLUMN template_id TEXT;
  END IF;

  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_notes' AND column_name = 'category'
  ) THEN
    ALTER TABLE clinical_notes ADD COLUMN category TEXT;
  END IF;

  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_notes' AND column_name = 'title'
  ) THEN
    ALTER TABLE clinical_notes ADD COLUMN title TEXT DEFAULT 'Clinical Note';
  END IF;

  -- Add raw_content column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_notes' AND column_name = 'raw_content'
  ) THEN
    ALTER TABLE clinical_notes ADD COLUMN raw_content TEXT;
  END IF;

  -- Add structured_content column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_notes' AND column_name = 'structured_content'
  ) THEN
    ALTER TABLE clinical_notes ADD COLUMN structured_content JSONB;
  END IF;
END $$;

-- Add constraints for note_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'clinical_notes_note_type_check'
  ) THEN
    ALTER TABLE clinical_notes 
    ADD CONSTRAINT clinical_notes_note_type_check 
    CHECK (note_type IN ('provider_note', 'quick_note'));
  END IF;
END $$;

-- Update existing records to have proper note_type
UPDATE clinical_notes 
SET note_type = 'provider_note', 
    title = COALESCE(title, 'Clinical Note')
WHERE note_type IS NULL OR title IS NULL;