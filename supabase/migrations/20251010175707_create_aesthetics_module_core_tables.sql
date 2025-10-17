/*
  # Create Aesthetics Module - Core Tables

  ## Summary
  This migration creates the foundational database structure for the Aesthetics & Med-Spa module.
  It includes all core tables for treatments, photos, consent forms, inventory, POS, memberships,
  and gift cards. The module is designed to be modular and can be enabled/disabled per clinic.

  ## New Tables
  
  ### 1. aesthetic_treatments
  - Stores all aesthetic treatment records with detailed procedure information
  - Links to patients and includes treatment type, areas treated, products used
  - Tracks units/volume used, batch numbers, and treatment outcomes
  
  ### 2. aesthetic_photos
  - Stores before/after treatment photos with metadata
  - Links to treatments and patients
  - Includes facial grid coordinates and annotation data
  - Stores AI analysis results reference
  
  ### 3. aesthetic_photo_ai_analysis
  - Stores AI-generated facial analysis results
  - Includes landmark detection, symmetry analysis, skin quality metrics
  - Tracks analysis version for future model updates
  
  ### 4. aesthetic_consent_forms
  - Digital consent form records with e-signature support
  - Stores form content, patient acknowledgment, and signature data
  - Tracks IP address and device for audit compliance
  
  ### 5. aesthetic_packages
  - Bundled treatment offerings with pricing
  - Tracks number of treatments included and expiration rules
  
  ### 6. aesthetic_package_redemptions
  - Tracks usage of purchased packages
  - Links to treatments and monitors remaining balance
  
  ### 7. aesthetic_inventory
  - Product catalog for injectables and retail items
  - Tracks stock levels, lot numbers, and expiration dates
  - Supports FDA compliance for injectable tracking
  
  ### 8. aesthetic_inventory_transactions
  - Audit log for all inventory changes
  - Tracks additions, deductions, adjustments, and waste
  
  ### 9. aesthetic_memberships
  - Patient membership programs with tiered benefits
  - Includes billing cycle and auto-renewal settings
  - Stores membership level and discount percentages
  
  ### 10. aesthetic_gift_cards
  - Digital and physical gift card management
  - Tracks balance, redemptions, and expiration
  
  ### 11. aesthetic_pos_transactions
  - Point of sale transaction records
  - Integrates with Stripe for payment processing
  - Tracks line items, taxes, tips, and payment status
  
  ### 12. aesthetic_treatment_templates
  - Procedure-specific SOAP note templates
  - Extends existing template system for aesthetic treatments
  - Stores structured field definitions for each treatment type

  ## Clinic Settings Update
  - Adds aesthetics_module_enabled to clinics table
  - Adds aesthetics_features JSONB for granular feature toggles

  ## Security
  - All tables have RLS enabled
  - Clinic-based and patient-based access policies
  - Service role has full access for Edge Functions
  - Authenticated users can only access their clinic's data

  ## Performance
  - Indexes on foreign keys and frequently queried columns
  - Composite indexes for common query patterns
*/

-- Add aesthetics module settings to clinics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinics' AND column_name = 'aesthetics_module_enabled'
  ) THEN
    ALTER TABLE clinics ADD COLUMN aesthetics_module_enabled boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinics' AND column_name = 'aesthetics_features'
  ) THEN
    ALTER TABLE clinics ADD COLUMN aesthetics_features jsonb DEFAULT '{"pos": true, "memberships": true, "inventory": true, "ai_photo_analysis": true, "gift_cards": true}'::jsonb;
  END IF;
END $$;

-- Create aesthetic_treatments table
CREATE TABLE IF NOT EXISTS aesthetic_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES users(id),
  treatment_date date NOT NULL DEFAULT CURRENT_DATE,
  treatment_type text NOT NULL,
  treatment_name text NOT NULL,
  areas_treated text[] NOT NULL DEFAULT '{}',
  products_used jsonb NOT NULL DEFAULT '[]',
  units_used numeric(10,2),
  volume_ml numeric(10,2),
  batch_numbers text[] DEFAULT '{}',
  technique_notes text,
  patient_tolerance text,
  immediate_response text,
  adverse_events text,
  follow_up_date date,
  treatment_outcome text,
  outcome_rating integer CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
  clinical_notes text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aesthetic treatments: clinic access"
  ON aesthetic_treatments FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Aesthetic treatments: clinic insert"
  ON aesthetic_treatments FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Aesthetic treatments: clinic update"
  ON aesthetic_treatments FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Aesthetic treatments: clinic delete"
  ON aesthetic_treatments FOR DELETE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_aesthetic_treatments_clinic ON aesthetic_treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_treatments_patient ON aesthetic_treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_treatments_date ON aesthetic_treatments(treatment_date DESC);
