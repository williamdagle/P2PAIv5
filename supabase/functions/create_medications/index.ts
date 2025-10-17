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

    console.log('📊 Timeline insert result:', { data: timelineEvent, error: timelineError });

    if (timelineError) {
      console.error('❌ Timeline event creation failed:');
      console.error('❌ Error code:', timelineError.code);
      console.error('❌ Error message:', timelineError.message);
      console.error('❌ Error details:', timelineError.details);
      console.error('❌ Error hint:', timelineError.hint);
      console.error('❌ Full error:', JSON.stringify(timelineError, null, 2));
      return false;
    }

    if (!timelineEvent) {
      console.error('❌ Timeline event data is null despite no error');
      return false;
    }

    console.log('✅ Timeline event created successfully:', timelineEvent.id);
    return true;
  } catch (error) {
    console.error('💥 Timeline event creation error:', error);
    console.error('💥 Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

Deno.serve(async (req) => {
  console.log('🚀 create_medications function invoked');
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

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

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

    console.log('🔍 Looking up user profile for auth_user_id:', user.id);
    // Use auth client to get user profile (respects RLS)
    const { data: userProfile, error: profileError } = await authClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    console.log('🔍 User profile query result:', { userProfile, profileError });

    if (profileError) {
      console.error('❌ Failed to get user profile - database error:', profileError);
      return new Response(
        JSON.stringify({
          error: 'Failed to query user profile',
          details: profileError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!userProfile) {
      console.error('❌ User profile not found for auth_user_id:', user.id);
      return new Response(
        JSON.stringify({
          error: 'User profile not found',
          details: 'No user record exists for this authenticated user'
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
      name,
      dosage,
      frequency,
      start_date,
      end_date,
      prescribed_by
    } = requestBody;

    console.log('📝 Request data:', {
      patient_id,
      name,
      dosage,
      frequency,
      prescribed_by
    });

    // Validation
    if (!patient_id || !name) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'patient_id and name are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (endDate <= startDate) {
        console.error('❌ Invalid date range - end date must be after start date');
        return new Response(
          JSON.stringify({
            error: 'Invalid date range',
            details: 'End date must be after start date'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('💊 Creating medication with data:', {
      patient_id,
      name,
      clinic_id: userProfile.clinic_id
    });

    // Create medication
    const { data: medication, error: createError } = await supabaseClient
      .from('medications')
      .insert({
        patient_id,
        clinic_id: userProfile.clinic_id,
        name,
        dosage: dosage || null,
        frequency: frequency || null,
        start_date: start_date || null,
        end_date: end_date || null,
        prescribed_by: prescribed_by || userProfile.id,
        created_by: userProfile.id,
        is_deleted: false
      })
      .select(`
        id,
        name,
        dosage,
        frequency,
        start_date,
        end_date,
        patient_id,
        prescribed_by,
        clinic_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        prescribed_by_user:users!prescribed_by(full_name)
      `)
      .single();

    if (createError) {
      console.error('❌ Failed to create medication:', createError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create medication',
          details: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Medication created successfully:', medication.id);

    // Create timeline event for the medication
    const timelineDescription = [
      dosage && `Dosage: ${dosage}`,
      frequency && `Frequency: ${frequency}`,
      start_date && `Start Date: ${start_date}`,
      end_date && `End Date: ${end_date}`
    ].filter(Boolean).join(' | ') || 'Medication prescribed';

    // Use service role client for timeline event to bypass RLS
    const timelineSuccess = await createTimelineEvent(supabaseClient, {
      patient_id,
      clinic_id: userProfile.clinic_id,
      event_type: 'Medication',
      title: `Medication Added: ${name}`,
      description: timelineDescription,
      severity: 'medium',
      provider_id: prescribed_by || userProfile.id,
      outcome: 'Medication prescribed and added to patient record'
    });

    if (!timelineSuccess) {
      console.warn('⚠️ Timeline event creation failed, but medication was created successfully');
    }

    // Transform the data to include patient and provider names
    const transformedMedication = {
      ...medication,
      patient_name: `${medication.patients.first_name} ${medication.patients.last_name}`,
      prescribed_by_name: medication.prescribed_by_user?.full_name || 'Unknown Provider'
    };

    console.log('📤 Sending success response');
    return new Response(
      JSON.stringify(transformedMedication),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Fatal error in create_medications:', error);
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