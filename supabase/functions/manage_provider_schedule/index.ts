import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('id, clinic_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userData) {
      throw new Error('User profile not found');
    }

    const method = req.method;
    const url = new URL(req.url);

    // GET - Retrieve provider schedule(s)
    if (method === 'GET') {
      const providerId = url.searchParams.get('provider_id');
      const scheduleId = url.searchParams.get('schedule_id');

      if (scheduleId) {
        // Get specific schedule
        const { data, error } = await supabase
          .from('provider_schedules')
          .select('*')
          .eq('id', scheduleId)
          .eq('clinic_id', userData.clinic_id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (providerId) {
        // Get all schedules for a provider
        const { data, error } = await supabase
          .from('provider_schedules')
          .select('*')
          .eq('provider_id', providerId)
          .eq('clinic_id', userData.clinic_id)
          .order('day_of_week')
          .order('start_time');

        if (error) throw error;
        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Get all schedules for the clinic
        const { data, error } = await supabase
          .from('provider_schedules')
          .select(`
            *,
            users!provider_id(id, full_name, email)
          `)
          .eq('clinic_id', userData.clinic_id)
          .order('provider_id')
          .order('day_of_week')
          .order('start_time');

        if (error) throw error;
        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST - Create new schedule
    if (method === 'POST') {
      const body = await req.json();
      const {
        provider_id,
        day_of_week,
        start_time,
        end_time,
        is_available,
        schedule_type,
        notes,
        effective_from,
        effective_until
      } = body;

      if (!provider_id || day_of_week === undefined || !start_time || !end_time) {
        throw new Error('Missing required fields');
      }

      const { data, error } = await supabase
        .from('provider_schedules')
        .insert({
          clinic_id: userData.clinic_id,
          provider_id,
          day_of_week,
          start_time,
          end_time,
          is_available: is_available !== false,
          schedule_type: schedule_type || 'working_hours',
          notes,
          effective_from: effective_from || new Date().toISOString().split('T')[0],
          effective_until
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update schedule
    if (method === 'PUT') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        throw new Error('Missing schedule id');
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('provider_schedules')
        .update(updates)
        .eq('id', id)
        .eq('clinic_id', userData.clinic_id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Remove schedule
    if (method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        throw new Error('Missing schedule id');
      }

      const { error } = await supabase
        .from('provider_schedules')
        .delete()
        .eq('id', id)
        .eq('clinic_id', userData.clinic_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Method not allowed');
  } catch (err) {
    console.error('Error in manage_provider_schedule:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
