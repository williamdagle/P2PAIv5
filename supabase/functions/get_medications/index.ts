import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_medications function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('🔑 Authorization header present:', !!req.headers.get('Authorization'));
  console.log('🌍 Origin header:', req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
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

    // Get query parameters
    console.log('🔍 Parsing query parameters...');
    const url = new URL(req.url);
    const patient_id = url.searchParams.get('patient_id');

    console.log('📋 Query params:', { patient_id });

    // Build the query - RLS will handle clinic filtering
    console.log('🔨 Building database query...');
    let query = supabaseClient
      .from('medications')
      .select(`
        id,
        clinic_id,
        clinic_id,
        name,
        dosage,
        frequency,
        start_date,
        end_date,
        patient_id,
        prescribed_by,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        prescribed_by_user:users!prescribed_by(full_name)
      `)
      .eq('is_deleted', false);

    // Add patient filter if provided
    if (patient_id) {
      console.log('🎯 Adding patient_id filter:', patient_id);
      query = query.eq('patient_id', patient_id);
    }

    // Execute the query
    console.log('📊 Executing database query...');
    const { data: medications, error } = await query.order('start_date', {
      ascending: false
    });

    if (error) {
      console.error('Error fetching medications:', error);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch medications' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Medications fetched successfully');
    console.log('📈 Number of medications returned:', medications?.length || 0);
    console.log('💊 Medications data preview:', medications?.slice(0, 2));

    // Transform the data to include patient names
    console.log('🔄 Transforming medication data...');
    const transformedMedications = medications?.map((medication) => ({
      ...medication,
      patient_name: `${medication.patients.first_name} ${medication.patients.last_name}`,
      prescribed_by_name: medication.prescribed_by_user?.full_name || 'Unknown Provider'
    })) || [];

    console.log('✅ Data transformation complete');

    // Return in format expected by current API client
    console.log('📤 Sending response...');
    return new Response(JSON.stringify(transformedMedications), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_medications:', error);
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