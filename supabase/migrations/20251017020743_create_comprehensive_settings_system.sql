/*
  # Create Comprehensive Settings Management System

  ## Overview
  Creates a robust settings management system with three levels:
  1. System-wide settings (singleton table)
  2. Clinic-specific settings (extends clinics table)
  3. Module/feature toggles

  ## Changes
  
  ### 1. System Settings Table (Singleton)
  - Single row containing system-wide defaults and configurations
  - Default appointment durations, session timeouts, notification settings
  - Email/SMS configuration, business hours, security settings
  
  ### 2. Clinic Settings (JSONB column on clinics table)
  - Clinic-specific overrides and preferences
  - Business hours, holiday calendar, fee schedules
  - Module-specific settings
  
  ### 3. Feature Flags (JSONB column on clinics table)
  - Per-clinic feature enablement
  - Module toggles beyond just aesthetics
  
  ## Security
  - System settings: System Admin only
  - Clinic settings: System Admin and Clinic Admin
  - RLS policies for all operations
  - Audit trail for changes
*/

-- =====================================================
-- 1. CREATE SYSTEM SETTINGS TABLE (SINGLETON)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Appointment Defaults
    default_appointment_duration_minutes integer DEFAULT 60 CHECK (default_appointment_duration_minutes >= 5 AND default_appointment_duration_minutes <= 480),
    appointment_buffer_minutes integer DEFAULT 0 CHECK (appointment_buffer_minutes >= 0 AND appointment_buffer_minutes <= 60),
    max_advance_booking_days integer DEFAULT 90 CHECK (max_advance_booking_days >= 1 AND max_advance_booking_days <= 365),
    allow_double_booking boolean DEFAULT false,
    
    -- Business Hours (Default for new clinics)
    default_business_hours jsonb DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
        "thursday": {"open": "09:00", "close": "17:00", "closed": false},
        "friday": {"open": "09:00", "close": "17:00", "closed": false},
        "saturday": {"open": "09:00", "close": "13:00", "closed": true},
        "sunday": {"open": "09:00", "close": "13:00", "closed": true}
    }'::jsonb,
    
    -- Security Settings
    session_timeout_minutes integer DEFAULT 480 CHECK (session_timeout_minutes >= 15 AND session_timeout_minutes <= 1440),
    password_min_length integer DEFAULT 8 CHECK (password_min_length >= 8 AND password_min_length <= 32),
    password_require_uppercase boolean DEFAULT true,
    password_require_lowercase boolean DEFAULT true,
    password_require_numbers boolean DEFAULT true,
    password_require_special_chars boolean DEFAULT true,
    max_login_attempts integer DEFAULT 5 CHECK (max_login_attempts >= 3 AND max_login_attempts <= 10),
    account_lockout_minutes integer DEFAULT 30 CHECK (account_lockout_minutes >= 5 AND account_lockout_minutes <= 120),
    
    -- Notification Settings
    enable_email_notifications boolean DEFAULT true,
    enable_sms_notifications boolean DEFAULT false,
    notification_email_from text DEFAULT 'noreply@p2pai.com',
    appointment_reminder_hours_before integer DEFAULT 24 CHECK (appointment_reminder_hours_before >= 1 AND appointment_reminder_hours_before <= 168),
    send_appointment_confirmations boolean DEFAULT true,
    
    -- Data Retention
    audit_log_retention_days integer DEFAULT 2555 CHECK (audit_log_retention_days >= 365),
    patient_record_retention_years integer DEFAULT 7 CHECK (patient_record_retention_years >= 7),
    
    -- System Features
    enable_patient_portal boolean DEFAULT true,
    enable_telemedicine boolean DEFAULT false,
    enable_lab_integrations boolean DEFAULT true,
    enable_billing_module boolean DEFAULT true,
    
    -- Lab & Imaging Defaults
    default_lab_result_critical_notification boolean DEFAULT true,
    lab_result_auto_notify_provider boolean DEFAULT true,
    
    -- Metadata
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES public.users(id),
    
    -- Singleton constraint
    CONSTRAINT singleton_system_settings CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Insert default system settings if not exists
INSERT INTO public.system_settings (id)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- System Admin can read system settings
CREATE POLICY "System Admin can read system settings"
    ON public.system_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND r.name = 'System Admin'
        )
    );

-- System Admin can update system settings
CREATE POLICY "System Admin can update system settings"
    ON public.system_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND r.name = 'System Admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND r.name = 'System Admin'
        )
    );

