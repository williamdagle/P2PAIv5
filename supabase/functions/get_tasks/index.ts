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

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const patient_id = url.searchParams.get('patient_id');
    const assigned_to = url.searchParams.get('assigned_to');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

    let query = supabaseClient
      .from('tasks')
      .select(`
        id,
        clinic_id,
        patient_id,
        title,
        description,
        status,
        priority,
        due_date,
        assigned_to,
        assigned_to_role,
        created_by,
        completed_at,
        completed_by,
        created_at,
        updated_at,
        patient:patients(id, first_name, last_name),
        assignee:users!assigned_to(id, full_name),
        creator:users!created_by(id, full_name)
      `)
      .eq('is_deleted', false);

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error } = await query.order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transformedTasks = tasks?.map((task) => ({
      ...task,
      patient_name: task.patient ? `${task.patient.first_name} ${task.patient.last_name}` : null,
      assignee_name: task.assignee?.full_name || null,
      creator_name: task.creator?.full_name || 'Unknown'
    })) || [];

    return new Response(JSON.stringify(transformedTasks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
