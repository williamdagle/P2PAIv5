/*
  # Phase 4: HIPAA Compliance - Ongoing Compliance & Risk Management

  Implements comprehensive risk assessment, vulnerability management, and compliance
  monitoring infrastructure required for HIPAA Phase 4 ongoing compliance.

  ## New Tables

  ### 1. risk_assessments
  - Stores formal security risk assessments
  - Tracks identified risks, likelihood, and impact
  - Links to mitigation actions and controls
  - Supports periodic reassessment workflows

  ### 2. vulnerability_scans
  - Records security vulnerability scan results
  - Tracks scan types, findings, and severity
  - Links to remediation actions
  - Supports continuous security monitoring

  ### 3. compliance_monitoring
  - Tracks ongoing compliance status across requirements
  - Records compliance checks and results
  - Supports automated compliance verification
  - Generates compliance reports

  ### 4. risk_mitigation_actions
  - Tracks actions taken to mitigate identified risks
  - Links to risk assessments and vulnerabilities
  - Records implementation status and effectiveness
  - Supports risk acceptance and transfer decisions

  ### 5. security_controls
  - Catalogs implemented security controls
  - Tracks control effectiveness and testing
  - Maps to compliance requirements
  - Supports control maturity assessment

  ### 6. compliance_reports
  - Stores generated compliance reports
  - Tracks report types, periods, and findings
  - Supports regulatory submissions
  - Archives historical compliance status

  ## Security
  - RLS enabled on all tables
  - Admin-only access for risk and compliance data
  - Comprehensive audit trails
  - Optimized indexes for reporting queries

  ## Indexes
  - Optimized for compliance reporting
  - Temporal indexes for trend analysis
  - Risk severity and status indexes
  - Foreign key indexes for relationships
*/

-- =====================================================
-- 1. Risk Assessments
-- =====================================================

CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_name text NOT NULL,
    assessment_type text NOT NULL CHECK (assessment_type IN (
        'annual_security', 'hipaa_security', 'privacy_impact', 'vendor_risk',
        'threat_assessment', 'data_protection', 'physical_security', 'business_continuity',
        'third_party', 'other'
    )),
    assessment_date timestamptz NOT NULL DEFAULT now(),
    assessor_id uuid,
    assessor_name text NOT NULL,
    assessment_scope text NOT NULL,
    methodology text,
    risk_identifier text NOT NULL,
    risk_description text NOT NULL,
    risk_category text NOT NULL CHECK (risk_category IN (
        'technical', 'administrative', 'physical', 'operational',
        'legal', 'compliance', 'financial', 'reputational'
    )),
    asset_affected text,
    threat_source text,
    vulnerability_description text,
    likelihood text NOT NULL CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    impact text NOT NULL CHECK (impact IN ('negligible', 'low', 'medium', 'high', 'critical')),
    risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    current_controls jsonb DEFAULT '[]'::jsonb,
    control_effectiveness text CHECK (control_effectiveness IN ('ineffective', 'partially_effective', 'effective', 'highly_effective')),
    residual_risk text CHECK (residual_risk IN ('low', 'medium', 'high', 'critical')),
    risk_treatment text NOT NULL CHECK (risk_treatment IN ('mitigate', 'accept', 'transfer', 'avoid')),
    recommended_actions jsonb DEFAULT '[]'::jsonb,
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status text NOT NULL CHECK (status IN ('identified', 'assessed', 'in_mitigation', 'mitigated', 'accepted', 'closed')) DEFAULT 'identified',
    target_completion_date timestamptz,
    actual_completion_date timestamptz,
    next_review_date timestamptz,
    notes text,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_risk_assessments_type ON public.risk_assessments(assessment_type);
CREATE INDEX idx_risk_assessments_level ON public.risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_status ON public.risk_assessments(status);
CREATE INDEX idx_risk_assessments_priority ON public.risk_assessments(priority);
CREATE INDEX idx_risk_assessments_date ON public.risk_assessments USING BRIN (assessment_date);
CREATE INDEX idx_risk_assessments_review ON public.risk_assessments(next_review_date) WHERE status != 'closed';

