import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 create_appointments function invoked');
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
        JSON.stringify({ 
          error: 'Authentication required',
          details: userError?.message || 'No valid user session'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get user profile to get clinic_id
    console.log('👤 Fetching user profile...');
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ Failed to get user profile:', profileError);
      return new Response(
        JSON.stringify({
          error: 'User profile not found',
          details: profileError?.message
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User profile loaded:', { id: userProfile.id, clinic_id: userProfile.clinic_id });

    // Parse request body
    console.log('📋 Parsing request body...');
    const requestBody = await req.json();
    const {
      patient_id,
      provider_id,
      appointment_date,
      appointment_type_id,
      duration_minutes,
      reason,
      status
    } = requestBody;

    console.log('📝 Request data:', {
      patient_id,
      provider_id,
      appointment_date,
      duration_minutes,
      reason,
      status
    });

    // Validate required fields
    if (!patient_id || !provider_id || !appointment_date) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'patient_id, provider_id and appointment_date are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📝 Creating appointment with data:', {
      patient_id,
      provider_id,
      appointment_date,
      clinic_id: userProfile.clinic_id
    });

    // Lookup provider name using service role to bypass RLS
    console.log('👤 Looking up provider name...');
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: providerData } = await serviceRoleClient
      .from('users')
      .select('full_name')
      .eq('id', provider_id)
      .single();

    const provider_name = providerData?.full_name || 'Not Assigned';
    console.log('✅ Provider name resolved:', provider_name);

    // Create appointment - RLS will ensure it's created in the correct clinic
    const { data: appointment, error: createError } = await supabaseClient
      .from('appointments')
      .insert({
        patient_id,
        provider_id,
        provider_name,
        clinic_id: userProfile.clinic_id,
        appointment_date,
        appointment_type_id: appointment_type_id || null,
        duration_minutes: duration_minutes || 30,
        reason: reason || '',
        status: status || 'scheduled',
        created_by: userProfile.id,
        is_deleted: false
      })
      .select(`
        id,
        appointment_date,
        appointment_type_id,
        duration_minutes,
        reason,
        status,
        patient_id,
        provider_id,
        provider_name,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        appointment_type:appointment_types(id, name, color_code)
      `)
      .single();

    if (createError) {
      console.error('❌ Failed to create appointment:', createError);
      console.log('🔍 Error details:', JSON.stringify(createError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Failed to create appointment',
          details: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Appointment created successfully:', appointment.id);

    // Transform the data to include patient name and appointment type name
    const transformedAppointment = {
      ...appointment,
      patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
      appointment_type_name: appointment.appointment_type?.name || null,
      // Ensure IDs are at the root level
      provider_id: appointment.provider_id,
      appointment_type_id: appointment.appointment_type_id,
      // provider_name is already included from the database
    };

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify(transformedAppointment),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in create_appointments:', error);
    console.log('🔍 Full error details:', JSON.stringify(error, null, 2));
    console.log('📊 Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
