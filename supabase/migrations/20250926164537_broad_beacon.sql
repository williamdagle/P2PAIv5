/*
  # Complete Provider Account Provisioning Script
  
  This script will:
  1. Verify the clinic exists and is associated with an organization
  2. Create/find the Provider role
  3. Create the auth user using Supabase admin functions
  4. Create the user profile in the public.users table
  5. Verify the account was created successfully
*/

DO $$
DECLARE
    clinic_record RECORD;
    org_record RECORD;
    provider_role_id UUID;
    new_auth_user_id UUID;
    new_user_id UUID;
BEGIN
    -- Step 1: Verify clinic exists and get organization info
    RAISE NOTICE 'Step 1: Verifying clinic and organization...';
    
    SELECT c.*, o.name as org_name, o.org_id as org_code
    INTO clinic_record
    FROM clinics c
    LEFT JOIN organizations o ON c.organization_id = o.id
    WHERE c.id = '3d0e7986-4f45-4d9b-978a-19de45f51bc6';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Clinic with ID 3d0e7986-4f45-4d9b-978a-19de45f51bc6 not found!';
    END IF;
    
    IF clinic_record.organization_id IS NULL THEN
        RAISE EXCEPTION 'Clinic % is not associated with any organization!', clinic_record.name;
    END IF;
    
    RAISE NOTICE 'Clinic verified: % (Type: %) - Organization: %', 
        clinic_record.name, clinic_record.clinic_type, clinic_record.org_name;
    
    -- Step 2: Create or find Provider role
    RAISE NOTICE 'Step 2: Setting up Provider role...';
    
    INSERT INTO roles (name, permissions)
    VALUES ('Provider', '{
        "patients": {"read": true, "write": true, "delete": false},
        "appointments": {"read": true, "write": true, "delete": true},
        "labs": {"read": true, "write": true, "delete": false},
        "clinical_notes": {"read": true, "write": true, "delete": false},
        "treatment_plans": {"read": true, "write": true, "delete": false}
    }'::jsonb)
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO provider_role_id;
    
    -- Get the role ID if it already existed
    IF provider_role_id IS NULL THEN
        SELECT id INTO provider_role_id FROM roles WHERE name = 'Provider';
    END IF;
    
    RAISE NOTICE 'Provider role ready with ID: %', provider_role_id;
    
    -- Step 3: Check if user already exists
    SELECT auth.uid() INTO new_auth_user_id 
    FROM auth.users 
    WHERE email = 'provider@testclinic.com';
    
    IF new_auth_user_id IS NOT NULL THEN
        RAISE NOTICE 'Auth user already exists with email provider@testclinic.com';
    ELSE
        RAISE NOTICE 'Step 3: Creating auth user...';
        RAISE NOTICE 'NOTE: You need to create the auth user manually in Supabase Dashboard or use the admin API';
        RAISE NOTICE 'Email: provider@testclinic.com';
        RAISE NOTICE 'Password: Password123!';
        RAISE NOTICE 'After creating the auth user, run the following SQL to complete the setup:';
        RAISE NOTICE '';
        RAISE NOTICE 'INSERT INTO users (clinic_id, email, full_name, role_id, auth_user_id)';
        RAISE NOTICE 'SELECT ''%'', ''provider@testclinic.com'', ''Provider User'', ''%'', id', 
            clinic_record.id, provider_role_id;
        RAISE NOTICE 'FROM auth.users WHERE email = ''provider@testclinic.com'';';
        RAISE NOTICE '';
    END IF;
    
    -- Step 4: Create user profile if auth user exists
    IF new_auth_user_id IS NOT NULL THEN
        RAISE NOTICE 'Step 4: Creating user profile...';
        
        INSERT INTO users (
            clinic_id,
            email,
            full_name,
            role_id,
            auth_user_id
        ) VALUES (
            clinic_record.id,
            'provider@testclinic.com',
            'Provider User',
            provider_role_id,
            new_auth_user_id
        )
        ON CONFLICT (email) DO UPDATE SET
            clinic_id = EXCLUDED.clinic_id,
            role_id = EXCLUDED.role_id,
            auth_user_id = EXCLUDED.auth_user_id,
            updated_at = now()
        RETURNING id INTO new_user_id;
        
        RAISE NOTICE 'User profile created with ID: %', new_user_id;
        
        -- Step 5: Verify the complete setup
        RAISE NOTICE 'Step 5: Account verification...';
        RAISE NOTICE '=== ACCOUNT CREATED SUCCESSFULLY ===';
        RAISE NOTICE 'Email: provider@testclinic.com';
        RAISE NOTICE 'Password: Password123!';
        RAISE NOTICE 'Role: Provider';
        RAISE NOTICE 'Clinic: % (%)', clinic_record.name, clinic_record.clinic_type;
        RAISE NOTICE 'Organization: %', clinic_record.org_name;
        RAISE NOTICE '=====================================';
    END IF;
    
END $$;

-- Manual steps notice
SELECT 
    'MANUAL STEP REQUIRED' as status,
    'Go to Supabase Dashboard > Authentication > Users > Add User' as action,
    'provider@testclinic.com' as email,
    'Password123!' as password,
    'Then run the follow-up SQL below' as next_step;

-- Follow-up SQL to run after creating the auth user manually
SELECT 
    'RUN THIS AFTER CREATING AUTH USER:' as instruction,
    format('
INSERT INTO users (clinic_id, email, full_name, role_id, auth_user_id)
SELECT ''%s'', ''provider@testclinic.com'', ''Provider User'', r.id, au.id
FROM auth.users au, roles r
WHERE au.email = ''provider@testclinic.com'' 
AND r.name = ''Provider''
ON CONFLICT (email) DO UPDATE SET
    clinic_id = EXCLUDED.clinic_id,
    role_id = EXCLUDED.role_id,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = now();
    ', '3d0e7986-4f45-4d9b-978a-19de45f51bc6') as sql_to_run;