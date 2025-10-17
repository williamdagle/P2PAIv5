/*
  # Link Provider Auth User to Profile

  This script will:
  1. Find the auth user for provider@testclinic.com
  2. Update the users table to link auth_user_id
  3. Verify the connection is established
*/

-- Step 1: Find the auth user ID
DO $$
DECLARE
    auth_user_uuid uuid;
    profile_user_uuid uuid;
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_uuid
    FROM auth.users 
    WHERE email = 'provider@testclinic.com';
    
    IF auth_user_uuid IS NULL THEN
        RAISE EXCEPTION 'Auth user not found for provider@testclinic.com';
    END IF;
    
    -- Get the profile user ID
    SELECT id INTO profile_user_uuid
    FROM public.users 
    WHERE email = 'provider@testclinic.com';
    
    IF profile_user_uuid IS NULL THEN
        RAISE EXCEPTION 'Profile user not found for provider@testclinic.com';
    END IF;
    
    -- Update the profile to link to auth user
    UPDATE public.users 
    SET auth_user_id = auth_user_uuid,
        updated_at = now()
    WHERE email = 'provider@testclinic.com';
    
    RAISE NOTICE 'Successfully linked auth user % to profile user %', auth_user_uuid, profile_user_uuid;
END $$;

-- Step 2: Verify the connection
SELECT 
    u.id as profile_id,
    u.email,
    u.full_name,
    u.auth_user_id,
    au.id as auth_id,
    au.email as auth_email,
    c.name as clinic_name,
    r.name as role_name
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
LEFT JOIN public.clinics c ON u.clinic_id = c.id
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'provider@testclinic.com';

-- Success message
SELECT 'Provider account successfully linked! You can now log in with provider@testclinic.com' as result;