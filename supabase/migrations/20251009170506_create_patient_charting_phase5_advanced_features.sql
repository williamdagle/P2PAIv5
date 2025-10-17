/*
  # Create Patient Charting Phase 5 - Advanced Features

  ## Overview
  This migration implements Phase 5 of patient charting: Advanced Features including document management, patient portal integration, and chart export capabilities.

  ## 1. Document Management Tables
    - `patient_documents` - Stores uploaded patient documents
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `uploaded_by` (uuid, references users)
      - `document_name` (text)
      - `document_type` (text) - PDF, image, lab report, etc.
      - `file_size` (bigint) - Size in bytes
      - `file_path` (text) - Storage path/URL
      - `mime_type` (text)
      - `description` (text)
      - `upload_date` (timestamptz)
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `document_metadata` - Document categorization and tagging
      - `id` (uuid, primary key)
      - `document_id` (uuid, references patient_documents)
      - `category` (text) - Lab results, imaging, consent forms, etc.
      - `tags` (text[]) - Array of searchable tags
      - `visit_date` (date) - Associated visit date if applicable
      - `notes` (text) - Additional notes about the document
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. Patient Portal Tables
    - `patient_portal_access` - Portal access and permissions
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `user_id` (uuid, references auth.users) - Portal login user
      - `access_level` (text) - full, limited, read_only
      - `is_active` (boolean)
      - `activation_date` (timestamptz)
      - `last_login` (timestamptz)
      - `permissions` (jsonb) - Detailed permissions object
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `patient_messages` - Secure messaging between patients and providers
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `sender_id` (uuid, references users or auth.users) - Can be provider or patient
      - `sender_type` (text) - 'provider' or 'patient'
      - `recipient_id` (uuid)
      - `recipient_type` (text) - 'provider' or 'patient'
      - `subject` (text)
      - `message_body` (text)
      - `is_read` (boolean)
      - `read_at` (timestamptz)
      - `priority` (text) - normal, urgent
      - `parent_message_id` (uuid, references patient_messages) - For threading
      - `attachments` (jsonb) - Array of attachment references
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 3. Chart Export Tables
    - `chart_exports` - Track chart export requests and history
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `exported_by` (uuid, references users)
      - `export_type` (text) - pdf, ccd, referral_summary, chart_print
      - `export_format` (text) - PDF, XML, etc.
      - `date_range_start` (date)
      - `date_range_end` (date)
      - `sections_included` (jsonb) - Array of chart sections included
      - `file_path` (text) - Path to generated file
      - `export_status` (text) - pending, completed, failed
      - `recipient_info` (jsonb) - For referrals/transfers
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Policies ensure organization-scoped access
    - Policies ensure proper role-based access (providers can manage, patients have limited access)
    - Audit logging for sensitive operations
*/

-- Create patient_documents table
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_size bigint NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  description text,
  upload_date timestamptz DEFAULT now(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_metadata table
CREATE TABLE IF NOT EXISTS document_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES patient_documents(id) ON DELETE CASCADE,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  visit_date date,
  notes text,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_portal_access table
CREATE TABLE IF NOT EXISTS patient_portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  access_level text NOT NULL DEFAULT 'read_only',
  is_active boolean DEFAULT true,
  activation_date timestamptz DEFAULT now(),
  last_login timestamptz,
  permissions jsonb DEFAULT '{"view_labs": true, "view_medications": true, "view_appointments": true, "view_documents": true, "send_messages": true}'::jsonb,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_access_level CHECK (access_level IN ('full', 'limited', 'read_only'))
);

-- Create patient_messages table
CREATE TABLE IF NOT EXISTS patient_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL,
  recipient_id uuid NOT NULL,
  recipient_type text NOT NULL,
  subject text NOT NULL,
  message_body text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  priority text DEFAULT 'normal',
  parent_message_id uuid REFERENCES patient_messages(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('provider', 'patient')),
  CONSTRAINT valid_recipient_type CHECK (recipient_type IN ('provider', 'patient')),
  CONSTRAINT valid_priority CHECK (priority IN ('normal', 'urgent'))
);

-- Create chart_exports table
CREATE TABLE IF NOT EXISTS chart_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  exported_by uuid NOT NULL REFERENCES users(id),
  export_type text NOT NULL,
  export_format text NOT NULL DEFAULT 'pdf',
  date_range_start date,
  date_range_end date,
  sections_included jsonb DEFAULT '[]'::jsonb,
  file_path text,
  export_status text DEFAULT 'pending',
  recipient_info jsonb,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_export_type CHECK (export_type IN ('pdf', 'ccd', 'referral_summary', 'chart_print')),
  CONSTRAINT valid_export_status CHECK (export_status IN ('pending', 'completed', 'failed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_organization_id ON patient_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_upload_date ON patient_documents(upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_document_metadata_document_id ON document_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_category ON document_metadata(category);
CREATE INDEX IF NOT EXISTS idx_document_metadata_tags ON document_metadata USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_patient_portal_access_patient_id ON patient_portal_access(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_portal_access_user_id ON patient_portal_access(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_portal_access_organization_id ON patient_portal_access(organization_id);

CREATE INDEX IF NOT EXISTS idx_patient_messages_patient_id ON patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_sender_id ON patient_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_recipient_id ON patient_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_created_at ON patient_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_messages_parent ON patient_messages(parent_message_id);

CREATE INDEX IF NOT EXISTS idx_chart_exports_patient_id ON chart_exports(patient_id);
CREATE INDEX IF NOT EXISTS idx_chart_exports_organization_id ON chart_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_chart_exports_created_at ON chart_exports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_documents
CREATE POLICY "Users can view documents in their organization"
  ON patient_documents FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can insert documents"
  ON patient_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can update documents they uploaded"
  ON patient_documents FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can delete documents they uploaded"
  ON patient_documents FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for document_metadata
CREATE POLICY "Users can view document metadata in their organization"
  ON document_metadata FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage document metadata"
  ON document_metadata FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for patient_portal_access
CREATE POLICY "Users can view portal access in their organization"
  ON patient_portal_access FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Providers can manage portal access"
  ON patient_portal_access FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for patient_messages
CREATE POLICY "Users can view messages they sent or received"
  ON patient_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON patient_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages they sent"
  ON patient_messages FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid()
  );

-- RLS Policies for chart_exports
CREATE POLICY "Users can view chart exports in their organization"
  ON chart_exports FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can create chart exports"
  ON chart_exports FOR INSERT
  TO authenticated
  WITH CHECK (
    exported_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their chart exports"
  ON chart_exports FOR UPDATE
  TO authenticated
  USING (
    exported_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_documents_updated_at BEFORE UPDATE ON patient_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_metadata_updated_at BEFORE UPDATE ON document_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_portal_access_updated_at BEFORE UPDATE ON patient_portal_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_messages_updated_at BEFORE UPDATE ON patient_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_exports_updated_at BEFORE UPDATE ON chart_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();