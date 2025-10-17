/*
  # Phase 3: HIPAA Compliance - Policies & Procedures Infrastructure

  Implements comprehensive policy management and compliance tracking infrastructure
  required for HIPAA Phase 3 compliance.

  ## New Tables

  ### 1. incident_response_plans
  - Stores incident response procedures and plans
  - Tracks incident types, severity levels, and response workflows
  - Links to responsible teams and escalation procedures

  ### 2. data_retention_policies
  - Defines retention periods for different data types
  - Enables automated data lifecycle management
  - Tracks policy versions and effective dates

  ### 3. user_access_reviews
  - Records periodic access reviews for compliance
  - Tracks reviewers, findings, and remediation actions
  - Links to users and their access levels

  ### 4. breach_notifications
  - Manages data breach incident tracking
  - Records affected parties, notification timelines
  - Tracks regulatory reporting requirements

  ### 5. data_classification
  - Categorizes data by sensitivity level (PHI, PII, etc.)
  - Maps to tables/columns for access control
  - Defines handling requirements per classification

  ### 6. user_training_records
  - Tracks HIPAA training completion
  - Records training types, dates, and certifications
  - Links to compliance requirements

  ### 7. policy_acknowledgments
  - Records user acceptance of policies
  - Tracks policy versions and acknowledgment dates
  - Enables policy distribution tracking

  ## Security
  - RLS enabled on all tables
  - Restrictive policies requiring authentication
  - Admin-only write access for policy tables
  - Users can view their own training/acknowledgments

  ## Indexes
  - Optimized for compliance reporting queries
  - Temporal indexes for date-based searches
  - Foreign key indexes for relationship queries
*/

-- =====================================================
-- 1. Incident Response Plans
-- =====================================================

CREATE TABLE IF NOT EXISTS public.incident_response_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name text NOT NULL,
    incident_type text NOT NULL CHECK (incident_type IN (
        'data_breach', 'unauthorized_access', 'ransomware', 'phishing',
        'system_outage', 'data_loss', 'insider_threat', 'physical_security',
        'third_party_breach', 'other'
    )),
    severity_level text NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    description text NOT NULL,
    response_procedures jsonb NOT NULL DEFAULT '[]'::jsonb,
    notification_requirements jsonb DEFAULT '{}'::jsonb,
    escalation_contacts jsonb DEFAULT '[]'::jsonb,
    responsible_team text,
    notification_timeline_hours integer,
    regulatory_reporting_required boolean DEFAULT false,
    is_active boolean DEFAULT true,
    version integer DEFAULT 1,
    effective_date timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_incident_plans_type ON public.incident_response_plans(incident_type);
CREATE INDEX idx_incident_plans_severity ON public.incident_response_plans(severity_level);
CREATE INDEX idx_incident_plans_active ON public.incident_response_plans(is_active) WHERE is_active = true;

-- =====================================================
-- 2. Data Retention Policies
-- =====================================================

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name text NOT NULL,
    table_name text NOT NULL,
    data_category text NOT NULL CHECK (data_category IN (
        'phi', 'clinical_data', 'financial_data', 'user_data',
        'audit_logs', 'system_logs', 'communications', 'other'
    )),
    retention_period_days integer NOT NULL CHECK (retention_period_days > 0),
    retention_reason text NOT NULL,
    auto_purge_enabled boolean DEFAULT false,
    purge_method text CHECK (purge_method IN ('soft_delete', 'hard_delete', 'archive', 'anonymize')),
    legal_hold_override boolean DEFAULT false,
    compliance_requirement text,
    last_purge_date timestamptz,
    next_purge_date timestamptz,
    is_active boolean DEFAULT true,
    version integer DEFAULT 1,
    effective_date timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(table_name, data_category)
);

CREATE INDEX idx_retention_table ON public.data_retention_policies(table_name);
CREATE INDEX idx_retention_category ON public.data_retention_policies(data_category);
CREATE INDEX idx_retention_next_purge ON public.data_retention_policies(next_purge_date) WHERE auto_purge_enabled = true;
CREATE INDEX idx_retention_active ON public.data_retention_policies(is_active) WHERE is_active = true;

