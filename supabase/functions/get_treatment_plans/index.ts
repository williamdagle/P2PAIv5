import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_treatment_plans function invoked');
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
      .from('treatment_plans')
      .select(`
        id,
        clinic_id,
        clinic_id,
        title,
        description,
        status,
        patient_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name)
      `)
      .eq('is_deleted', false);

    // Add patient filter if provided
    if (patient_id) {
      console.log('🎯 Adding patient_id filter:', patient_id);
      query = query.eq('patient_id', patient_id);
    }

    // Execute the query
    console.log('📊 Executing database query...');
    const { data: treatment_plans, error } = await query.order('created_at', {
      ascending: false
    });

    if (error) {
      console.error('Error fetching treatment plans:', error);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch treatment plans' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Treatment plans fetched successfully');
    console.log('📈 Number of treatment plans returned:', treatment_plans?.length || 0);
    console.log('📋 Treatment plans data preview:', treatment_plans?.slice(0, 2));

    // Transform the data to include patient names
    console.log('🔄 Transforming treatment plan data...');
    const transformedPlans = treatment_plans?.map((plan) => ({
      ...plan,
      patient_name: `${plan.patients.first_name} ${plan.patients.last_name}`
    })) || [];

    console.log('✅ Data transformation complete');

    // Return in format expected by current API client
    console.log('📤 Sending response...');
    return new Response(JSON.stringify(transformedPlans), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_treatment_plans:', error);
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