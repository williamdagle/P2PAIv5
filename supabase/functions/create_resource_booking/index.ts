import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Get resource type to check if approval is required
    const { data: resource, error: resourceError } = await supabaseClient
      .from('resources')
      .select('id, resource_type:resource_types(requires_approval)')
      .eq('id', body.resource_id)
      .single();

    if (resourceError || !resource) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for conflicts
    const { data: conflicts } = await supabaseClient
      .from('resource_bookings')
      .select('id')
      .eq('resource_id', body.resource_id)
      .eq('booking_date', body.booking_date)
      .in('status', ['pending', 'confirmed'])
      .or(`start_time.lte.${body.end_time},end_time.gte.${body.start_time}`)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Time slot conflicts with existing booking' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requiresApproval = (resource.resource_type as any)?.requires_approval;
    const initialStatus = requiresApproval ? 'pending' : 'confirmed';

    const bookingData = {
      clinic_id: userProfile.clinic_id,
      resource_id: body.resource_id,
      patient_id: body.patient_id || null,
      booked_by_user_id: userProfile.id,
      booking_date: body.booking_date,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes,
      status: initialStatus,
      booking_source: body.booking_source || 'staff',
      notes: body.notes || null
    };

    const { data, error } = await supabaseClient
      .from('resource_bookings')
      .insert(bookingData)
      .select(`
        *,
        resource:resources(id, name, resource_type:resource_types(name)),
        patient:patients(id, first_name, last_name),
        booked_by:users!booked_by_user_id(full_name)
      `)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