-- =====================================================
-- 3. User Access Reviews
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_access_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_period_start timestamptz NOT NULL,
    review_period_end timestamptz NOT NULL,
    user_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    review_date timestamptz DEFAULT now(),
    access_level_reviewed text NOT NULL,
    user_role_id uuid,
    user_clinic_id uuid,
    access_justified boolean NOT NULL,
    justification_notes text,
    findings text,
    recommendations text,
    actions_taken jsonb DEFAULT '[]'::jsonb,
    access_modified boolean DEFAULT false,
    access_revoked boolean DEFAULT false,
    next_review_date timestamptz,
    review_status text NOT NULL CHECK (review_status IN ('pending', 'in_progress', 'completed', 'requires_action')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_access_reviews_user ON public.user_access_reviews(user_id);
CREATE INDEX idx_access_reviews_reviewer ON public.user_access_reviews(reviewer_id);
CREATE INDEX idx_access_reviews_status ON public.user_access_reviews(review_status);
CREATE INDEX idx_access_reviews_next_date ON public.user_access_reviews(next_review_date) WHERE review_status = 'completed';
CREATE INDEX idx_access_reviews_period ON public.user_access_reviews USING BRIN (review_period_start, review_period_end);

-- =====================================================
-- 4. Breach Notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.breach_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id uuid,
    breach_type text NOT NULL CHECK (breach_type IN (
        'unauthorized_access', 'data_theft', 'data_loss', 'improper_disposal',
        'hacking', 'ransomware', 'insider_threat', 'third_party', 'other'
    )),
    discovery_date timestamptz NOT NULL,
    breach_date timestamptz,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_records_count integer DEFAULT 0,
    phi_compromised boolean NOT NULL,
    phi_types_affected jsonb DEFAULT '[]'::jsonb,
    affected_patients jsonb DEFAULT '[]'::jsonb,
    notification_status text NOT NULL CHECK (notification_status IN (
        'pending', 'patients_notified', 'hhs_notified', 'media_notified', 'completed'
    )) DEFAULT 'pending',
    patient_notification_date timestamptz,
    hhs_notification_date timestamptz,
    media_notification_date timestamptz,
    law_enforcement_notified boolean DEFAULT false,
    law_enforcement_notification_date timestamptz,
    breach_description text NOT NULL,
    root_cause_analysis text,
    remediation_actions jsonb DEFAULT '[]'::jsonb,
    preventive_measures jsonb DEFAULT '[]'::jsonb,
    responsible_party text,
    investigation_status text CHECK (investigation_status IN ('open', 'investigating', 'resolved', 'closed')),
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_breach_discovery ON public.breach_notifications(discovery_date);
CREATE INDEX idx_breach_severity ON public.breach_notifications(severity);
CREATE INDEX idx_breach_status ON public.breach_notifications(notification_status);
CREATE INDEX idx_breach_phi ON public.breach_notifications(phi_compromised) WHERE phi_compromised = true;
CREATE INDEX idx_breach_investigation ON public.breach_notifications(investigation_status);

-- =====================================================
-- 5. Data Classification
-- =====================================================

CREATE TABLE IF NOT EXISTS public.data_classification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_name text NOT NULL UNIQUE,
    classification_level text NOT NULL CHECK (classification_level IN (
        'public', 'internal', 'confidential', 'phi', 'highly_sensitive'
    )),
    table_name text NOT NULL,
    column_name text,
    description text NOT NULL,
    data_type text,
    contains_phi boolean DEFAULT false,
    contains_pii boolean DEFAULT false,
    encryption_required boolean DEFAULT false,
    access_restrictions text,
    handling_requirements jsonb DEFAULT '{}'::jsonb,
    regulatory_requirements jsonb DEFAULT '[]'::jsonb,
    retention_requirement_days integer,
    is_active boolean DEFAULT true,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_classification_table ON public.data_classification(table_name);
CREATE INDEX idx_classification_level ON public.data_classification(classification_level);
CREATE INDEX idx_classification_phi ON public.data_classification(contains_phi) WHERE contains_phi = true;
CREATE INDEX idx_classification_pii ON public.data_classification(contains_pii) WHERE contains_pii = true;
CREATE INDEX idx_classification_active ON public.data_classification(is_active) WHERE is_active = true;

-- =====================================================
-- 6. User Training Records
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_training_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    training_type text NOT NULL CHECK (training_type IN (
        'hipaa_initial', 'hipaa_annual', 'security_awareness', 'privacy_practices',
        'incident_response', 'data_handling', 'breach_notification', 'role_specific', 'other'
    )),
    training_name text NOT NULL,
    training_provider text,
    training_date timestamptz NOT NULL,
    completion_date timestamptz,
    expiration_date timestamptz,
    status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'expired', 'overdue')) DEFAULT 'scheduled',
    score numeric(5,2),
    passing_score numeric(5,2),
    certificate_url text,
    attestation_signed boolean DEFAULT false,
    attestation_date timestamptz,
    training_hours numeric(5,2),
    compliance_requirement text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_training_user ON public.user_training_records(user_id);
