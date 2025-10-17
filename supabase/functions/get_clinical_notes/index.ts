import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_clinical_notes function invoked');
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
      .from('clinical_notes')
      .select(`
        id,
        clinic_id,
        title,
        note_type,
        template_id,
        category,
        structured_content,
        raw_content,
        note_date,
        patient_id,
        provider_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        provider:users!provider_id(full_name)
      `)
      .eq('is_deleted', false);

    // Add patient filter if provided
    if (patient_id) {
      console.log('🎯 Adding patient_id filter:', patient_id);
      query = query.eq('patient_id', patient_id);
    }

    // Execute the query
    console.log('📊 Executing database query...');
    const { data: clinical_notes, error } = await query.order('note_date', {
      ascending: false
    });

    if (error) {
      console.error('Error fetching clinical notes:', error);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch clinical notes' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Clinical notes fetched successfully');
    console.log('📈 Number of clinical notes returned:', clinical_notes?.length || 0);
    console.log('📝 Clinical notes data preview:', clinical_notes?.slice(0, 2));

    // Transform the data to include patient names
    console.log('🔄 Transforming clinical notes data...');
    const transformedNotes = clinical_notes?.map((note) => ({
      ...note,
      patient_name: `${note.patients.first_name} ${note.patients.last_name}`,
      provider_name: note.provider?.full_name || 'Unknown Provider'
    })) || [];

    console.log('✅ Data transformation complete');

    // Return in format expected by current API client
    console.log('📤 Sending response...');
    return new Response(JSON.stringify(transformedNotes), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_clinical_notes:', error);
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