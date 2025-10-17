import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_users function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('🔑 Authorization header present:', !!req.headers.get('Authorization'));
  console.log('🌍 Origin header:', req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Creating Supabase client...');
    console.log('🔍 SUPABASE_URL available:', !!Deno.env.get('SUPABASE_URL'));
    console.log('🔍 SUPABASE_ANON_KEY available:', !!Deno.env.get('SUPABASE_ANON_KEY'));

    // Create client for auth verification using anon key
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Create service role client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('✅ Supabase client created');

    // Get the current user from the JWT token
    console.log('🔐 Getting user from JWT token...');
    console.log('🎫 Token format check:', req.headers.get('Authorization')?.substring(0, 20) + '...');

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      console.log('👤 User data:', user);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get user profile to get clinic_id and role for filtering
    console.log('👤 Fetching current user profile...');
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, clinic_id, full_name, role_id, roles(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !currentUserProfile) {
      console.error('❌ Failed to get current user profile:', profileError);
      return new Response(
        JSON.stringify({
          error: 'Current user profile not found',
          details: profileError?.message
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Current user profile loaded:', {
      id: currentUserProfile.id,
      clinic_id: currentUserProfile.clinic_id,
      full_name: currentUserProfile.full_name,
      role: currentUserProfile.roles?.name
    });

    const isSystemAdmin = currentUserProfile.roles?.name === 'System Admin';
    console.log('🔐 User is System Admin:', isSystemAdmin);

    // Get all users, filtered by authorization
    console.log('👥 Fetching users from database...');

    let query = supabaseAdmin
      .from('users')
      .select('*, roles(name), clinics(name, organization_id)');

    if (isSystemAdmin) {
      // System Admins see all users in their organization
      console.log('🔍 System Admin - filtering by organization');

      // First get the organization_id for the current user's clinic
      const { data: clinic } = await supabaseAdmin
        .from('clinics')
        .select('organization_id')
        .eq('id', currentUserProfile.clinic_id)
        .single();

      if (clinic) {
        console.log('🏢 User organization:', clinic.organization_id);
        // Get all clinic IDs in this organization
        const { data: orgClinics } = await supabaseAdmin
          .from('clinics')
          .select('id')
          .eq('organization_id', clinic.organization_id);

        const clinicIds = orgClinics?.map(c => c.id) || [];
        console.log('🏥 Organization clinic IDs:', clinicIds);

        query = query.in('clinic_id', clinicIds);
      }
    } else {
      // Regular users see users in their clinic
      console.log('🔍 Regular user - filtering by clinic:', currentUserProfile.clinic_id);
      query = query.eq('clinic_id', currentUserProfile.clinic_id);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      console.log('🔍 Error details:', JSON.stringify(usersError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Users fetched successfully');
    console.log('📈 Number of users returned:', users?.length || 0);
    console.log('👥 Users data preview:', users?.slice(0, 2));
    console.log('🏥 All user clinic_ids:', users?.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      clinic_id: u.clinic_id
    })));

    return new Response(JSON.stringify({ users: users || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_users:', error);
    console.log('🔍 Full error details:', JSON.stringify(error, null, 2));
    console.log('📊 Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