-- =====================================================
-- 2. Vulnerability Scans
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vulnerability_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_name text NOT NULL,
    scan_type text NOT NULL CHECK (scan_type IN (
        'network_scan', 'web_application', 'database', 'api_security',
        'penetration_test', 'configuration_audit', 'code_analysis', 'compliance_scan'
    )),
    scan_date timestamptz NOT NULL DEFAULT now(),
    scanner_tool text,
    scan_scope text NOT NULL,
    target_systems jsonb DEFAULT '[]'::jsonb,
    vulnerability_id text,
    vulnerability_name text NOT NULL,
    vulnerability_description text NOT NULL,
    cve_id text,
    cvss_score numeric(3,1),
    severity text NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    affected_asset text NOT NULL,
    affected_component text,
    exploit_available boolean DEFAULT false,
    exploitability text CHECK (exploitability IN ('unproven', 'proof_of_concept', 'functional', 'high')),
    false_positive boolean DEFAULT false,
    remediation_recommendation text,
    remediation_complexity text CHECK (remediation_complexity IN ('low', 'medium', 'high')),
    remediation_priority text CHECK (remediation_priority IN ('low', 'medium', 'high', 'critical')),
    status text NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted', 'false_positive')) DEFAULT 'open',
    assigned_to uuid,
    resolution_date timestamptz,
    resolution_notes text,
    verification_date timestamptz,
    verified_by uuid,
    next_scan_date timestamptz,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vuln_scans_type ON public.vulnerability_scans(scan_type);
CREATE INDEX idx_vuln_scans_severity ON public.vulnerability_scans(severity);
CREATE INDEX idx_vuln_scans_status ON public.vulnerability_scans(status);
CREATE INDEX idx_vuln_scans_date ON public.vulnerability_scans USING BRIN (scan_date);
CREATE INDEX idx_vuln_scans_cvss ON public.vulnerability_scans(cvss_score) WHERE cvss_score IS NOT NULL;
CREATE INDEX idx_vuln_scans_open ON public.vulnerability_scans(severity, status) WHERE status = 'open';

