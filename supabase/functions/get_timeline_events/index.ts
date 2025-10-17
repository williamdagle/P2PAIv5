import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  console.log('🚀 get_timeline_events function invoked');
  console.log('📝 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  console.log('🔑 Authorization header present:', !!req.headers.get('Authorization'));
  console.log('🌍 Origin header:', req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
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

    // Get all timeline events and appointments (RLS will filter based on user's clinic)
    console.log('📅 Fetching timeline events and appointments from database...');

    // Get query parameters
    console.log('🔍 Parsing query parameters...');
    const url = new URL(req.url);
    const patient_id = url.searchParams.get('patient_id');
    const event_types = url.searchParams.get('event_types');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');

    console.log('📋 Query params:', { patient_id, event_types, start_date, end_date });

    // Build the timeline events query - RLS will handle clinic filtering
    console.log('🔨 Building timeline events query...');
    let timelineQuery = supabaseClient
      .from('timeline_events')
      .select(`
        id,
        clinic_id,
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
      .eq('is_deleted', false);

    // Build the appointments query
    console.log('🔨 Building appointments query...');
    let appointmentsQuery = supabaseClient
      .from('appointments')
      .select(`
        id,
        clinic_id,
        appointment_date,
        reason,
        status,
        duration_minutes,
        provider_id,
        patient_id,
        created_at,
        updated_at,
        patients!inner(first_name, last_name),
        provider:users!provider_id(full_name)
      `)
      .eq('is_deleted', false);

    // Add patient filter if provided
    if (patient_id) {
      console.log('🎯 Adding patient_id filter:', patient_id);
      timelineQuery = timelineQuery.eq('patient_id', patient_id);
      appointmentsQuery = appointmentsQuery.eq('patient_id', patient_id);
    }

    // Add event type filter if provided
    if (event_types) {
      const types = event_types.split(',');
      console.log('🎯 Adding event_type filter:', types);
      timelineQuery = timelineQuery.in('event_type', types);
      // Filter appointments only if 'Appointment' is in the selected types
      if (!types.includes('Appointment')) {
        // If Appointment is not selected, don't fetch appointments at all
        appointmentsQuery = appointmentsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      }
    }

    // Add date range filters if provided
    if (start_date) {
      console.log('🎯 Adding start_date filter:', start_date);
      timelineQuery = timelineQuery.gte('event_date', start_date);
      appointmentsQuery = appointmentsQuery.gte('appointment_date', start_date);
    }

    if (end_date) {
      console.log('🎯 Adding end_date filter:', end_date);
      timelineQuery = timelineQuery.lte('event_date', end_date);
      appointmentsQuery = appointmentsQuery.lte('appointment_date', end_date);
    }

    // Execute both queries
    console.log('📊 Executing database queries...');
    const [
      { data: timelineEvents, error: timelineError },
      { data: appointments, error: appointmentsError }
    ] = await Promise.all([
      timelineQuery.order('event_date', { ascending: false }),
      appointmentsQuery.order('appointment_date', { ascending: false })
    ]);

    if (timelineError) {
      console.error('Error fetching timeline events:', timelineError);
      console.log('🔍 Error details:', JSON.stringify(timelineError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch timeline events' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      console.log('🔍 Error details:', JSON.stringify(appointmentsError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Timeline events fetched successfully');
    console.log('📈 Number of timeline events:', timelineEvents?.length || 0);
    console.log('✅ Appointments fetched successfully');
    console.log('📈 Number of appointments:', appointments?.length || 0);

    // Transform timeline events
    console.log('🔄 Transforming timeline event data...');
    const transformedTimelineEvents = timelineEvents?.map((event) => ({
      ...event,
      patient_name: `${event.patients.first_name} ${event.patients.last_name}`,
      provider_name: event.provider?.full_name || null,
      source: 'timeline_event'
    })) || [];

    // Transform appointments to match timeline event format
    console.log('🔄 Transforming appointments data...');
    const transformedAppointments = appointments?.map((apt) => ({
      id: apt.id,
      clinic_id: apt.clinic_id,
      event_date: apt.appointment_date.split('T')[0],
      event_type: 'Appointment',
      title: apt.reason || 'Appointment',
      description: `Status: ${apt.status || 'Scheduled'} | Duration: ${apt.duration_minutes || 30} minutes`,
      severity: apt.status === 'Cancelled' ? 'Low' : 'Medium',
      provider_id: apt.provider_id,
      outcome: null,
      patient_id: apt.patient_id,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
      provider_name: apt.provider?.full_name || null,
      source: 'appointment',
      appointment_date: apt.appointment_date,
      status: apt.status
    })) || [];

    // Combine and sort all events by date
    const allEvents = [...transformedTimelineEvents, ...transformedAppointments]
      .sort((a, b) => {
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);
        return dateB.getTime() - dateA.getTime();
      });

    console.log('✅ Combined events count:', allEvents.length);

    console.log('✅ Data transformation complete');

    // Return in format expected by current API client
    console.log('📤 Sending response...');
    return new Response(JSON.stringify(allEvents), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_timeline_events:', error);
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
