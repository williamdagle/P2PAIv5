import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 update_patients function invoked');
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

    // Get patient ID from request body (matching current API client pattern)
    console.log('📋 Parsing request body...');
    const requestBody = await req.json();
    const { 
      id: patient_id,
      first_name, 
      last_name, 
      dob, 
      gender,
      patient_id: patient_code
    } = requestBody;

    console.log('📝 Request data:', {
      patient_id,
      first_name,
      last_name,
      dob,
      gender,
      patient_code
    });

    // Validate required fields
    if (!patient_id) {
      console.error('❌ Missing patient ID');
      return new Response(
        JSON.stringify({
          error: 'Missing patient ID',
          details: 'Patient ID is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if at least one field is being updated
    const hasUpdates = first_name || last_name || dob || gender || patient_code;
    if (!hasUpdates) {
      console.error('❌ No fields to update');
      return new Response(
        JSON.stringify({
          error: 'No fields to update',
          details: 'At least one field must be provided for update'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate gender if provided
    if (gender && !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
      console.error('❌ Invalid gender value:', gender);
      return new Response(
        JSON.stringify({
          error: 'Invalid gender value',
          details: 'Gender must be one of: Male, Female, Other, Prefer not to say'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate date of birth if provided
    if (dob) {
      const dobDate = new Date(dob);
      if (dobDate > new Date()) {
        console.error('❌ Invalid date of birth - cannot be in the future');
        return new Response(
          JSON.stringify({
            error: 'Invalid date of birth',
            details: 'Date of birth cannot be in the future'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('📝 Updating patient:', patient_id);

    // Build update object with only provided fields
    const updateData: any = {
      updated_by: userProfile.id,
      updated_at: new Date().toISOString()
    };

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (dob) updateData.dob = dob;
    if (gender) updateData.gender = gender;
    if (patient_code) updateData.patient_id = patient_code;

    // Update patient - RLS will ensure it's in the correct clinic
    const { data: patient, error: updateError } = await supabaseClient
      .from('patients')
      .update(updateData)
      .eq('id', patient_id)
      .eq('clinic_id', userProfile.clinic_id)
      .eq('is_deleted', false)
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
      .single();

    if (updateError) {
      console.error('❌ Failed to update patient:', updateError);
      console.log('🔍 Error details:', JSON.stringify(updateError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Failed to update patient',
          details: updateError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!patient) {
      console.error('❌ Patient not found or access denied');
      return new Response(
        JSON.stringify({
          error: 'Patient not found or access denied',
          details: 'The patient may not exist, may be deleted, or you may not have permission to update it'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Patient updated successfully:', patient.id);

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify(patient),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in update_patients:', error);
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