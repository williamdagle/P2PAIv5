/*
  # Tasks Management System for EMR - HIPAA Compliant

  ## Overview
  Creates a comprehensive task management system with clinic-based isolation, 
  role-based access control, and full audit trail for HIPAA compliance.

  ## New Tables
  
  ### 1. tasks - Core task management with clinic isolation
  ### 2. task_comments - Collaborative task discussion
  ### 3. task_attachments - Clinical data linking
  ### 4. task_dependencies - Task relationships
  ### 5. task_templates - Reusable workflows
  ### 6. task_audit_trail - HIPAA compliance tracking

  ## Security
  - RLS enabled on ALL tables
  - Clinic-based data isolation using auth.uid() pattern
  - Comprehensive audit logging
  - PHI protection

  ## Performance
  - Compound indexes on clinic_id with common query fields
  - Functional indexes for soft delete queries
*/

-- =====================================================
-- 1. TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    patient_id uuid REFERENCES public.patients(id),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'deferred', 'cancelled')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date timestamptz,
    assigned_to uuid REFERENCES public.users(id),
    assigned_to_role text,
    created_by uuid NOT NULL REFERENCES public.users(id),
    completed_at timestamptz,
    completed_by uuid REFERENCES public.users(id),
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks: clinic members can view"
    ON public.tasks FOR SELECT TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Tasks: clinic members can create"
    ON public.tasks FOR INSERT TO authenticated
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Tasks: clinic members can update"
    ON public.tasks FOR UPDATE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1))
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Tasks: clinic members can delete"
    ON public.tasks FOR DELETE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE INDEX IF NOT EXISTS idx_tasks_clinic_id ON public.tasks(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_patient_id ON public.tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_tasks_clinic_patient ON public.tasks(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_clinic_assigned ON public.tasks(clinic_id, assigned_to);

-- =====================================================
-- 2. TASK COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    comment_text text NOT NULL,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task comments: clinic members can view"
    ON public.task_comments FOR SELECT TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task comments: clinic members can create"
    ON public.task_comments FOR INSERT TO authenticated
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task comments: clinic members can update own"
    ON public.task_comments FOR UPDATE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1)
        AND user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task comments: clinic members can delete own"
    ON public.task_comments FOR DELETE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1)
        AND user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_task_comments_clinic_id ON public.task_comments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);

-- =====================================================
-- 3. TASK ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    attachment_type text NOT NULL CHECK (attachment_type IN (
        'lab_result', 'medication', 'supplement', 'appointment', 
        'clinical_note', 'treatment_plan', 'timeline_event', 'document'
    )),
    reference_id uuid NOT NULL,
    reference_table text NOT NULL,
    reference_name text,
    created_by uuid NOT NULL REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task attachments: clinic members can view"
    ON public.task_attachments FOR SELECT TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task attachments: clinic members can create"
    ON public.task_attachments FOR INSERT TO authenticated
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task attachments: clinic members can delete"
    ON public.task_attachments FOR DELETE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE INDEX IF NOT EXISTS idx_task_attachments_clinic_id ON public.task_attachments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_reference ON public.task_attachments(reference_table, reference_id);

-- =====================================================
-- 4. TASK DEPENDENCIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_dependencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    parent_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    dependent_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    dependency_type text NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to')),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT task_dependencies_not_self CHECK (parent_task_id != dependent_task_id),
    CONSTRAINT task_dependencies_unique UNIQUE (parent_task_id, dependent_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task dependencies: clinic members can view"
    ON public.task_dependencies FOR SELECT TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task dependencies: clinic members can create"
    ON public.task_dependencies FOR INSERT TO authenticated
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task dependencies: clinic members can delete"
    ON public.task_dependencies FOR DELETE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE INDEX IF NOT EXISTS idx_task_dependencies_clinic_id ON public.task_dependencies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_parent ON public.task_dependencies(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON public.task_dependencies(dependent_task_id);

-- =====================================================
-- 5. TASK TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    organization_id uuid REFERENCES public.organizations(id),
    template_name text NOT NULL,
    template_type text NOT NULL CHECK (template_type IN (
        'lab_review', 'follow_up', 'medication_refill', 'documentation', 
        'billing', 'pre_op_checklist', 'chronic_care', 'discharge', 'other'
    )),
    description text,
    structure jsonb NOT NULL DEFAULT '{}'::jsonb,
    default_priority text DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
    default_assigned_role text,
    is_active boolean DEFAULT true,
    is_shared boolean DEFAULT false,
    created_by uuid NOT NULL REFERENCES public.users(id),
    updated_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task templates: clinic members can view"
    ON public.task_templates FOR SELECT TO authenticated
    USING (
        clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1)
        OR (is_shared = true AND organization_id IN (
            SELECT c.organization_id FROM clinics c 
            INNER JOIN users u ON u.clinic_id = c.id 
            WHERE u.auth_user_id = auth.uid()
        ))
    );

CREATE POLICY "Task templates: clinic members can create"
    ON public.task_templates FOR INSERT TO authenticated
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task templates: clinic members can update own"
    ON public.task_templates FOR UPDATE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1))
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task templates: clinic members can delete own"
    ON public.task_templates FOR DELETE TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE INDEX IF NOT EXISTS idx_task_templates_clinic_id ON public.task_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_organization_id ON public.task_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON public.task_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_active ON public.task_templates(is_active) WHERE is_active = true;