-- =====================================================
-- 3. Compliance Monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS public.compliance_monitoring (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    compliance_framework text NOT NULL CHECK (compliance_framework IN (
        'hipaa_security', 'hipaa_privacy', 'hitech', 'nist_csf', 'iso_27001',
        'soc2', 'pci_dss', 'gdpr', 'state_privacy', 'other'
    )),
    requirement_id text NOT NULL,
    requirement_name text NOT NULL,
    requirement_description text NOT NULL,
    control_category text NOT NULL CHECK (control_category IN (
        'access_control', 'audit_controls', 'integrity', 'transmission_security',
        'administrative', 'physical', 'technical', 'organizational'
    )),
    check_type text NOT NULL CHECK (check_type IN (
        'manual_review', 'automated_scan', 'documentation_review', 'interview',
        'testing', 'observation', 'system_check'
    )),
    check_date timestamptz NOT NULL DEFAULT now(),
    checked_by uuid,
    compliance_status text NOT NULL CHECK (compliance_status IN (
        'compliant', 'partially_compliant', 'non_compliant', 'not_applicable', 'in_progress'
    )),
    evidence_collected jsonb DEFAULT '[]'::jsonb,
    findings text,
    gaps_identified text,
    remediation_required boolean DEFAULT false,
    remediation_actions jsonb DEFAULT '[]'::jsonb,
    remediation_deadline timestamptz,
    risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    next_check_date timestamptz,
    check_frequency text CHECK (check_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    notes text,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_compliance_framework ON public.compliance_monitoring(compliance_framework);
CREATE INDEX idx_compliance_status ON public.compliance_monitoring(compliance_status);
CREATE INDEX idx_compliance_risk ON public.compliance_monitoring(risk_level);
CREATE INDEX idx_compliance_check_date ON public.compliance_monitoring USING BRIN (check_date);
CREATE INDEX idx_compliance_next_check ON public.compliance_monitoring(next_check_date) WHERE compliance_status != 'not_applicable';
CREATE INDEX idx_compliance_non_compliant ON public.compliance_monitoring(compliance_status, risk_level) WHERE compliance_status IN ('non_compliant', 'partially_compliant');

-- =====================================================
-- 4. Risk Mitigation Actions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.risk_mitigation_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id uuid REFERENCES public.risk_assessments(id),
    vulnerability_scan_id uuid REFERENCES public.vulnerability_scans(id),
    action_name text NOT NULL,
    action_description text NOT NULL,
    action_type text NOT NULL CHECK (action_type IN (
        'technical_control', 'administrative_control', 'physical_control',
        'policy_update', 'process_change', 'training', 'technology_upgrade', 'other'
    )),
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to uuid,
    assigned_team text,
    planned_start_date timestamptz,
    planned_completion_date timestamptz,
    actual_start_date timestamptz,
    actual_completion_date timestamptz,
    estimated_cost numeric(12,2),
    actual_cost numeric(12,2),
    implementation_steps jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL CHECK (status IN ('planned', 'in_progress', 'blocked', 'completed', 'cancelled', 'deferred')) DEFAULT 'planned',
    completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    blocking_issues text,
    effectiveness_rating text CHECK (effectiveness_rating IN ('ineffective', 'partially_effective', 'effective', 'highly_effective')),
    verification_date timestamptz,
    verified_by uuid,
    verification_notes text,
    notes text,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mitigation_risk_id ON public.risk_mitigation_actions(risk_assessment_id);
CREATE INDEX idx_mitigation_vuln_id ON public.risk_mitigation_actions(vulnerability_scan_id);
CREATE INDEX idx_mitigation_status ON public.risk_mitigation_actions(status);
CREATE INDEX idx_mitigation_priority ON public.risk_mitigation_actions(priority);
CREATE INDEX idx_mitigation_assigned ON public.risk_mitigation_actions(assigned_to);
CREATE INDEX idx_mitigation_completion ON public.risk_mitigation_actions(planned_completion_date) WHERE status IN ('planned', 'in_progress');

-- =====================================================
-- 5. Security Controls
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_controls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    control_id text NOT NULL UNIQUE,
    control_name text NOT NULL,
    control_description text NOT NULL,
    control_type text NOT NULL CHECK (control_type IN (
        'preventive', 'detective', 'corrective', 'deterrent', 'compensating'
    )),
    control_category text NOT NULL CHECK (control_category IN (
        'access_control', 'audit_logging', 'authentication', 'authorization',
        'encryption', 'network_security', 'endpoint_security', 'data_protection',
        'incident_response', 'backup_recovery', 'physical_security', 'administrative'
    )),
    implementation_status text NOT NULL CHECK (implementation_status IN (
        'not_implemented', 'planned', 'partially_implemented', 'implemented', 'deprecated'
    )) DEFAULT 'planned',
    implementation_date timestamptz,
    owner_id uuid,
    owner_name text,
    automation_level text CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated')),
    testing_frequency text CHECK (testing_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    last_test_date timestamptz,
    last_test_result text CHECK (last_test_result IN ('passed', 'failed', 'partial', 'not_tested')),
    next_test_date timestamptz,
    effectiveness text CHECK (effectiveness IN ('ineffective', 'partially_effective', 'effective', 'highly_effective')),
    maturity_level text CHECK (maturity_level IN ('initial', 'developing', 'defined', 'managed', 'optimized')),
    compliance_mappings jsonb DEFAULT '[]'::jsonb,
    related_risks jsonb DEFAULT '[]'::jsonb,
    documentation_url text,
    notes text,
    is_active boolean DEFAULT true,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_controls_type ON public.security_controls(control_type);
CREATE INDEX idx_controls_category ON public.security_controls(control_category);
CREATE INDEX idx_controls_status ON public.security_controls(implementation_status);
CREATE INDEX idx_controls_effectiveness ON public.security_controls(effectiveness);
CREATE INDEX idx_controls_test_date ON public.security_controls(next_test_date) WHERE is_active = true;
CREATE INDEX idx_controls_active ON public.security_controls(is_active) WHERE is_active = true;

-- =====================================================
-- 6. Compliance Reports
-- =====================================================

CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name text NOT NULL,
    report_type text NOT NULL CHECK (report_type IN (
        'hipaa_security_assessment', 'hipaa_privacy_assessment', 'annual_risk_assessment',
        'vulnerability_summary', 'compliance_status', 'audit_findings',
        'breach_report', 'training_summary', 'access_review', 'incident_summary'
    )),
    reporting_period_start timestamptz NOT NULL,
    reporting_period_end timestamptz NOT NULL,
    report_date timestamptz NOT NULL DEFAULT now(),
    generated_by uuid,
    report_status text NOT NULL CHECK (report_status IN ('draft', 'in_review', 'approved', 'submitted', 'archived')) DEFAULT 'draft',
    compliance_framework text,
    overall_compliance_score numeric(5,2),
    compliant_controls integer DEFAULT 0,
    non_compliant_controls integer DEFAULT 0,
    partially_compliant_controls integer DEFAULT 0,
    high_risk_findings integer DEFAULT 0,
    medium_risk_findings integer DEFAULT 0,
    low_risk_findings integer DEFAULT 0,
    open_vulnerabilities integer DEFAULT 0,
    resolved_vulnerabilities integer DEFAULT 0,
    executive_summary text,
    key_findings jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    action_items jsonb DEFAULT '[]'::jsonb,
    report_data jsonb DEFAULT '{}'::jsonb,
    report_file_url text,
    submitted_to text,
    submission_date timestamptz,
    approved_by uuid,
    approval_date timestamptz,
    notes text,
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reports_type ON public.compliance_reports(report_type);
CREATE INDEX idx_reports_status ON public.compliance_reports(report_status);
CREATE INDEX idx_reports_date ON public.compliance_reports USING BRIN (report_date);
CREATE INDEX idx_reports_period ON public.compliance_reports(reporting_period_start, reporting_period_end);
CREATE INDEX idx_reports_framework ON public.compliance_reports(compliance_framework);

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerability_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_mitigation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Risk Assessments
-- =====================================================

CREATE POLICY "risk_assessments_select_admin"
    ON public.risk_assessments FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "risk_assessments_insert_admin"
    ON public.risk_assessments FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "risk_assessments_update_admin"
    ON public.risk_assessments FOR UPDATE TO authenticated
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
-- RLS Policies - Vulnerability Scans
-- =====================================================

CREATE POLICY "vulnerability_scans_select_admin"
    ON public.vulnerability_scans FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "vulnerability_scans_insert_admin"
    ON public.vulnerability_scans FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "vulnerability_scans_update_admin"
    ON public.vulnerability_scans FOR UPDATE TO authenticated
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
-- RLS Policies - Compliance Monitoring
-- =====================================================

CREATE POLICY "compliance_monitoring_select_admin"
    ON public.compliance_monitoring FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "compliance_monitoring_insert_admin"
    ON public.compliance_monitoring FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "compliance_monitoring_update_admin"
    ON public.compliance_monitoring FOR UPDATE TO authenticated
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
-- RLS Policies - Risk Mitigation Actions
-- =====================================================

CREATE POLICY "mitigation_actions_select_admin"
    ON public.risk_mitigation_actions FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "mitigation_actions_insert_admin"
    ON public.risk_mitigation_actions FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "mitigation_actions_update_admin"
    ON public.risk_mitigation_actions FOR UPDATE TO authenticated
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
-- RLS Policies - Security Controls
-- =====================================================

CREATE POLICY "security_controls_select_authenticated"
    ON public.security_controls FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "security_controls_insert_admin"
    ON public.security_controls FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "security_controls_update_admin"
    ON public.security_controls FOR UPDATE TO authenticated
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
-- RLS Policies - Compliance Reports
-- =====================================================

CREATE POLICY "compliance_reports_select_admin"
    ON public.compliance_reports FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "compliance_reports_insert_admin"
    ON public.compliance_reports FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.roles ON users.role_id = roles.id
            WHERE users.id = auth.uid()
            AND roles.name IN ('system_admin', 'admin')
        )
    );

CREATE POLICY "compliance_reports_update_admin"
    ON public.compliance_reports FOR UPDATE TO authenticated
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
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.risk_assessments IS 'Formal security risk assessments for HIPAA compliance';
COMMENT ON TABLE public.vulnerability_scans IS 'Security vulnerability scanning results and remediation tracking';
COMMENT ON TABLE public.compliance_monitoring IS 'Ongoing compliance status monitoring and verification';
COMMENT ON TABLE public.risk_mitigation_actions IS 'Risk mitigation and remediation action tracking';
COMMENT ON TABLE public.security_controls IS 'Security control catalog and effectiveness monitoring';
COMMENT ON TABLE public.compliance_reports IS 'Compliance reports for regulatory submissions and audits';
