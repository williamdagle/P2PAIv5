import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS'
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

    const updateData = await req.json();
    const taskId = updateData.id;

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: oldTask, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !oldTask) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { id, clinic_id, created_by, created_at, ...updateFields } = updateData;
    updateFields.updated_at = new Date().toISOString();

    if (updateFields.status === 'completed' && !updateFields.completed_at) {
      updateFields.completed_at = new Date().toISOString();
      updateFields.completed_by = userProfile.id;
    }

    const { data: task, error } = await supabaseClient
      .from('tasks')
      .update(updateFields)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update task' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let actionType = 'updated';
    if (oldTask.status !== task.status) {
      actionType = 'status_changed';
    } else if (oldTask.assigned_to !== task.assigned_to) {
      actionType = 'reassigned';
    }

    await supabaseClient
      .from('task_audit_trail')
      .insert({
        clinic_id: oldTask.clinic_id,
        task_id: task.id,
        action_type: actionType,
        changed_by: userProfile.id,
        old_values: oldTask,
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
