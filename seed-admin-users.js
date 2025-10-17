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

async function seedAdminUsers() {
  console.log('Starting admin user seeding...\n');

  const { data: clinics, error: clinicsError } = await supabase
    .from('clinics')
    .select('id, name')
    .order('name');

  if (clinicsError) {
    console.error('Error fetching clinics:', clinicsError);
    return;
  }

  const { data: adminRole, error: roleError } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', 'System Admin')
    .single();

  if (roleError) {
    console.error('Error fetching System Admin role:', roleError);
    return;
  }

  console.log(`Found ${clinics.length} clinics`);
  console.log(`Using role: ${adminRole.name} (${adminRole.id})\n`);

  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  for (const clinic of clinics) {
    const email = `admin@${clinic.name.toLowerCase().replace(/\s+/g, '-')}.com`;

    console.log(`Processing clinic: ${clinic.name}`);
    console.log(`  Email: ${email}`);

    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .eq('clinic_id', clinic.id)
      .maybeSingle();

    if (existingUser) {
      console.log(`  ⏭️  Skipped - User already exists\n`);
      results.skipped.push({ clinic: clinic.name, email, reason: 'User already exists' });
      continue;
    }

    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'Password123!',
        email_confirm: true
      });

      if (authError) {
        console.log(`  ❌ Failed to create auth user: ${authError.message}\n`);
        results.failed.push({ clinic: clinic.name, email, error: authError.message });
        continue;
      }

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUser.user.id,
          email,
          full_name: `Admin - ${clinic.name}`,
          role_id: adminRole.id,
          clinic_id: clinic.id
        })
        .select()
        .single();

      if (userError) {
        console.log(`  ❌ Failed to create user record: ${userError.message}`);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log(`  🧹 Cleaned up auth user\n`);
        results.failed.push({ clinic: clinic.name, email, error: userError.message });
        continue;
      }

      console.log(`  ✅ Successfully created admin user\n`);
      results.success.push({ clinic: clinic.name, email, userId: newUser.id });

    } catch (error) {
      console.log(`  ❌ Unexpected error: ${error.message}\n`);
      results.failed.push({ clinic: clinic.name, email, error: error.message });
    }
  }

  console.log('\n==================== SUMMARY ====================\n');
  console.log(`✅ Successfully created: ${results.success.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('\n===============================================\n');

  if (results.success.length > 0) {
    console.log('Successfully created admin users:');
    results.success.forEach(r => {
      console.log(`  - ${r.email} (${r.clinic})`);
    });
    console.log();
  }

  if (results.skipped.length > 0) {
    console.log('Skipped users:');
    results.skipped.forEach(r => {
      console.log(`  - ${r.email} (${r.clinic}): ${r.reason}`);
    });
    console.log();
  }

  if (results.failed.length > 0) {
    console.log('Failed to create:');
    results.failed.forEach(r => {
      console.log(`  - ${r.email} (${r.clinic}): ${r.error}`);
    });
    console.log();
  }

  console.log('Admin user credentials:');
  console.log('  Password: Password123!');
  console.log('\nSeeding complete!');
}

seedAdminUsers().catch(console.error);
