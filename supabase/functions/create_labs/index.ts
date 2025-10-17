import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Helper function to create timeline events
async function createTimelineEvent(
  supabaseClient: any,
  eventData: {
    patient_id: string;
    clinic_id: string;
    event_type: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    provider_id: string;
    outcome?: string;
  }
): Promise<boolean> {
  try {
    console.log('📅 Creating timeline event:', eventData.title);
    console.log('📅 Timeline event data:', JSON.stringify(eventData, null, 2));

    const { data: timelineEvent, error: timelineError } = await supabaseClient
      .from('timeline_events')
      .insert({
        patient_id: eventData.patient_id,
        clinic_id: eventData.clinic_id,
        event_date: new Date().toISOString().split('T')[0],
        event_type: eventData.event_type,
        title: eventData.title,
        description: eventData.description,
        severity: eventData.severity,
        provider_id: eventData.provider_id,
        outcome: eventData.outcome || null,
        created_by: eventData.provider_id,
        is_deleted: false
      })
      .select('id')
      .single();

    if (timelineError) {
      console.error('❌ Timeline event creation failed:', JSON.stringify(timelineError, null, 2));
      return false;
    }

    console.log('✅ Timeline event created successfully:', timelineEvent.id);
    return true;
  } catch (error) {
    console.error('💥 Timeline event creation error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  console.log('🚀 create_labs function invoked');

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
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

    const { data: userProfile, error: profileError } = await authClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          error: 'User profile not found',
          details: profileError?.message || 'No user record exists'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestBody = await req.json();
    const {
      patient_id,
      lab_name,
      test_type,
      result,
      result_date,
      ordered_by
    } = requestBody;

    if (!patient_id || !lab_name) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'patient_id and lab_name are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create lab
    const { data: lab, error: createError } = await supabaseClient
      .from('labs')
      .insert({
        patient_id,
        clinic_id: userProfile.clinic_id,
        lab_name,
        test_type: test_type || null,
        result: result || null,
        result_date: result_date || null,
        ordered_by: ordered_by || userProfile.id,
        created_by: userProfile.id,
        is_deleted: false
      })
      .select(`
        id,
        lab_name,
        test_type,
        result,
        result_date,
        patient_id,
        ordered_by,
        clinic_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        ordered_by_user:users!ordered_by(full_name)
      `)
      .single();

    if (createError) {
      console.error('❌ Failed to create lab:', createError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create lab',
          details: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Lab created successfully:', lab.id);

    // Create timeline event for the lab
    const timelineDescription = [
      test_type && `Test Type: ${test_type}`,
      result && `Result: ${result}`,
      result_date && `Result Date: ${result_date}`
    ].filter(Boolean).join(' | ') || 'Lab test ordered';

    await createTimelineEvent(supabaseClient, {
      patient_id,
      clinic_id: userProfile.clinic_id,
      event_type: 'Lab Work',
      title: `Lab Test: ${lab_name}`,
      description: timelineDescription,
      severity: 'medium',
      provider_id: ordered_by || userProfile.id,
      outcome: 'Lab test ordered and recorded'
    });

    const transformedLab = {
      ...lab,
      patient_name: `${lab.patients.first_name} ${lab.patients.last_name}`,
      ordered_by_name: lab.ordered_by_user?.full_name || 'Unknown Provider'
    };

    return new Response(
      JSON.stringify(transformedLab),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in create_labs:', error);
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