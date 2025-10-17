import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 delete_appointments function invoked');
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
    console.log('🔧 Creating Supabase clients...');
    console.log('🔍 SUPABASE_URL available:', !!Deno.env.get('SUPABASE_URL'));
    console.log('🔍 SUPABASE_ANON_KEY available:', !!Deno.env.get('SUPABASE_ANON_KEY'));
    console.log('🔍 SUPABASE_SERVICE_ROLE_KEY available:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // Create client for auth verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Create service role client for database operations (bypassing RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('✅ Supabase clients created');

    // Get the current user from the JWT token
    console.log('🔐 Getting user from JWT token...');
    console.log('🎫 Token format check:', req.headers.get('Authorization')?.substring(0, 20) + '...');

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

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

    // Get appointment ID from request body (matching current API client pattern)
    console.log('📋 Parsing request body...');
    const requestBody = await req.json();
    const { id: appointment_id } = requestBody;

    console.log('📝 Request data:', { appointment_id });

    // Validate required fields
    if (!appointment_id) {
      console.error('❌ Missing appointment ID');
      return new Response(
        JSON.stringify({
          error: 'Missing appointment ID',
          details: 'Appointment ID is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Soft deleting appointment:', appointment_id);

    // First, verify the appointment exists and get basic info
    const { data: existingAppointment, error: checkError } = await supabaseClient
      .from('appointments')
      .select('id, clinic_id, patient_id, provider_id, is_deleted')
      .eq('id', appointment_id)
      .eq('clinic_id', userProfile.clinic_id)
      .maybeSingle();

    console.log('🔍 Existing appointment check:', { existingAppointment, checkError });

    if (checkError) {
      console.error('❌ Error checking appointment:', checkError);
      return new Response(
        JSON.stringify({
          error: 'Failed to verify appointment',
          details: checkError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!existingAppointment) {
      console.error('❌ Appointment not found or access denied');
      return new Response(
        JSON.stringify({
          error: 'Appointment not found or access denied',
          details: 'The appointment may not exist or you may not have permission to delete it'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingAppointment.is_deleted === true) {
      console.error('❌ Appointment already deleted');
      return new Response(
        JSON.stringify({
          error: 'Appointment already deleted',
          details: 'This appointment has already been deleted'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Perform the soft delete
    const { error: deleteError } = await supabaseClient
      .from('appointments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: userProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment_id)
      .eq('clinic_id', userProfile.clinic_id);

    if (deleteError) {
      console.error('❌ Failed to delete appointment:', deleteError);
      console.log('🔍 Error details:', JSON.stringify(deleteError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Failed to delete appointment',
          details: deleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Appointment soft deleted successfully:', appointment_id);

    // Fetch patient information
    const { data: patient } = await supabaseClient
      .from('patients')
      .select('first_name, last_name')
      .eq('id', existingAppointment.patient_id)
      .maybeSingle();

    // Fetch provider information
    const { data: provider } = await supabaseClient
      .from('users')
      .select('full_name')
      .eq('id', existingAppointment.provider_id)
      .maybeSingle();

    // Transform the data to include patient and provider names
    const transformedAppointment = {
      id: existingAppointment.id,
      patient_id: existingAppointment.patient_id,
      provider_id: existingAppointment.provider_id,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
      provider_name: provider?.full_name || 'Unknown Provider',
      is_deleted: true,
      deleted_at: new Date().toISOString()
    };

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify({
        message: 'Appointment deleted successfully',
        appointment: transformedAppointment,
        success: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in delete_appointments:', error);
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