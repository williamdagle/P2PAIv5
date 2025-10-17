import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('Creating test user...\n');

  // Get the first clinic
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name')
    .limit(1)
    .single();

  if (clinicError || !clinic) {
    console.error('Error fetching clinic:', clinicError);
    return;
  }

  console.log(`Using clinic: ${clinic.name} (${clinic.id})`);

  // Get System Admin role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', 'System Admin')
    .single();

  if (roleError || !role) {
    console.error('Error fetching role:', roleError);
    return;
  }

  const testEmail = 'test@example.com';
  const testPassword = 'Password123!';

  console.log(`\nCreating user with email: ${testEmail}`);

  // Check if auth user already exists
  const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === testEmail);

  let authUserId;

  if (existingAuthUser) {
    console.log('Auth user already exists, using existing user');
    authUserId = existingAuthUser.id;
  } else {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) {
      console.error('Failed to create auth user:', authError);
      return;
    }

    authUserId = authUser.user.id;
    console.log('✅ Auth user created');
  }

  // Check if user record already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existingUser) {
    console.log('User record already exists');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log('=========================\n');
    return;
  }

  // Create user record
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      auth_user_id: authUserId,
      email: testEmail,
      full_name: 'Test User',
      role_id: role.id,
      clinic_id: clinic.id
    })
    .select()
    .single();

  if (userError) {
    console.error('Failed to create user record:', userError);
    return;
  }

  console.log('✅ User record created');
  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log('=========================\n');
}

createTestUser().catch(console.error);