CREATE INDEX IF NOT EXISTS idx_aesthetic_treatments_type ON aesthetic_treatments(treatment_type);

-- Create aesthetic_photos table
CREATE TABLE IF NOT EXISTS aesthetic_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES aesthetic_treatments(id) ON DELETE SET NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after', 'during', 'consultation')),
  photo_url text NOT NULL,
  thumbnail_url text,
  view_angle text,
  body_area text,
  facial_grid_data jsonb,
  annotations jsonb DEFAULT '[]',
  lighting_notes text,
  camera_settings jsonb,
  consent_obtained boolean DEFAULT false,
  consent_date timestamptz,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aesthetic photos: clinic access"
  ON aesthetic_photos FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Aesthetic photos: clinic insert"
  ON aesthetic_photos FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Aesthetic photos: clinic update"
  ON aesthetic_photos FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Aesthetic photos: clinic delete"
  ON aesthetic_photos FOR DELETE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_aesthetic_photos_clinic ON aesthetic_photos(clinic_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_photos_patient ON aesthetic_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_photos_treatment ON aesthetic_photos(treatment_id);
CREATE INDEX IF NOT EXISTS idx_aesthetic_photos_type ON aesthetic_photos(photo_type);

-- Create aesthetic_photo_ai_analysis table
CREATE TABLE IF NOT EXISTS aesthetic_photo_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES aesthetic_photos(id) ON DELETE CASCADE,
  analysis_version text NOT NULL DEFAULT '1.0',
  facial_landmarks jsonb,
  symmetry_score numeric(5,2),
  skin_texture_score numeric(5,2),
  skin_tone_analysis jsonb,
  volume_assessment jsonb,
  wrinkle_mapping jsonb,
  age_estimation integer,
  skin_quality_score numeric(5,2),
  detected_concerns text[],
  treatment_recommendations text[],
  analysis_metadata jsonb DEFAULT '{}',
  processed_at timestamptz DEFAULT now(),
  processing_duration_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_photo_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI analysis: clinic access"
  ON aesthetic_photo_ai_analysis FOR SELECT
  TO authenticated
  USING (photo_id IN (SELECT id FROM aesthetic_photos WHERE clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "AI analysis: clinic insert"
  ON aesthetic_photo_ai_analysis FOR INSERT
  TO authenticated
  WITH CHECK (photo_id IN (SELECT id FROM aesthetic_photos WHERE clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_ai_analysis_photo ON aesthetic_photo_ai_analysis(photo_id);

-- Create aesthetic_consent_forms table
CREATE TABLE IF NOT EXISTS aesthetic_consent_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES aesthetic_treatments(id) ON DELETE SET NULL,
  form_type text NOT NULL,
  form_title text NOT NULL,
  form_content jsonb NOT NULL,
  consent_text text NOT NULL,
  patient_signature_data text NOT NULL,
  patient_signature_date timestamptz NOT NULL DEFAULT now(),
  witness_signature_data text,
  witness_name text,
  witness_signature_date timestamptz,
  ip_address text,
  device_info text,
  consent_version text NOT NULL DEFAULT '1.0',
  is_expired boolean DEFAULT false,
  expiration_date date,
  signed_pdf_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consent forms: clinic access"
  ON aesthetic_consent_forms FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Consent forms: clinic insert"
  ON aesthetic_consent_forms FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Consent forms: clinic update"
  ON aesthetic_consent_forms FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_consent_forms_clinic ON aesthetic_consent_forms(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_patient ON aesthetic_consent_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_treatment ON aesthetic_consent_forms(treatment_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_expiration ON aesthetic_consent_forms(expiration_date) WHERE is_expired = false;

-- Create aesthetic_packages table
CREATE TABLE IF NOT EXISTS aesthetic_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  package_description text,
  treatment_types text[] NOT NULL,
  number_of_treatments integer NOT NULL DEFAULT 1,
  regular_price numeric(10,2) NOT NULL,
  package_price numeric(10,2) NOT NULL,
  savings_amount numeric(10,2) GENERATED ALWAYS AS (regular_price - package_price) STORED,
  validity_days integer DEFAULT 365,
  is_active boolean DEFAULT true,
  terms_conditions text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages: clinic access"
  ON aesthetic_packages FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Packages: clinic insert"
  ON aesthetic_packages FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Packages: clinic update"
  ON aesthetic_packages FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_packages_clinic ON aesthetic_packages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON aesthetic_packages(is_active);

-- Create aesthetic_package_redemptions table
CREATE TABLE IF NOT EXISTS aesthetic_package_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES aesthetic_packages(id),
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  expiration_date date NOT NULL,
  total_treatments integer NOT NULL,
  treatments_remaining integer NOT NULL,
  treatments_used integer GENERATED ALWAYS AS (total_treatments - treatments_remaining) STORED,
  purchase_price numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  purchase_transaction_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_package_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Package redemptions: clinic access"
  ON aesthetic_package_redemptions FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Package redemptions: clinic insert"
  ON aesthetic_package_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Package redemptions: clinic update"
  ON aesthetic_package_redemptions FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_package_redemptions_clinic ON aesthetic_package_redemptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_package_redemptions_patient ON aesthetic_package_redemptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_package_redemptions_active ON aesthetic_package_redemptions(is_active, expiration_date);

-- Create aesthetic_inventory table
CREATE TABLE IF NOT EXISTS aesthetic_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  product_category text NOT NULL CHECK (product_category IN ('injectable', 'filler', 'toxin', 'skincare', 'device_consumable', 'retail', 'other')),
  product_name text NOT NULL,
  product_brand text,
  sku text,
  description text,
  unit_size text,
  current_stock integer NOT NULL DEFAULT 0,
  reorder_point integer DEFAULT 5,
  unit_cost numeric(10,2),
  retail_price numeric(10,2),
  requires_lot_tracking boolean DEFAULT false,
  requires_expiration_tracking boolean DEFAULT false,
  is_active boolean DEFAULT true,
  supplier_name text,
  supplier_contact text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory: clinic access"
  ON aesthetic_inventory FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Inventory: clinic insert"
  ON aesthetic_inventory FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Inventory: clinic update"
  ON aesthetic_inventory FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_inventory_clinic ON aesthetic_inventory(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON aesthetic_inventory(product_category);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON aesthetic_inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON aesthetic_inventory(current_stock) WHERE current_stock <= reorder_point;

-- Create aesthetic_inventory_transactions table
CREATE TABLE IF NOT EXISTS aesthetic_inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES aesthetic_inventory(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'waste', 'transfer', 'return')),
  quantity integer NOT NULL,
  lot_number text,
  expiration_date date,
  unit_cost numeric(10,2),
  total_cost numeric(10,2),
  related_treatment_id uuid REFERENCES aesthetic_treatments(id),
  related_transaction_id uuid,
  reason text,
  notes text,
  performed_by uuid REFERENCES users(id),
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory transactions: clinic access"
  ON aesthetic_inventory_transactions FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Inventory transactions: clinic insert"
  ON aesthetic_inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_inventory_trans_clinic ON aesthetic_inventory_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_inventory ON aesthetic_inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_date ON aesthetic_inventory_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_lot ON aesthetic_inventory_transactions(lot_number) WHERE lot_number IS NOT NULL;

-- Create aesthetic_memberships table
CREATE TABLE IF NOT EXISTS aesthetic_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  membership_tier text NOT NULL,
  membership_name text NOT NULL,
  monthly_fee numeric(10,2) NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  auto_renew boolean DEFAULT true,
  discount_percentage numeric(5,2) DEFAULT 0,
  benefits jsonb DEFAULT '{}',
  credits_balance numeric(10,2) DEFAULT 0,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  cancellation_date date,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships: clinic access"
  ON aesthetic_memberships FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Memberships: clinic insert"
  ON aesthetic_memberships FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Memberships: clinic update"
  ON aesthetic_memberships FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_memberships_clinic ON aesthetic_memberships(clinic_id);
CREATE INDEX IF NOT EXISTS idx_memberships_patient ON aesthetic_memberships(patient_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON aesthetic_memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe ON aesthetic_memberships(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Create aesthetic_gift_cards table
CREATE TABLE IF NOT EXISTS aesthetic_gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  card_code text NOT NULL UNIQUE,
  card_type text NOT NULL DEFAULT 'digital' CHECK (card_type IN ('digital', 'physical')),
  original_amount numeric(10,2) NOT NULL,
  current_balance numeric(10,2) NOT NULL,
  amount_used numeric(10,2) GENERATED ALWAYS AS (original_amount - current_balance) STORED,
  purchaser_name text,
  purchaser_email text,
  recipient_name text,
  recipient_email text,
  patient_id uuid REFERENCES patients(id),
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  expiration_date date,
  is_active boolean DEFAULT true,
  activation_date date,
  last_used_date date,
  purchase_transaction_id uuid,
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gift cards: clinic access"
  ON aesthetic_gift_cards FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Gift cards: clinic insert"
  ON aesthetic_gift_cards FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Gift cards: clinic update"
  ON aesthetic_gift_cards FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_gift_cards_clinic ON aesthetic_gift_cards(clinic_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON aesthetic_gift_cards(card_code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_patient ON aesthetic_gift_cards(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON aesthetic_gift_cards(is_active, current_balance);

-- Create aesthetic_pos_transactions table
CREATE TABLE IF NOT EXISTS aesthetic_pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id),
  transaction_date timestamptz NOT NULL DEFAULT now(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale', 'refund', 'void')),
  line_items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0,
  tip_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_refund_id text,
  receipt_number text UNIQUE,
  receipt_url text,
  notes text,
  processed_by uuid REFERENCES users(id),
  refund_reason text,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aesthetic_pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POS transactions: clinic access"
  ON aesthetic_pos_transactions FOR SELECT
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "POS transactions: clinic insert"
  ON aesthetic_pos_transactions FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "POS transactions: clinic update"
  ON aesthetic_pos_transactions FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pos_trans_clinic ON aesthetic_pos_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pos_trans_patient ON aesthetic_pos_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_pos_trans_date ON aesthetic_pos_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pos_trans_receipt ON aesthetic_pos_transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_pos_trans_stripe ON aesthetic_pos_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Create aesthetic_treatment_templates table
CREATE TABLE IF NOT EXISTS aesthetic_treatment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  treatment_category text NOT NULL CHECK (treatment_category IN ('botox', 'filler', 'prp', 'laser', 'chemical_peel', 'microneedling', 'threads', 'sclerotherapy', 'other')),
  template_description text,
  field_definitions jsonb NOT NULL,
  default_duration_minutes integer DEFAULT 30,
  requires_consent boolean DEFAULT true,
  requires_photos boolean DEFAULT true,
  post_treatment_instructions text,
  contraindications text[],
  is_active boolean DEFAULT true,
  is_system_template boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clinic_or_org_required CHECK (clinic_id IS NOT NULL OR organization_id IS NOT NULL)
);

ALTER TABLE aesthetic_treatment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment templates: clinic access"
  ON aesthetic_treatment_templates FOR SELECT
  TO authenticated
  USING (
    is_system_template = true OR
    clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM clinics WHERE id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  );

CREATE POLICY "Treatment templates: clinic insert"
  ON aesthetic_treatment_templates FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Treatment templates: clinic update"
  ON aesthetic_treatment_templates FOR UPDATE
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_treatment_templates_clinic ON aesthetic_treatment_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_templates_category ON aesthetic_treatment_templates(treatment_category);
CREATE INDEX IF NOT EXISTS idx_treatment_templates_active ON aesthetic_treatment_templates(is_active);

-- Grant service role access for Edge Functions
GRANT ALL ON aesthetic_treatments TO service_role;
GRANT ALL ON aesthetic_photos TO service_role;
GRANT ALL ON aesthetic_photo_ai_analysis TO service_role;
GRANT ALL ON aesthetic_consent_forms TO service_role;
GRANT ALL ON aesthetic_packages TO service_role;
GRANT ALL ON aesthetic_package_redemptions TO service_role;
GRANT ALL ON aesthetic_inventory TO service_role;
GRANT ALL ON aesthetic_inventory_transactions TO service_role;
GRANT ALL ON aesthetic_memberships TO service_role;
GRANT ALL ON aesthetic_gift_cards TO service_role;
GRANT ALL ON aesthetic_pos_transactions TO service_role;
GRANT ALL ON aesthetic_treatment_templates TO service_role;