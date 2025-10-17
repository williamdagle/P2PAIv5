import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_patients function invoked');
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('✅ Supabase client created');

    // Get the current user from the JWT token
    console.log('🔐 Getting user from JWT token...');
    console.log('🎫 Token format check:', req.headers.get('Authorization')?.substring(0, 20) + '...');

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

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

    // Get patients from the same clinic (RLS will handle filtering)
    console.log('👥 Fetching patients from database...');
    console.log('🔍 Query: SELECT id, first_name, last_name, dob, gender, patient_id, created_at, updated_at FROM patients WHERE is_deleted = false ORDER BY last_name ASC');

    const { data: patients, error: patientsError } = await supabaseClient
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        dob,
        gender,
        patient_id,
        created_at,
        updated_at
      `)
      .eq('is_deleted', false)
      .order('last_name', { ascending: true });

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      console.log('🔍 Error details:', JSON.stringify(patientsError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch patients' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Patients fetched successfully');
    console.log('📈 Number of patients returned:', patients?.length || 0);
    console.log('👥 Patients data preview:', patients?.slice(0, 2));

    console.log('📤 Sending response...');
    return new Response(JSON.stringify(patients || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_patients:', error);
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