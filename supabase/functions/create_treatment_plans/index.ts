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
    
    const { data: timelineEvent, error: timelineError } = await supabaseClient
      .from('timeline_events')
      .insert({
        patient_id: eventData.patient_id,
        clinic_id: eventData.clinic_id,
        event_date: new Date().toISOString().split('T')[0], // Today's date
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
      console.error('❌ Timeline event creation failed:', timelineError);
      return false;
    }

    console.log('✅ Timeline event created successfully:', timelineEvent.id);
    return true;
  } catch (error) {
    console.error('💥 Timeline event creation error:', error);
    return false;
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

Deno.serve(async (req) => {
  console.log('🚀 create_treatment_plans function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('🔑 Authorization header present:', !!req.headers.get('Authorization'));

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
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

    const requestBody = await req.json();
    const { 
      patient_id,
      title,
      description,
      status
    } = requestBody;

    console.log('📝 Request data:', {
      patient_id,
      title,
      description,
      status
    });

    // Validation
    if (!patient_id || !title) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'patient_id and title are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate status if provided
    if (status && !['active', 'completed', 'paused'].includes(status)) {
      console.error('❌ Invalid status:', status);
      return new Response(
        JSON.stringify({
          error: 'Invalid status',
          details: 'Status must be one of: active, completed, paused'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📋 Creating treatment plan with data:', {
      patient_id,
      title,
      clinic_id: userProfile.clinic_id
    });

    // Create treatment plan
    const { data: treatmentPlan, error: createError } = await supabaseClient
      .from('treatment_plans')
      .insert({
        patient_id,
        clinic_id: userProfile.clinic_id,
        title,
        description: description || null,
        status: status || 'active',
        created_by: userProfile.id,
        is_deleted: false
      })
      .select(`
        id,
        title,
        description,
        status,
        patient_id,
        clinic_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name)
      `)
      .single();

    if (createError) {
      console.error('❌ Failed to create treatment plan:', createError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create treatment plan',
          details: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Treatment plan created successfully:', treatmentPlan.id);

    // Create timeline event for the treatment plan
    const timelineDescription = description ? 
      truncateText(description, 200) : 
      'Treatment plan created';

    const timelineSuccess = await createTimelineEvent(supabaseClient, {
      patient_id,
      clinic_id: userProfile.clinic_id,
      event_type: 'Treatment',
      title: `Treatment Plan Created: ${title}`,
      description: timelineDescription,
      severity: 'high',
      provider_id: userProfile.id,
      outcome: 'Treatment plan established and documented'
    });

    if (!timelineSuccess) {
      console.warn('⚠️ Timeline event creation failed, but treatment plan was created successfully');
    }

    // Transform the data to include patient names
    const transformedPlan = {
      ...treatmentPlan,
      patient_name: `${treatmentPlan.patients.first_name} ${treatmentPlan.patients.last_name}`
    };

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify(transformedPlan),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in create_treatment_plans:', error);
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