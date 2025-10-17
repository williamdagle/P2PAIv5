import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 create_timeline_events function invoked');
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
      event_date, 
      event_type, 
      title, 
      description, 
      severity, 
      provider_id, 
      outcome 
    } = requestBody;

    console.log('📝 Request data:', {
      patient_id,
      event_date,
      event_type,
      title,
      severity
    });

    // Validate required fields
    if (!patient_id || !event_date || !event_type || !title) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'patient_id, event_date, event_type, and title are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate event_date is not in the future
    const eventDate = new Date(event_date);
    if (eventDate > new Date()) {
      console.error('❌ Invalid event date - cannot be in the future');
      return new Response(
        JSON.stringify({
          error: 'Invalid event date',
          details: 'Event date cannot be in the future'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate event_type
    const validEventTypes = ['Symptom', 'Treatment', 'Lab Work', 'Appointment', 'Lifestyle Change', 'Supplement', 'Other'];
    if (!validEventTypes.includes(event_type)) {
      console.error('❌ Invalid event type:', event_type);
      return new Response(
        JSON.stringify({
          error: 'Invalid event type',
          details: `Event type must be one of: ${validEventTypes.join(', ')}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate severity if provided
    if (severity && !['low', 'medium', 'high'].includes(severity)) {
      console.error('❌ Invalid severity:', severity);
      return new Response(
        JSON.stringify({
          error: 'Invalid severity',
          details: 'Severity must be one of: low, medium, high'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📝 Creating timeline event with data:', {
      patient_id,
      event_date,
      event_type,
      title,
      clinic_id: userProfile.clinic_id
    });

    // Create timeline event - RLS will ensure it's created in the correct clinic
    const { data: timelineEvent, error: createError } = await supabaseClient
      .from('timeline_events')
      .insert({
        patient_id,
        clinic_id: userProfile.clinic_id,
        event_date,
        event_type,
        title,
        description: description || null,
        severity: severity || 'medium',
        provider_id: provider_id || null,
        outcome: outcome || null,
        created_by: userProfile.id,
        is_deleted: false
      })
      .select(`
        id,
        event_date,
        event_type,
        title,
        description,
        severity,
        provider_id,
        outcome,
        patient_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        provider:users!provider_id(full_name)
      `)
      .single();

    if (createError) {
      console.error('❌ Failed to create timeline event:', createError);
      console.log('🔍 Error details:', JSON.stringify(createError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Failed to create timeline event',
          details: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Timeline event created successfully:', timelineEvent.id);

    // Transform the data to include patient and provider names
    const transformedEvent = {
      ...timelineEvent,
      patient_name: `${timelineEvent.patients.first_name} ${timelineEvent.patients.last_name}`,
      provider_name: timelineEvent.provider?.full_name || null
    };

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify(transformedEvent),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in create_timeline_events:', error);
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