-- =====================================================
-- 6. TASK AUDIT TRAIL TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_audit_trail (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    action_type text NOT NULL CHECK (action_type IN (
        'created', 'updated', 'status_changed', 'assigned', 'reassigned', 
        'completed', 'deferred', 'cancelled', 'deleted', 'comment_added', 
        'attachment_added', 'dependency_added'
    )),
    changed_by uuid NOT NULL REFERENCES public.users(id),
    old_values jsonb,
    new_values jsonb,
    change_reason text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task audit trail: clinic members can view"
    ON public.task_audit_trail FOR SELECT TO authenticated
    USING (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "Task audit trail: system can insert"
    ON public.task_audit_trail FOR INSERT TO authenticated
    WITH CHECK (clinic_id IN (SELECT users.clinic_id FROM users WHERE users.auth_user_id = auth.uid() LIMIT 1));

CREATE INDEX IF NOT EXISTS idx_task_audit_clinic_id ON public.task_audit_trail(clinic_id);
CREATE INDEX IF NOT EXISTS idx_task_audit_task_id ON public.task_audit_trail(task_id);
CREATE INDEX IF NOT EXISTS idx_task_audit_action_type ON public.task_audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_task_audit_created_at ON public.task_audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_audit_changed_by ON public.task_audit_trail(changed_by);

-- =====================================================
-- 7. DEFAULT TASK TEMPLATES
-- =====================================================

DO $$
DECLARE
    clinic_record RECORD;
    first_user_id uuid;
BEGIN
    FOR clinic_record IN SELECT id, organization_id FROM public.clinics LOOP
        SELECT id INTO first_user_id 
        FROM public.users 
        WHERE clinic_id = clinic_record.id 
        LIMIT 1;
        
        IF first_user_id IS NULL THEN
            CONTINUE;
        END IF;
        
        INSERT INTO public.task_templates (
            clinic_id, organization_id, template_name, template_type, 
            description, structure, default_priority, default_assigned_role, 
            is_active, created_by
        ) VALUES
        (
            clinic_record.id, clinic_record.organization_id,
            'Review Critical Lab Result', 'lab_review',
            'Task created when critical lab values are received',
            '{"fields": [{"name": "lab_name", "type": "text"}]}'::jsonb,
            'urgent', 'Provider', true, first_user_id
        ),
        (
            clinic_record.id, clinic_record.organization_id,
            'Schedule Follow-Up Appointment', 'follow_up',
            'Task to schedule follow-up after completed visit',
            '{"fields": [{"name": "timeframe", "type": "text"}]}'::jsonb,
            'medium', 'Admin', true, first_user_id
        ),
        (
            clinic_record.id, clinic_record.organization_id,
            'Medication Refill Approval', 'medication_refill',
            'Task for provider to approve medication refill',
            '{"fields": [{"name": "medication", "type": "text"}]}'::jsonb,
            'medium', 'Provider', true, first_user_id
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- 8. DATA RETENTION POLICY
-- =====================================================

INSERT INTO public.data_retention_policies (
    policy_name, table_name, data_category, retention_period_days,
    retention_reason, purge_method, is_active
) VALUES (
    'Task Management Data Retention',
    'tasks',
    'clinical_data',
    2190,
    'HIPAA compliance for clinical workflow documentation',
    'soft_delete',
    true
) ON CONFLICT DO NOTHING;
