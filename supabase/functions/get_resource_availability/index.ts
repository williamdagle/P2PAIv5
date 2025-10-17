import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
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

    const url = new URL(req.url);
    const resource_id = url.searchParams.get('resource_id');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');

    if (!resource_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'resource_id, start_date, and end_date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get resource info
    const { data: resource, error: resourceError } = await supabaseClient
      .from('resources')
      .select(`
        *,
        resource_type:resource_types(*)
      `)
      .eq('id', resource_id)
      .eq('clinic_id', userProfile.clinic_id)
      .single();

    if (resourceError || !resource) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all bookings in date range
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('resource_bookings')
      .select('booking_date, start_time, end_time, status')
      .eq('resource_id', resource_id)
      .gte('booking_date', start_date)
      .lte('booking_date', end_date)
      .in('status', ['pending', 'confirmed'])
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (bookingsError) {
      return new Response(
        JSON.stringify({ error: bookingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get blackout periods
    const { data: blackouts, error: blackoutsError } = await supabaseClient
      .from('resource_blackouts')
      .select('blackout_date, start_time, end_time, reason')
      .eq('resource_id', resource_id)
      .gte('blackout_date', start_date)
      .lte('blackout_date', end_date)
      .order('blackout_date', { ascending: true });

    if (blackoutsError) {
      return new Response(
        JSON.stringify({ error: blackoutsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availability = {
      resource: {
        id: resource.id,
        name: resource.name,
        capacity: resource.capacity_override || (resource.resource_type as any)?.default_capacity || 1
      },
      date_range: {
        start_date,
        end_date
      },
      bookings: bookings || [],
      blackouts: blackouts || [],
      availability_schedule: resource.availability_schedule
    };

    return new Response(
      JSON.stringify(availability),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
