import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login...\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'Password123!'
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    return;
  }

  console.log('✅ Authentication successful');
  console.log(`User ID: ${data.user.id}`);
  console.log(`Email: ${data.user.email}`);

  // Now try to fetch the user profile (this is where RLS matters)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, clinic_id')
    .eq('auth_user_id', data.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile fetch failed:', profileError.message);
    return;
  }

  console.log('✅ Profile fetch successful');
  console.log('Profile:', profile);
  console.log('\n🎉 Login flow works completely!');
}

testLogin().catch(console.error);
