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

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskData = await req.json();

    if (taskData.patient_id) {
      const { data: patient, error: patientError } = await supabaseClient
        .from('patients')
        .select('clinic_id')
        .eq('id', taskData.patient_id)
        .single();

      if (patientError || !patient || patient.clinic_id !== userProfile.clinic_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid patient or patient not in your clinic' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const newTask = {
      ...taskData,
      clinic_id: userProfile.clinic_id,
      created_by: userProfile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: task, error } = await supabaseClient
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to create task' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseClient
      .from('task_audit_trail')
      .insert({
        clinic_id: userProfile.clinic_id,
        task_id: task.id,
        action_type: 'created',
        changed_by: userProfile.id,
        new_values: task,
        created_at: new Date().toISOString()
      });

    return new Response(JSON.stringify(task), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
