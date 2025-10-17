import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_appointments function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);

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
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const url = new URL(req.url);
    const patient_id = url.searchParams.get('patient_id');
    const provider_id = url.searchParams.get('provider_id');
    const date = url.searchParams.get('date');

    console.log('📋 Query params:', { patient_id, provider_id, date });

    let query = supabaseClient
      .from('appointments')
      .select(`
        id,
        clinic_id,
        appointment_date,
        duration_minutes,
        reason,
        status,
        patient_id,
        provider_id,
        provider_name,
        appointment_type_id,
        is_free,
        approval_status,
        notes,
        created_at,
        updated_at,
        patients!inner(first_name, last_name)
      `)
      .eq('is_deleted', false);

    if (patient_id) {
      console.log('🎯 Adding patient_id filter:', patient_id);
      query = query.eq('patient_id', patient_id);
    }

    if (provider_id) {
      console.log('🎯 Adding provider_id filter:', provider_id);
      query = query.eq('provider_id', provider_id);
    }

    if (date) {
      console.log('🎯 Adding date filter:', date);
      // Parse the date string and create start/end of day in UTC
      // This ensures we capture all appointments on the selected date
      const dateParts = date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2]);

      // Create date objects for start and end of the day
      const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      query = query
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString());

      console.log('📅 Date range:', {
        inputDate: date,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
    }

    console.log('📊 Executing database query...');
    const { data: appointments, error } = await query.order('appointment_date', {
      ascending: true
    });

    if (error) {
      console.error('Error fetching appointments:', error);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Appointments fetched successfully');
    console.log('📈 Number of appointments returned:', appointments?.length || 0);

    // Get unique appointment type IDs
    const typeIds = [...new Set(appointments?.map(a => a.appointment_type_id).filter(Boolean))];

    // Fetch appointment types if there are any
    let appointmentTypesMap = new Map();
    if (typeIds.length > 0) {
      const { data: types } = await supabaseClient
        .from('appointment_types')
        .select('id, name, color_code')
        .in('id', typeIds);

      if (types) {
        types.forEach(type => appointmentTypesMap.set(type.id, type));
      }
    }

    const transformedAppointments = appointments?.map((appointment) => ({
      ...appointment,
      patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
      // provider_name is already stored in the database
      appointment_type_name: appointment.appointment_type_id && appointmentTypesMap.has(appointment.appointment_type_id)
        ? appointmentTypesMap.get(appointment.appointment_type_id).name
        : null,
      appointment_type: appointment.appointment_type_id && appointmentTypesMap.has(appointment.appointment_type_id)
        ? appointmentTypesMap.get(appointment.appointment_type_id)
        : null,
      // Explicitly ensure these IDs are at root level for easy access
      provider_id: appointment.provider_id,
      appointment_type_id: appointment.appointment_type_id
    })) || [];

    console.log('✅ Data transformation complete');
    console.log('📊 Sample appointment data:', transformedAppointments[0] ? {
      id: transformedAppointments[0].id,
      provider_id: transformedAppointments[0].provider_id,
      provider_name: transformedAppointments[0].provider_name,
      appointment_type_id: transformedAppointments[0].appointment_type_id
    } : 'No appointments');

    return new Response(JSON.stringify(transformedAppointments), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_appointments:', error);
    console.log('🔍 Full error details:', JSON.stringify(error, null, 2));
    console.log('📊 Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