CREATE INDEX idx_training_type ON public.user_training_records(training_type);
CREATE INDEX idx_training_status ON public.user_training_records(status);
CREATE INDEX idx_training_expiration ON public.user_training_records(expiration_date) WHERE status = 'completed';
CREATE INDEX idx_training_completion ON public.user_training_records(completion_date);

-- =====================================================
-- 7. Policy Acknowledgments
-- =====================================================

CREATE TABLE IF NOT EXISTS public.policy_acknowledgments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    policy_type text NOT NULL CHECK (policy_type IN (
        'privacy_policy', 'security_policy', 'acceptable_use', 'data_handling',
        'incident_response', 'password_policy', 'remote_access', 'mobile_device',
        'social_media', 'code_of_conduct', 'other'
    )),
    policy_name text NOT NULL,
    policy_version text NOT NULL,
    policy_content text,
    policy_url text,
    acknowledgment_required boolean DEFAULT true,
    acknowledgment_date timestamptz,
    acknowledged boolean DEFAULT false,
    ip_address inet,
    user_agent text,
    signature_data text,
    expiration_date timestamptz,
    re_acknowledgment_required boolean DEFAULT false,
    status text NOT NULL CHECK (status IN ('pending', 'acknowledged', 'expired', 'superseded')) DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_policy_ack_user ON public.policy_acknowledgments(user_id);
CREATE INDEX idx_policy_ack_type ON public.policy_acknowledgments(policy_type);
CREATE INDEX idx_policy_ack_status ON public.policy_acknowledgments(status);
CREATE INDEX idx_policy_ack_pending ON public.policy_acknowledgments(user_id, status) WHERE status = 'pending';
CREATE INDEX idx_policy_ack_expiration ON public.policy_acknowledgments(expiration_date) WHERE status = 'acknowledged';

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE public.incident_response_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breach_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_acknowledgments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Incident Response Plans
-- =====================================================

CREATE POLICY "incident_plans_select_authenticated"
    ON public.incident_response_plans FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "incident_plans_insert_admin"
    ON public.incident_response_plans FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "incident_plans_update_admin"
    ON public.incident_response_plans FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- RLS Policies - Data Retention Policies
-- =====================================================

CREATE POLICY "retention_select_authenticated"
    ON public.data_retention_policies FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "retention_insert_admin"
    ON public.data_retention_policies FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "retention_update_admin"
    ON public.data_retention_policies FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- RLS Policies - User Access Reviews
-- =====================================================

CREATE POLICY "access_reviews_select_involved"
    ON public.user_access_reviews FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR reviewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "access_reviews_insert_admin"
    ON public.user_access_reviews FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "access_reviews_update_reviewer"
    ON public.user_access_reviews FOR UPDATE TO authenticated
    USING (
        reviewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        reviewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- RLS Policies - Breach Notifications
-- =====================================================

CREATE POLICY "breach_select_admin"
    ON public.breach_notifications FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "breach_insert_admin"
    ON public.breach_notifications FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "breach_update_admin"
    ON public.breach_notifications FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- RLS Policies - Data Classification
-- =====================================================

CREATE POLICY "classification_select_authenticated"
    ON public.data_classification FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "classification_insert_admin"
    ON public.data_classification FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "classification_update_admin"
    ON public.data_classification FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- RLS Policies - User Training Records
-- =====================================================

CREATE POLICY "training_select_own_or_admin"
    ON public.user_training_records FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "training_insert_admin"
    ON public.user_training_records FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "training_update_own_or_admin"
    ON public.user_training_records FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- RLS Policies - Policy Acknowledgments
-- =====================================================

CREATE POLICY "policy_ack_select_own_or_admin"
    ON public.policy_acknowledgments FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "policy_ack_insert_admin"
    ON public.policy_acknowledgments FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "policy_ack_update_own_or_admin"
    ON public.policy_acknowledgments FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.incident_response_plans IS 'Incident response procedures and plans for HIPAA compliance';
COMMENT ON TABLE public.data_retention_policies IS 'Data retention policies and automated lifecycle management';
COMMENT ON TABLE public.user_access_reviews IS 'Periodic user access reviews for compliance auditing';
COMMENT ON TABLE public.breach_notifications IS 'Data breach tracking and notification management';
COMMENT ON TABLE public.data_classification IS 'Data sensitivity classification and handling requirements';
COMMENT ON TABLE public.user_training_records IS 'HIPAA and security training compliance tracking';
COMMENT ON TABLE public.policy_acknowledgments IS 'User policy acknowledgment and acceptance tracking';
