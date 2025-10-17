/*
  # Add Admissions Advisor Role

  ## Overview
  Adds the new 'admissions_advisor' role to the system and updates appointment approval permissions.

  ## Changes
  1. Update role check constraints to include 'admissions_advisor'
  2. Update appointment type default approval roles
  3. Update RLS policies for broader manager/admin approval access

  ## Security
  - Maintains existing RLS policies
  - Extends approval capabilities to all manager-level roles
*/

-- =====================================================
-- 1. UPDATE USERS TABLE ROLE CONSTRAINT
-- =====================================================

-- Drop existing constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_role_check'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

-- Add new constraint with admissions_advisor
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('system_admin', 'clinic_admin', 'provider', 'staff', 'admissions_advisor'));

-- =====================================================
-- 2. UPDATE APPOINTMENT TYPES DEFAULT APPROVAL ROLES
-- =====================================================

-- Update existing appointment types to include admissions_advisor in approval roles
UPDATE public.appointment_types
SET approval_roles = ARRAY['system_admin', 'clinic_admin', 'provider', 'admissions_advisor']::text[]
WHERE requires_approval = true;

-- Update default for future records
ALTER TABLE public.appointment_types
ALTER COLUMN approval_roles SET DEFAULT ARRAY['system_admin', 'clinic_admin', 'provider', 'admissions_advisor']::text[];

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR APPROVAL MANAGEMENT
-- =====================================================

-- Drop and recreate the managers approval policy to include admissions_advisor
DROP POLICY IF EXISTS "Managers can update approval requests" ON public.appointment_approval_requests;

CREATE POLICY "Managers can update approval requests"
    ON public.appointment_approval_requests FOR UPDATE
    TO authenticated
    USING (
        clinic_id IN (
            SELECT u.clinic_id
            FROM public.users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role IN ('system_admin', 'clinic_admin', 'provider', 'admissions_advisor')
        )
    )
    WITH CHECK (
        clinic_id IN (
            SELECT u.clinic_id
            FROM public.users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role IN ('system_admin', 'clinic_admin', 'provider', 'admissions_advisor')
        )
    );

-- =====================================================
-- 4. CREATE SAMPLE ADMISSIONS ADVISOR APPOINTMENT TYPE
-- =====================================================

-- Update the Post-Testing Intake appointment type to be accessible to admissions advisors
UPDATE public.appointment_types
SET description = '90-minute intake after testing - For Admissions Advisors',
    approval_roles = ARRAY['system_admin', 'clinic_admin', 'admissions_advisor']::text[]
WHERE name = 'Post-Testing Intake (Admissions)';

-- =====================================================
-- 5. HELPER FUNCTION TO CHECK USER ROLE
-- =====================================================

-- Create or replace function to check if user can approve appointments
CREATE OR REPLACE FUNCTION public.can_approve_appointments(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role text;
BEGIN
    SELECT role INTO v_role
    FROM public.users
    WHERE auth_user_id = p_user_id;

    RETURN v_role IN ('system_admin', 'clinic_admin', 'provider', 'admissions_advisor');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_approve_appointments(uuid) TO authenticated;