-- Service role full access
CREATE POLICY "Service role full access system settings"
    ON public.system_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 2. ADD CLINIC-SPECIFIC SETTINGS TO CLINICS TABLE
-- =====================================================

-- Add clinic_settings JSONB column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinics' AND column_name = 'clinic_settings'
    ) THEN
        ALTER TABLE public.clinics
        ADD COLUMN clinic_settings jsonb DEFAULT '{
            "business_hours": null,
            "holidays": [],
            "timezone": "America/New_York",
            "fee_schedule": {
                "currency": "USD",
                "tax_rate": 0.0
            },
            "appointment_settings": {
                "require_insurance_verification": false,
                "allow_online_booking": true,
                "auto_confirm_appointments": false
            },
            "notification_preferences": {
                "appointment_reminders": true,
                "reminder_hours_before": 24,
                "send_confirmations": true
            },
            "billing_settings": {
                "default_payment_terms": "due_on_service",
                "accept_credit_cards": true,
                "accept_insurance": true
            }
        }'::jsonb;
    END IF;
END $$;

-- Add feature_flags JSONB column (extending beyond aesthetics_module_enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinics' AND column_name = 'feature_flags'
    ) THEN
        ALTER TABLE public.clinics
        ADD COLUMN feature_flags jsonb DEFAULT '{
            "patient_portal": true,
            "telemedicine": false,
            "lab_integration": true,
            "e_prescribing": false,
            "secure_messaging": true,
            "document_management": true,
            "billing_module": true,
            "functional_medicine": true,
            "aesthetics": false,
            "inventory_management": false
        }'::jsonb;
    END IF;
END $$;

-- Migrate existing aesthetics_module_enabled to feature_flags
UPDATE public.clinics
SET feature_flags = jsonb_set(
    COALESCE(feature_flags, '{}'::jsonb),
    '{aesthetics}',
    to_jsonb(COALESCE(aesthetics_module_enabled, false))
)
WHERE aesthetics_module_enabled IS NOT NULL
AND (feature_flags IS NULL OR NOT feature_flags ? 'aesthetics');

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clinics_feature_flags ON public.clinics USING gin(feature_flags);
CREATE INDEX IF NOT EXISTS idx_clinics_clinic_settings ON public.clinics USING gin(clinic_settings);

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, UPDATE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get effective business hours for a clinic (with fallback to system defaults)
CREATE OR REPLACE FUNCTION public.get_clinic_business_hours(p_clinic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clinic_hours jsonb;
    v_system_hours jsonb;
BEGIN
    -- Get clinic-specific hours
    SELECT clinic_settings->'business_hours' INTO v_clinic_hours
    FROM public.clinics
    WHERE id = p_clinic_id;
    
    -- If clinic has custom hours, return them
    IF v_clinic_hours IS NOT NULL THEN
        RETURN v_clinic_hours;
    END IF;
    
    -- Otherwise, return system default
    SELECT default_business_hours INTO v_system_hours
    FROM public.system_settings
    WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
    
    RETURN v_system_hours;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_clinic_business_hours(uuid) TO authenticated;

-- Function to check if a feature is enabled for a clinic
CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_clinic_id uuid, p_feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_enabled boolean;
BEGIN
    SELECT (feature_flags->>p_feature_name)::boolean INTO v_enabled
    FROM public.clinics
    WHERE id = p_clinic_id;
    
    RETURN COALESCE(v_enabled, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_feature_enabled(uuid, text) TO authenticated;

-- =====================================================
-- 6. CREATE AUDIT TRIGGER FOR SYSTEM SETTINGS
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_system_settings_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
BEGIN
    -- Get user info
    SELECT id, email INTO v_user_id, v_user_email
    FROM public.users
    WHERE auth_user_id = auth.uid();
    
    -- Log the change if audit_logs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        BEGIN
            INSERT INTO public.audit_logs (
                user_id,
                user_email,
                action,
                resource_type,
                resource_id,
                changes,
                ip_address,
                user_agent
            ) VALUES (
                v_user_id,
                v_user_email,
                'UPDATE',
                'system_settings',
                NEW.id::text,
                jsonb_build_object(
                    'old', to_jsonb(OLD),
                    'new', to_jsonb(NEW)
                ),
                inet_client_addr()::text,
                current_setting('request.headers', true)::json->>'user-agent'
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Silent fail for audit logging
                NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'audit_system_settings_changes_trigger'
    ) THEN
        CREATE TRIGGER audit_system_settings_changes_trigger
            AFTER UPDATE ON public.system_settings
            FOR EACH ROW
            EXECUTE FUNCTION public.audit_system_settings_changes();
    END IF;
END $$;
